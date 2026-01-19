
import React, { useState, useEffect } from 'react';
import { DossierInput } from './components/DossierInput';
import { Login } from './components/Login';
import { AdminDashboard } from './components/AdminDashboard';
import { 
  DossierProfile, 
  INITIAL_DOSSIER, 
  EnhancementType, 
  DEFAULT_AI_CONFIG, 
  AppSettings, 
  User,
  CaseHistoryProfile,
  INITIAL_CASE_HISTORY,
  PromptSetting
} from './types';
import { generateDossierDocx, generateCaseHistoryDocx } from './services/docxService';
import { supabase } from './services/supabaseClient';
import { FileDown, Sprout, LayoutTemplate, User as UserIcon, Quote, GraduationCap, PenTool, LogOut, Loader2, FileText, ClipboardList, Key, X } from 'lucide-react';

export const App: React.FC = () => {
  // --- State ---
  // 1. App Config State
  const [aiConfig, setAiConfig] = useState(DEFAULT_AI_CONFIG);
  const [defaultValues, setDefaultValues] = useState<Partial<DossierProfile>>({});
  const [userList, setUserList] = useState<User[]>([]); 
  
  // 2. Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loginError, setLoginError] = useState<string>('');
  
  // 3. View/Data State
  const [view, setView] = useState<'LOGIN' | 'DASHBOARD' | 'BUILDER'>('LOGIN');
  const [reportType, setReportType] = useState<'APR' | 'CASE_HISTORY'>('APR');
  const [data, setData] = useState<DossierProfile>(INITIAL_DOSSIER);
  const [cspData, setCspData] = useState<CaseHistoryProfile>(INITIAL_CASE_HISTORY);
  const [isGenerating, setIsGenerating] = useState(false);

  // 4. API Key State (RESTORED)
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [userApiKey, setUserApiKey] = useState<string>(() => localStorage.getItem('adra_user_api_key') || '');

  // --- Initialize ---
  const fetchAllSettings = async () => {
    try {
        // 1. Fetch General Defaults
        const { data: settingsData } = await supabase.from('app_settings').select('defaults').single();
        if (settingsData?.defaults) setDefaultValues(settingsData.defaults);

        // 2. Fetch AI Configs
        const { data: aiData } = await supabase.from('ai_configs').select('*');
        if (aiData && aiData.length > 0) {
            const newConfig = { ...DEFAULT_AI_CONFIG };
            aiData.forEach((row: any) => {
                if (newConfig[row.key as EnhancementType]) {
                    newConfig[row.key as EnhancementType] = {
                        systemInstruction: row.system_instruction,
                        promptTemplate: row.prompt_template
                    };
                }
            });
            setAiConfig(newConfig);
        }

        // 3. Fetch Users (FIXED MAPPING)
        const { data: userData } = await supabase.from('app_users').select('*').order('id');
        if (userData) {
            // Map snake_case from DB to camelCase for Application
            const mappedUsers: User[] = userData.map((u: any) => ({
                username: u.username,
                password: u.password,
                name: u.name,
                role: u.role,
                allowAI: u.allow_ai // This fixes the "Disabled" issue in Dashboard
            }));
            setUserList(mappedUsers);
        }

    } catch (err) {
        console.error("Error initializing app settings:", err);
    }
  };

  useEffect(() => {
    fetchAllSettings();
  }, []);

  const handleSaveApiKey = (key: string) => {
      setUserApiKey(key);
      localStorage.setItem('adra_user_api_key', key);
      setShowApiKeyModal(false);
  };

  // --- Auth Handler ---
  const handleLogin = async (u: string, p: string) => {
    setLoginError('');
    try {
        const { data, error } = await supabase
            .from('app_users')
            .select('*')
            .eq('username', u)
            .eq('password', p)
            .single();

        if (error || !data) {
            setLoginError('Invalid credentials');
            return;
        }

        const user: User = {
            username: data.username,
            password: data.password,
            name: data.name,
            role: data.role as 'ADMIN' | 'USER',
            allowAI: data.allow_ai
        };

        setCurrentUser(user);
        setupUserSession(user);

    } catch (err) {
        setLoginError('Login failed. Please check connection.');
    }
  };

  const setupUserSession = (user: User) => {
    setData(prev => ({
        ...prev,
        ...defaultValues,
        preparedBy: user.name,
        preparedDate: defaultValues.preparedDate || new Date().toLocaleDateString('en-GB').replace(/\//g, '.')
    }));

    setCspData(prev => ({
        ...prev,
        schoolName: defaultValues.schoolName || prev.schoolName,
        donorAgency: defaultValues.donorAgency || prev.donorAgency,
        sponsorshipCategory: defaultValues.sponsorshipCategory || prev.sponsorshipCategory,
        preparedBy: user.name,
        preparedDate: defaultValues.preparedDate || new Date().toLocaleDateString('en-GB').replace(/\//g, '.')
    }));

    setView(user.role === 'ADMIN' ? 'DASHBOARD' : 'BUILDER');
  };

  const handleLogout = () => {
      setCurrentUser(null);
      setView('LOGIN');
      setData(INITIAL_DOSSIER);
      setCspData(INITIAL_CASE_HISTORY);
  };

  // --- Admin Save Handlers ---
  const handleSaveDefaults = async (newDefaults: Partial<DossierProfile>) => {
      setDefaultValues(newDefaults);
      await supabase.from('app_settings').upsert({ id: 1, defaults: newDefaults });
  };

  const handleSaveAI = async (type: EnhancementType, setting: PromptSetting) => {
      // Update local state
      setAiConfig(prev => ({ ...prev, [type]: setting }));
      // Update DB
      await supabase.from('ai_configs').upsert({ 
          key: type, 
          system_instruction: setting.systemInstruction, 
          prompt_template: setting.promptTemplate 
      });
  };

  const handleSaveUser = async (user: User) => {
      const { error } = await supabase.from('app_users').upsert({
          username: user.username,
          password: user.password,
          name: user.name,
          role: user.role,
          allow_ai: user.allowAI // Map back to snake_case
      }, { onConflict: 'username' });

      if (!error) fetchAllSettings();
      else alert("Failed to save user: " + error.message);
  };

  const handleDeleteUser = async (username: string) => {
      const { error } = await supabase.from('app_users').delete().eq('username', username);
      if (!error) fetchAllSettings();
  };


  // --- Builder Handlers ---
  const updateField = (field: keyof DossierProfile, value: string) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const updateCspField = (field: keyof CaseHistoryProfile, value: string) => {
    setCspData(prev => ({ ...prev, [field]: value }));
  };

  const handleExport = async () => {
    setIsGenerating(true);
    try {
        await new Promise(resolve => setTimeout(resolve, 500));
        if (reportType === 'APR') {
            await generateDossierDocx(data);
        } else {
            await generateCaseHistoryDocx(cspData);
        }
    } catch (error) {
        console.error("Export failed", error);
        alert("Failed to generate document.");
    } finally {
        setIsGenerating(false);
    }
  };

  const childContext = reportType === 'APR' 
    ? `Child Name: ${data.childName}, Age/Grade: ${data.grade}, Aim: ${data.aimInLife}`
    : `Child Name: ${cspData.childName}, Grade: ${cspData.grade}, Aim: ${cspData.aimInLife}`;

  // --- Render ---

  if (view === 'LOGIN') {
      return <Login onLogin={handleLogin} error={loginError} />;
  }

  if (view === 'DASHBOARD' && currentUser?.role === 'ADMIN') {
      return (
          <AdminDashboard 
            defaults={defaultValues}
            aiConfig={aiConfig}
            userList={userList}
            onSaveDefaults={handleSaveDefaults}
            onSaveAI={handleSaveAI}
            onSaveUser={handleSaveUser}
            onDeleteUser={handleDeleteUser}
            onLogout={handleLogout}
            onOpenBuilder={() => setView('BUILDER')}
          />
      );
  }

  // --- BUILDER VIEW ---
  return (
    <div className="min-h-screen bg-slate-50 py-6 px-4 sm:px-6 lg:px-8 relative">
      
      {/* API Key Modal (RESTORED) */}
      {showApiKeyModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-md mx-4 animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-slate-900">Set Google Gemini API Key</h3>
                    <button onClick={() => setShowApiKeyModal(false)} className="text-slate-400 hover:text-slate-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <p className="text-sm text-slate-500 mb-4">
                    To use the AI enhancement features, please enter your Google Gemini API key. This key is stored in your browser's local storage.
                </p>
                <div className="space-y-4">
                    <input 
                        type="password" 
                        placeholder="AIzaSy..." 
                        className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 outline-none"
                        value={userApiKey}
                        onChange={(e) => handleSaveApiKey(e.target.value)}
                    />
                    <div className="flex justify-end gap-2">
                        <button 
                            onClick={() => setShowApiKeyModal(false)} 
                            className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 font-medium"
                        >
                            Close
                        </button>
                         <button 
                            onClick={() => setShowApiKeyModal(false)} 
                            className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 font-medium"
                        >
                            Done
                        </button>
                    </div>
                    <div className="pt-2 border-t border-slate-100">
                         <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-xs text-indigo-600 hover:underline">
                            Get a free API key here
                         </a>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Loading Overlay */}
      {isGenerating && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-white p-8 rounded-xl shadow-2xl flex flex-col items-center animate-in fade-in zoom-in duration-200 max-w-sm w-full mx-4">
                <Loader2 className="w-12 h-12 text-green-600 animate-spin mb-4" />
                <h3 className="text-lg font-bold text-slate-900">Generating Report</h3>
                <p className="text-slate-500 text-sm mt-2 text-center">Fetching assets and compiling your document. This may take a moment...</p>
            </div>
        </div>
      )}

      {/* Top Navigation / Action Bar */}
      <div className="max-w-[1600px] mx-auto mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-green-700 p-2 rounded-md text-white shadow-lg">
            <Sprout className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">ADRA Report Builder</h1>
            <p className="text-sm text-slate-500">
                Logged in as <span className="font-semibold">{currentUser?.name || currentUser?.username}</span>
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {currentUser?.role === 'ADMIN' && (
             <button onClick={() => setView('DASHBOARD')} className="text-slate-600 hover:text-slate-900 px-3 py-2 text-sm font-medium transition-colors">
                Dashboard
            </button>
          )}
          
          {/* Restored API Key Button */}
          <button 
            onClick={() => setShowApiKeyModal(true)} 
            className={`flex items-center gap-1 px-3 py-2 text-sm font-medium transition-colors border rounded ${userApiKey ? 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100' : 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100 animate-pulse'}`}
          >
            <Key className="w-4 h-4" />
            {userApiKey ? 'API Key Set' : 'Set API Key'}
          </button>

          <button onClick={handleLogout} className="text-red-600 hover:text-red-700 px-3 py-2 text-sm font-medium transition-colors flex items-center gap-1">
            <LogOut className="w-4 h-4" /> Logout
          </button>
          <button
            onClick={handleExport}
            disabled={isGenerating}
            className={`flex items-center justify-center gap-2 bg-green-700 hover:bg-green-800 text-white px-5 py-2.5 rounded shadow-sm transition-all font-medium text-sm ${isGenerating ? 'opacity-70 cursor-wait' : ''}`}
          >
            <FileDown className="w-4 h-4" />
            {isGenerating ? 'Exporting...' : 'Export Report'}
          </button>
        </div>
      </div>

      {/* Report Type Selector Tabs */}
      <div className="max-w-[1600px] mx-auto mb-6">
        <div className="flex gap-2 border-b border-slate-200">
            <button 
                onClick={() => setReportType('APR')}
                className={`flex items-center gap-2 px-6 py-3 text-sm font-medium rounded-t-lg transition-colors ${reportType === 'APR' ? 'bg-white border border-slate-200 border-b-white text-green-700' : 'bg-slate-100 text-slate-500 hover:text-slate-700'}`}
            >
                <ClipboardList className="w-4 h-4" />
                Annual Progress Report
            </button>
            <button 
                onClick={() => setReportType('CASE_HISTORY')}
                className={`flex items-center gap-2 px-6 py-3 text-sm font-medium rounded-t-lg transition-colors ${reportType === 'CASE_HISTORY' ? 'bg-white border border-slate-200 border-b-white text-green-700' : 'bg-slate-100 text-slate-500 hover:text-slate-700'}`}
            >
                <FileText className="w-4 h-4" />
                Case History Profile
            </button>
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Column - Form Inputs */}
        <div className="space-y-6 h-full overflow-y-auto pr-2 pb-20">
          
          {/* --- APR FORM --- */}
          {reportType === 'APR' && (
            <>
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 px-6 py-3 border-b border-slate-100">
                <h2 className="text-xs font-bold text-green-700 uppercase tracking-wide">General Info</h2>
                </div>
                <div className="p-6">
                    <DossierInput 
                      label="Name of School" 
                      value={data.schoolName} 
                      onChange={(v) => updateField('schoolName', v)}
                      userCanEnhance={currentUser?.allowAI}
                      apiKey={userApiKey}
                    />
                </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 px-6 py-3 border-b border-slate-100 flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-green-600" />
                <h2 className="text-xs font-bold text-green-700 uppercase tracking-wide">Child Information</h2>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                <div className="space-y-3">
                    <DossierInput label="Name of Child" value={data.childName} onChange={(v) => updateField('childName', v)} userCanEnhance={currentUser?.allowAI} apiKey={userApiKey} />
                    <DossierInput label="Date of Birth" value={data.dob} onChange={(v) => updateField('dob', v)} placeholder="DD/MM/YYYY" userCanEnhance={currentUser?.allowAI} apiKey={userApiKey} />
                    <DossierInput label="Sponsorship Category" value={data.sponsorshipCategory} onChange={(v) => updateField('sponsorshipCategory', v)} userCanEnhance={currentUser?.allowAI} apiKey={userApiKey} />
                    <div className="grid grid-cols-2 gap-2">
                        <DossierInput label="Gender" value={data.gender} onChange={(v) => updateField('gender', v)} userCanEnhance={currentUser?.allowAI} apiKey={userApiKey} />
                        <DossierInput label="Height (cm)" value={data.height} onChange={(v) => updateField('height', v)} userCanEnhance={currentUser?.allowAI} apiKey={userApiKey} />
                    </div>
                    <DossierInput label="Personality" value={data.personality} onChange={(v) => updateField('personality', v)} userCanEnhance={currentUser?.allowAI} apiKey={userApiKey} />
                    <DossierInput label="Father's Name" value={data.fathersName} onChange={(v) => updateField('fathersName', v)} userCanEnhance={currentUser?.allowAI} apiKey={userApiKey} />
                    <DossierInput label="Father's Status" value={data.fathersStatus} onChange={(v) => updateField('fathersStatus', v)} userCanEnhance={currentUser?.allowAI} apiKey={userApiKey} />
                    <DossierInput label="Family Income Source" value={data.familyIncomeSource} onChange={(v) => updateField('familyIncomeSource', v)} userCanEnhance={currentUser?.allowAI} apiKey={userApiKey} />
                </div>
                <div className="space-y-3">
                    <DossierInput label="Aid No" value={data.aidNo} onChange={(v) => updateField('aidNo', v)} placeholder="AC-TON-XXXX" userCanEnhance={currentUser?.allowAI} apiKey={userApiKey} />
                    <DossierInput label="Donor Agency" value={data.donorAgency} onChange={(v) => updateField('donorAgency', v)} userCanEnhance={currentUser?.allowAI} apiKey={userApiKey} />
                    <DossierInput label="Aim in Life" value={data.aimInLife} onChange={(v) => updateField('aimInLife', v)} userCanEnhance={currentUser?.allowAI} apiKey={userApiKey} />
                    <div className="grid grid-cols-2 gap-2">
                        <DossierInput label="Grade" value={data.grade} onChange={(v) => updateField('grade', v)} userCanEnhance={currentUser?.allowAI} apiKey={userApiKey} />
                        <DossierInput label="Weight (kg)" value={data.weight} onChange={(v) => updateField('weight', v)} userCanEnhance={currentUser?.allowAI} apiKey={userApiKey} />
                    </div>
                    <DossierInput label="Academic Year" value={data.academicYear} onChange={(v) => updateField('academicYear', v)} userCanEnhance={currentUser?.allowAI} apiKey={userApiKey} />
                    <DossierInput label="Mother's Name" value={data.mothersName} onChange={(v) => updateField('mothersName', v)} userCanEnhance={currentUser?.allowAI} apiKey={userApiKey} />
                    <DossierInput label="Mother's Status" value={data.mothersStatus} onChange={(v) => updateField('mothersStatus', v)} userCanEnhance={currentUser?.allowAI} apiKey={userApiKey} />
                    <DossierInput label="Monthly Income (BDT)" value={data.monthlyIncome} onChange={(v) => updateField('monthlyIncome', v)} userCanEnhance={currentUser?.allowAI} apiKey={userApiKey} />
                </div>
                </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 px-6 py-3 border-b border-slate-100 flex items-center gap-2">
                <Quote className="w-4 h-4 text-green-600" />
                <h2 className="text-xs font-bold text-green-700 uppercase tracking-wide">Child's Narrative</h2>
                </div>
                <div className="p-6 space-y-4">
                    <DossierInput label="Write about yourself and your future" value={data.aboutSelfAndFuture} onChange={(v) => updateField('aboutSelfAndFuture', v)} type="textarea" enableAI={true} aiConfig={aiConfig[EnhancementType.CHILD_NARRATIVE]} context={childContext} userCanEnhance={currentUser?.allowAI} apiKey={userApiKey} />
                    <DossierInput label="Brief description about your home..." value={data.homeDescription} onChange={(v) => updateField('homeDescription', v)} type="textarea" enableAI={true} aiConfig={aiConfig[EnhancementType.CHILD_NARRATIVE]} context={childContext} userCanEnhance={currentUser?.allowAI} apiKey={userApiKey} />
                    <DossierInput label="Short description of your school..." value={data.schoolDescription} onChange={(v) => updateField('schoolDescription', v)} type="textarea" enableAI={true} aiConfig={aiConfig[EnhancementType.CHILD_NARRATIVE]} context={childContext} userCanEnhance={currentUser?.allowAI} apiKey={userApiKey} />
                    <DossierInput label="Interesting story/experience..." value={data.interestingStory} onChange={(v) => updateField('interestingStory', v)} type="textarea" enableAI={true} aiConfig={aiConfig[EnhancementType.CHILD_NARRATIVE]} context={childContext} userCanEnhance={currentUser?.allowAI} apiKey={userApiKey} />
                </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 px-6 py-3 border-b border-slate-100 flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-green-600" />
                <h2 className="text-xs font-bold text-green-700 uppercase tracking-wide">Teacher's Evaluation</h2>
                </div>
                <div className="p-6">
                    <DossierInput label="Teacher's remarks" value={data.teachersRemarks} onChange={(v) => updateField('teachersRemarks', v)} type="textarea" enableAI={true} aiConfig={aiConfig[EnhancementType.TEACHER_EVALUATION]} context={childContext} userCanEnhance={currentUser?.allowAI} apiKey={userApiKey} />
                </div>
            </div>
            </>
          )}

          {/* --- CASE HISTORY FORM --- */}
          {reportType === 'CASE_HISTORY' && (
            <>
             <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 px-6 py-3 border-b border-slate-100">
                <h2 className="text-xs font-bold text-green-700 uppercase tracking-wide">Identity</h2>
                </div>
                <div className="p-6 space-y-3">
                    <DossierInput label="Name of Child" value={cspData.childName} onChange={(v) => updateCspField('childName', v)} userCanEnhance={currentUser?.allowAI} apiKey={userApiKey} />
                    <DossierInput label="Name of School" value={cspData.schoolName} onChange={(v) => updateCspField('schoolName', v)} userCanEnhance={currentUser?.allowAI} apiKey={userApiKey} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <DossierInput label="Code / Aid No" value={cspData.aidNo} onChange={(v) => updateCspField('aidNo', v)} placeholder="AC-TON-XXXX" userCanEnhance={currentUser?.allowAI} apiKey={userApiKey} />
                        <DossierInput label="Donor Agency" value={cspData.donorAgency} onChange={(v) => updateCspField('donorAgency', v)} userCanEnhance={currentUser?.allowAI} apiKey={userApiKey} />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 px-6 py-3 border-b border-slate-100 flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-green-600" />
                <h2 className="text-xs font-bold text-green-700 uppercase tracking-wide">Personal Details</h2>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                    <DossierInput label="Sponsorship Category" value={cspData.sponsorshipCategory} onChange={(v) => updateCspField('sponsorshipCategory', v)} userCanEnhance={currentUser?.allowAI} apiKey={userApiKey} />
                    <DossierInput label="Aim in Life" value={cspData.aimInLife} onChange={(v) => updateCspField('aimInLife', v)} userCanEnhance={currentUser?.allowAI} apiKey={userApiKey} />
                    <DossierInput label="Date of Birth" value={cspData.dob} onChange={(v) => updateCspField('dob', v)} placeholder="DD/MM/YYYY" userCanEnhance={currentUser?.allowAI} apiKey={userApiKey} />
                    <DossierInput label="Birth Place" value={cspData.birthPlace} onChange={(v) => updateCspField('birthPlace', v)} userCanEnhance={currentUser?.allowAI} apiKey={userApiKey} />
                    
                    <div className="grid grid-cols-2 gap-2">
                         <DossierInput label="Gender" value={cspData.gender} onChange={(v) => updateCspField('gender', v)} userCanEnhance={currentUser?.allowAI} apiKey={userApiKey} />
                         <DossierInput label="Grade" value={cspData.grade} onChange={(v) => updateCspField('grade', v)} userCanEnhance={currentUser?.allowAI} apiKey={userApiKey} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <DossierInput label="Height (cm)" value={cspData.height} onChange={(v) => updateCspField('height', v)} userCanEnhance={currentUser?.allowAI} apiKey={userApiKey} />
                        <DossierInput label="Weight (kg)" value={cspData.weight} onChange={(v) => updateCspField('weight', v)} userCanEnhance={currentUser?.allowAI} apiKey={userApiKey} />
                    </div>

                    <DossierInput label="Language Known" value={cspData.languageKnown} onChange={(v) => updateCspField('languageKnown', v)} userCanEnhance={currentUser?.allowAI} apiKey={userApiKey} />
                    <DossierInput label="Hobby" value={cspData.hobby} onChange={(v) => updateCspField('hobby', v)} userCanEnhance={currentUser?.allowAI} apiKey={userApiKey} />
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 px-6 py-3 border-b border-slate-100 flex items-center gap-2">
                <Quote className="w-4 h-4 text-green-600" />
                <h2 className="text-xs font-bold text-green-700 uppercase tracking-wide">Family Info</h2>
                </div>
                <div className="p-6 space-y-3">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <DossierInput label="Father's Name" value={cspData.fathersName} onChange={(v) => updateCspField('fathersName', v)} userCanEnhance={currentUser?.allowAI} apiKey={userApiKey} />
                        <DossierInput label="Literacy of Father" value={cspData.fatherLiteracy} onChange={(v) => updateCspField('fatherLiteracy', v)} userCanEnhance={currentUser?.allowAI} apiKey={userApiKey} />
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <DossierInput label="Mother's Name" value={cspData.mothersName} onChange={(v) => updateCspField('mothersName', v)} userCanEnhance={currentUser?.allowAI} apiKey={userApiKey} />
                        <DossierInput label="Literacy of Mother" value={cspData.motherLiteracy} onChange={(v) => updateCspField('motherLiteracy', v)} userCanEnhance={currentUser?.allowAI} apiKey={userApiKey} />
                     </div>
                     
                     <div className="p-3 bg-slate-50 rounded border border-slate-200">
                         <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Siblings Count</label>
                         <div className="flex gap-4">
                             <div className="flex-1">
                                <span className="text-xs text-slate-400 mr-2">Sisters (S-):</span>
                                <input type="text" value={cspData.siblingsSisters} onChange={e => updateCspField('siblingsSisters', e.target.value)} className="w-16 border border-slate-300 rounded px-2 py-1 text-sm" placeholder="#" />
                             </div>
                             <div className="flex-1">
                                <span className="text-xs text-slate-400 mr-2">Brothers (B-):</span>
                                <input type="text" value={cspData.siblingsBrothers} onChange={e => updateCspField('siblingsBrothers', e.target.value)} className="w-16 border border-slate-300 rounded px-2 py-1 text-sm" placeholder="#" />
                             </div>
                         </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <DossierInput label="Family Income Source" value={cspData.familyIncomeSource} onChange={(v) => updateCspField('familyIncomeSource', v)} userCanEnhance={currentUser?.allowAI} apiKey={userApiKey} />
                        <DossierInput label="Monthly Income (BDT)" value={cspData.monthlyIncome} onChange={(v) => updateCspField('monthlyIncome', v)} userCanEnhance={currentUser?.allowAI} apiKey={userApiKey} />
                     </div>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 px-6 py-3 border-b border-slate-100 flex items-center gap-2">
                <Quote className="w-4 h-4 text-green-600" />
                <h2 className="text-xs font-bold text-green-700 uppercase tracking-wide">Narratives</h2>
                </div>
                <div className="p-6 space-y-4">
                    <DossierInput 
                        label="Child Profile" 
                        value={cspData.childProfile} 
                        onChange={(v) => updateCspField('childProfile', v)} 
                        type="textarea" 
                        enableAI={true} 
                        aiConfig={aiConfig[EnhancementType.CASE_HISTORY_NARRATIVE]} 
                        context={childContext} 
                        placeholder="Write a descriptive profile of the child..."
                        userCanEnhance={currentUser?.allowAI}
                        apiKey={userApiKey}
                    />
                    <DossierInput 
                        label="Family Background" 
                        value={cspData.familyBackground} 
                        onChange={(v) => updateCspField('familyBackground', v)} 
                        type="textarea" 
                        enableAI={true} 
                        aiConfig={aiConfig[EnhancementType.CASE_HISTORY_NARRATIVE]} 
                        context={childContext} 
                        placeholder="Describe the family's situation..."
                        userCanEnhance={currentUser?.allowAI}
                        apiKey={userApiKey}
                    />
                </div>
            </div>
            </>
          )}

          {/* Footer Info (Shared) */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
             <div className="bg-slate-50 px-6 py-3 border-b border-slate-100 flex items-center gap-2">
              <PenTool className="w-4 h-4 text-green-600" />
              <h2 className="text-xs font-bold text-green-700 uppercase tracking-wide">Signatories</h2>
            </div>
             <div className="p-6 grid grid-cols-2 gap-8">
                <DossierInput 
                  label="Prepared By" 
                  value={reportType === 'APR' ? data.preparedBy : cspData.preparedBy} 
                  onChange={(v) => reportType === 'APR' ? updateField('preparedBy', v) : updateCspField('preparedBy', v)}
                  userCanEnhance={currentUser?.allowAI}
                  apiKey={userApiKey}
                />
                 <DossierInput 
                  label="Prepared Date" 
                  value={reportType === 'APR' ? data.preparedDate : cspData.preparedDate} 
                  onChange={(v) => reportType === 'APR' ? updateField('preparedDate', v) : updateCspField('preparedDate', v)}
                  userCanEnhance={currentUser?.allowAI}
                  apiKey={userApiKey}
                />
             </div>
          </div>

        </div>

        {/* Right Column - Live Preview */}
        <div className="space-y-6">
          <div className="sticky top-6">
            <div className="bg-white rounded-lg shadow-lg border border-slate-200 p-6">
              <div className="flex items-center gap-2 mb-4 text-slate-900">
                <LayoutTemplate className="w-5 h-5 text-green-700" />
                <h3 className="font-bold">Live Preview ({reportType === 'APR' ? 'APR' : 'Case History'})</h3>
              </div>
              
              <div className="bg-white border border-slate-200 p-6 rounded-sm text-[10px] leading-snug font-serif text-black h-[85vh] overflow-y-auto shadow-inner relative">
                
                <div className="text-center mb-4">
                  <div className="flex items-center justify-center gap-3 mb-1">
                    <img 
                      src="https://adra.org.nz/wp-content/uploads/2021/08/ADRA-Horizontal-Logo.png" 
                      alt="ADRA Logo" 
                      className="h-10 w-auto object-contain"
                    />
                    <div className="text-[10px] font-bold text-slate-800">
                      Adventist Development and Relief Agency Bangladesh
                    </div>
                  </div>
                  <h4 className="font-bold text-sm mt-3">
                      {reportType === 'APR' ? 'Child Annual Progress Report (APR) 2025' : 'Child Sponsorship Profile/Case History'}
                  </h4>
                </div>

                {reportType === 'APR' ? (
                    // --- APR PREVIEW ---
                    <>
                        <div className="mb-4 font-bold">
                        Name of School: <span className="font-normal">{data.schoolName}</span>
                        </div>
                        <div className="flex gap-2 mb-6">

                         {/* Left column */}
                        <div className="w-[40%] space-y-1">
                            <p><strong>Name of Child:</strong> {data.childName}</p>
                            <p><strong>Date of Birth:</strong> {data.dob}</p>
                            <p><strong>Sponsorship Category:</strong> {data.sponsorshipCategory}</p>
                            <p><strong>Gender:</strong> {data.gender}</p>
                            <p><strong>Height:</strong> {data.height} cm</p>
                            <p><strong>Personality:</strong> {data.personality}</p>
                            <p><strong>Father's Name:</strong> {data.fathersName}</p>
                            <p><strong>Father's Status:</strong> {data.fathersStatus}</p>
                            <p><strong>Income Source:</strong> {data.familyIncomeSource}</p>
                        </div>
                        {/* Middle column */}
                        <div className="w-[40%] space-y-1">
                            <p><strong>Aid No:</strong> {data.aidNo}</p>
                            <p><strong>Donor Agency:</strong> {data.donorAgency}</p>
                            <p><strong>Aim in Life:</strong> {data.aimInLife}</p>
                            <p><strong>Grade:</strong> {data.grade}</p>
                            <p><strong>Weight:</strong> {data.weight} kg</p>
                            <p><strong>Academic Year:</strong> {data.academicYear}</p>
                            <p><strong>Mother's Name:</strong> {data.mothersName}</p>
                            <p><strong>Mother's Status:</strong> {data.mothersStatus}</p>
                            <p><strong>Income (BDT):</strong> {data.monthlyIncome}</p>
                        </div>
                        <div className="w-[20%]">
                             <div className="border border-black h-48 w-full flex items-center justify-center text-[8px] text-gray-400">
                               Picture
                             </div>
                             <p className="text-center mt-1 text-[8px] font-bold">Profile Picture</p>
                        </div>
                        </div>
                        <div className="space-y-4">
                        <div><p className="font-bold">Write about yourself and your future:</p><p>{data.aboutSelfAndFuture}</p></div>
                        <div><p className="font-bold">Brief description about your home...</p><p>{data.homeDescription}</p></div>
                        <div><p className="font-bold">Short description of your school...</p><p>{data.schoolDescription}</p></div>
                        <div><p className="font-bold">What interesting story/experience...</p><p>{data.interestingStory}</p></div>
                        <div><p className="font-bold">Teacher's remarks about the child:</p><p>{data.teachersRemarks}</p></div>
                        </div>
                    </>
                ) : (
                    // --- CASE HISTORY PREVIEW ---
                    <>
                    <div className="mb-4 font-bold">
                        
                        <p><strong>Name of Child: </strong> <span className="font-normal">{cspData.childName}</span></p>
                        <p><strong>Name of School: </strong> <span className="font-normal">{cspData.schoolName}</span></p>
                        </div>
                    <div className="flex gap-2 mb-6">

                        {/* Left column */}
                        <div className="w-[70%] space-y-1">
                          
                          <div className="flex justify-between gap-2">
                              <span><strong>Code / Aid No:</strong> {cspData.aidNo}</span>
                              <span><strong>Donor Agency:</strong> {cspData.donorAgency}</span>
                          </div>
                          <div className="flex justify-between gap-2">
                              <span><strong>Sponsorship Category:</strong> {cspData.sponsorshipCategory}</span>
                              <span><strong>Aim in Life:</strong> {cspData.aimInLife}</span>
                          </div>
                          <div className="flex justify-between gap-2">
                              <span><strong>Date of Birth:</strong> {cspData.dob}</span>
                              <span><strong>Birth Place:</strong> {cspData.birthPlace}</span>
                          </div>
                          <div className="flex justify-between gap-2">
                              <span><strong>Gender:</strong> {cspData.gender}</span>
                              <span><strong>Grade:</strong> {cspData.grade}</span>
                          </div>
                          <div className="flex justify-between gap-2">
                              <span><strong>Height:</strong> {cspData.height} cm</span>
                              <span><strong>Weight:</strong> {cspData.weight} kg</span>
                          </div>
                          <div className="flex justify-between gap-2">
                              <span><strong>Language Known:</strong> {cspData.languageKnown}</span>
                              <span><strong>Hobby:</strong> {cspData.hobby}</span>
                          </div>

                          <p><strong>Father's Name:</strong> {cspData.fathersName}</p>
                          <p><strong>Mother's Name:</strong> {cspData.mothersName}</p>
                          <p><strong>Literacy of Father:</strong> {cspData.fatherLiteracy}</p>
                          <p><strong>Literacy of Mother:</strong> {cspData.motherLiteracy}</p>
                          <p><strong>Siblings:</strong> S- {cspData.siblingsSisters || '_'}, B- {cspData.siblingsBrothers || '_'}</p>
                          
                          <div className="flex justify-between gap-2 mt-2">
                                <span><strong>Family Income Source:</strong> {cspData.familyIncomeSource}</span>
                                <span><strong>Monthly Income (BDT):</strong> {cspData.monthlyIncome}</span>
                          </div>
                        </div>
                        
                        {/* Right column */}
                        <div className="w-[30%]">
                             <div className="border border-black h-48 w-full flex items-center justify-center text-[8px] text-gray-400">
                               Picture
                             </div>
                             <p className="text-center mt-1 text-[8px] font-bold">Profile Picture</p>
                        </div>
                    </div>
                    
                    <div className="space-y-4">
                         <div><p className="font-bold">Child Profile:</p><p>{cspData.childProfile}</p></div>
                         <div><p className="font-bold">Family Background:</p><p>{cspData.familyBackground}</p></div>
                    </div>
                    </>
                )}

                <div className="mt-8 flex justify-between pt-4 border-t border-gray-100">
                  <p><strong>Prepared By:</strong> {reportType === 'APR' ? data.preparedBy : cspData.preparedBy}</p>
                  <p><strong>Prepared Date:</strong> {reportType === 'APR' ? data.preparedDate : cspData.preparedDate}</p>
                </div>

              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
