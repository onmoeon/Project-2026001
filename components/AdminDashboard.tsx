
import React, { useState } from 'react';
import { AppSettings, User, DossierProfile, EnhancementType, GlobalAIConfig } from '../types';
import { Save, UserPlus, Trash2, Settings, FileText, Database, Home, GraduationCap, User as UserIcon, Pencil, X, Quote, FileSignature } from 'lucide-react';
import { DossierInput } from './DossierInput';

interface AdminDashboardProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onLogout: () => void;
  onOpenBuilder: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  settings, 
  onUpdateSettings,
  onLogout,
  onOpenBuilder
}) => {
  const [activeTab, setActiveTab] = useState<'DEFAULTS' | 'AI' | 'USERS'>('DEFAULTS');
  
  // Local state for editing to allow cancel/save pattern
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  
  // User Management State
  const [isEditing, setIsEditing] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserUser, setNewUserUser] = useState('');
  const [newUserPass, setNewUserPass] = useState('');
  const [newUserRole, setNewUserRole] = useState<'ADMIN' | 'USER'>('USER');
  const [newUserAllowAI, setNewUserAllowAI] = useState(true);

  const handleSave = () => {
    onUpdateSettings(localSettings);
    alert('Settings Saved Successfully');
  };

  const updateDefaultField = (field: keyof DossierProfile, value: string) => {
    setLocalSettings(prev => ({
      ...prev,
      defaultDossierValues: {
        ...prev.defaultDossierValues,
        [field]: value
      }
    }));
  };

  const updateAIConfig = (type: EnhancementType, field: 'systemInstruction' | 'promptTemplate', value: string) => {
    setLocalSettings(prev => ({
      ...prev,
      aiConfig: {
        ...prev.aiConfig,
        [type]: {
          ...prev.aiConfig[type],
          [field]: value
        }
      }
    }));
  };

  const handleUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if(!newUserUser || !newUserPass || !newUserName) return;
    
    if (isEditing) {
        // Update existing user
        setLocalSettings(prev => ({
            ...prev,
            users: prev.users.map(u => u.username === newUserUser ? {
                username: newUserUser, // ID remains same
                password: newUserPass,
                role: newUserRole,
                name: newUserName,
                allowAI: newUserAllowAI
            } : u)
        }));
        cancelEdit();
    } else {
        // Create new user
        if (localSettings.users.find(u => u.username === newUserUser)) {
            alert("Username (UserID) already exists");
            return;
        }

        const newUser: User = { 
            username: newUserUser, 
            password: newUserPass, 
            role: newUserRole,
            name: newUserName,
            allowAI: newUserAllowAI
        };

        setLocalSettings(prev => ({
            ...prev,
            users: [...prev.users, newUser]
        }));
        cancelEdit();
    }
  };

  const startEdit = (user: User) => {
      setIsEditing(true);
      setNewUserUser(user.username);
      setNewUserName(user.name);
      setNewUserPass(user.password);
      setNewUserRole(user.role);
      setNewUserAllowAI(user.allowAI ?? true); // Default true if undefined
  };

  const cancelEdit = () => {
      setIsEditing(false);
      setNewUserUser('');
      setNewUserName('');
      setNewUserPass('');
      setNewUserRole('USER');
      setNewUserAllowAI(true);
  };

  const removeUser = (username: string) => {
      if(username === 'admin') {
          alert("Cannot delete main admin");
          return;
      }
      if (confirm(`Are you sure you want to delete user ${username}?`)) {
        setLocalSettings(prev => ({
            ...prev,
            users: prev.users.filter(u => u.username !== username)
        }));
      }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Admin Header */}
      <header className="bg-slate-900 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
                <Settings className="w-6 h-6 text-green-400" />
                <h1 className="text-xl font-bold tracking-tight">System Administration</h1>
            </div>
            <div className="flex gap-4">
                <button onClick={onOpenBuilder} className="text-slate-300 hover:text-white text-sm font-medium">
                    Open Builder
                </button>
                <button onClick={onLogout} className="text-red-400 hover:text-red-300 text-sm font-medium">
                    Logout
                </button>
            </div>
        </div>
      </header>

      <div className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 flex flex-col md:flex-row gap-8">
        
        {/* Sidebar Tabs */}
        <div className="w-full md:w-64 flex-shrink-0">
            <nav className="space-y-1">
                <button
                    onClick={() => setActiveTab('DEFAULTS')}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === 'DEFAULTS' ? 'bg-white text-green-700 shadow-sm' : 'text-slate-600 hover:bg-slate-200'}`}
                >
                    <FileText className="w-4 h-4" />
                    General Defaults
                </button>
                <button
                    onClick={() => setActiveTab('AI')}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === 'AI' ? 'bg-white text-green-700 shadow-sm' : 'text-slate-600 hover:bg-slate-200'}`}
                >
                    <Database className="w-4 h-4" />
                    AI Configuration
                </button>
                <button
                    onClick={() => setActiveTab('USERS')}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === 'USERS' ? 'bg-white text-green-700 shadow-sm' : 'text-slate-600 hover:bg-slate-200'}`}
                >
                    <UserIcon className="w-4 h-4" />
                    User Management
                </button>
            </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 p-8">
            
            {/* --- DEFAULTS TAB --- */}
            {activeTab === 'DEFAULTS' && (
                <div className="space-y-6">
                    <div className="border-b border-slate-100 pb-4 mb-6">
                        <h2 className="text-lg font-bold text-slate-900">Default Field Values</h2>
                        <p className="text-sm text-slate-500">Set the initial values that appear when a user starts a new report.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <DossierInput 
                            label="Default School Name" 
                            value={localSettings.defaultDossierValues.schoolName || ''} 
                            onChange={(v) => updateDefaultField('schoolName', v)}
                        />
                         <DossierInput 
                            label="Default Donor Agency" 
                            value={localSettings.defaultDossierValues.donorAgency || ''} 
                            onChange={(v) => updateDefaultField('donorAgency', v)}
                        />
                         <DossierInput 
                            label="Default Academic Year" 
                            value={localSettings.defaultDossierValues.academicYear || ''} 
                            onChange={(v) => updateDefaultField('academicYear', v)}
                        />
                         <DossierInput 
                            label="Default Sponsorship Category" 
                            value={localSettings.defaultDossierValues.sponsorshipCategory || ''} 
                            onChange={(v) => updateDefaultField('sponsorshipCategory', v)}
                        />
                         <DossierInput 
                            label="Default Prepared By (Fallback)" 
                            value={localSettings.defaultDossierValues.preparedBy || ''} 
                            onChange={(v) => updateDefaultField('preparedBy', v)}
                        />
                         <DossierInput 
                            label="Default Date (String)" 
                            value={localSettings.defaultDossierValues.preparedDate || ''} 
                            onChange={(v) => updateDefaultField('preparedDate', v)}
                            placeholder="Leave empty for today's date"
                        />
                    </div>
                </div>
            )}

            {/* --- AI CONFIG TAB --- */}
            {activeTab === 'AI' && (
                <div className="space-y-6">
                    <div className="border-b border-slate-100 pb-4 mb-6">
                        <h2 className="text-lg font-bold text-slate-900">AI Personalization</h2>
                        <p className="text-sm text-slate-500">Customize prompts and system instructions for the generative areas.</p>
                    </div>

                    <div className="space-y-8">
                        {/* Child Narrative Config */}
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-5">
                            <div className="flex items-center gap-2 mb-4 text-orange-700">
                                <Quote className="w-5 h-5" />
                                <h3 className="font-bold">APR: Child's Narrative</h3>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-1">System Instruction (Persona)</label>
                                    <textarea 
                                    value={localSettings.aiConfig[EnhancementType.CHILD_NARRATIVE].systemInstruction}
                                    onChange={(e) => updateAIConfig(EnhancementType.CHILD_NARRATIVE, 'systemInstruction', e.target.value)}
                                    className="w-full text-sm border border-slate-300 rounded p-2 h-20 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    placeholder="Instruction for the AI about how to act"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-1">Prompt Template</label>
                                    <textarea 
                                    value={localSettings.aiConfig[EnhancementType.CHILD_NARRATIVE].promptTemplate}
                                    onChange={(e) => updateAIConfig(EnhancementType.CHILD_NARRATIVE, 'promptTemplate', e.target.value)}
                                    className="w-full text-sm border border-slate-300 rounded p-2 h-24 font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                            </div>
                        </div>

                         {/* Case History Narrative Config */}
                         <div className="bg-slate-50 border border-slate-200 rounded-lg p-5">
                            <div className="flex items-center gap-2 mb-4 text-blue-700">
                                <FileSignature className="w-5 h-5" />
                                <h3 className="font-bold">Case History: Narratives</h3>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-1">System Instruction (Persona)</label>
                                    <textarea 
                                    value={localSettings.aiConfig[EnhancementType.CASE_HISTORY_NARRATIVE]?.systemInstruction || ''}
                                    onChange={(e) => updateAIConfig(EnhancementType.CASE_HISTORY_NARRATIVE, 'systemInstruction', e.target.value)}
                                    className="w-full text-sm border border-slate-300 rounded p-2 h-20 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    placeholder="Instruction for the AI about how to act"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-1">Prompt Template</label>
                                    <textarea 
                                    value={localSettings.aiConfig[EnhancementType.CASE_HISTORY_NARRATIVE]?.promptTemplate || ''}
                                    onChange={(e) => updateAIConfig(EnhancementType.CASE_HISTORY_NARRATIVE, 'promptTemplate', e.target.value)}
                                    className="w-full text-sm border border-slate-300 rounded p-2 h-24 font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Teacher's Evaluation Config */}
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-5">
                            <div className="flex items-center gap-2 mb-4 text-green-700">
                                <GraduationCap className="w-5 h-5" />
                                <h3 className="font-bold">APR: Teacher's Evaluation</h3>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-1">System Instruction</label>
                                    <textarea 
                                    value={localSettings.aiConfig[EnhancementType.TEACHER_EVALUATION].systemInstruction}
                                    onChange={(e) => updateAIConfig(EnhancementType.TEACHER_EVALUATION, 'systemInstruction', e.target.value)}
                                    className="w-full text-sm border border-slate-300 rounded p-2 h-20 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-1">Prompt Template</label>
                                    <textarea 
                                    value={localSettings.aiConfig[EnhancementType.TEACHER_EVALUATION].promptTemplate}
                                    onChange={(e) => updateAIConfig(EnhancementType.TEACHER_EVALUATION, 'promptTemplate', e.target.value)}
                                    className="w-full text-sm border border-slate-300 rounded p-2 h-24 font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- USERS TAB --- */}
            {activeTab === 'USERS' && (
                <div className="space-y-6">
                    <div className="border-b border-slate-100 pb-4 mb-6">
                        <h2 className="text-lg font-bold text-slate-900">User Management</h2>
                        <p className="text-sm text-slate-500">Create, update, and remove system users.</p>
                    </div>

                    <div className={`p-4 rounded-lg border mb-6 transition-all ${isEditing ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50 border-slate-200'}`}>
                        <div className="flex justify-between items-center mb-3">
                            <h4 className={`text-sm font-bold ${isEditing ? 'text-indigo-800' : 'text-slate-700'}`}>
                                {isEditing ? 'Edit User' : 'Add New User'}
                            </h4>
                            {isEditing && (
                                <button onClick={cancelEdit} className="text-slate-500 hover:text-slate-700">
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                        <form onSubmit={handleUserSubmit} className="flex gap-3 items-end flex-wrap">
                            <div className="flex-1 min-w-[200px]">
                                <label className="block text-xs text-slate-500 mb-1">Full Name</label>
                                <input 
                                    type="text" 
                                    value={newUserName}
                                    onChange={e => setNewUserName(e.target.value)}
                                    className="w-full text-sm border border-slate-300 rounded px-3 py-2" 
                                    placeholder="John Doe"
                                    required
                                />
                            </div>
                            <div className="flex-1 min-w-[150px]">
                                <label className="block text-xs text-slate-500 mb-1">User ID (Username)</label>
                                <input 
                                    type="text" 
                                    value={newUserUser}
                                    onChange={e => setNewUserUser(e.target.value)}
                                    className="w-full text-sm border border-slate-300 rounded px-3 py-2 disabled:opacity-50" 
                                    placeholder="jdoe"
                                    required
                                    disabled={isEditing} // ID cannot be changed during edit
                                />
                            </div>
                            <div className="flex-1 min-w-[150px]">
                                <label className="block text-xs text-slate-500 mb-1">Password</label>
                                <input 
                                    type="text" 
                                    value={newUserPass}
                                    onChange={e => setNewUserPass(e.target.value)}
                                    className="w-full text-sm border border-slate-300 rounded px-3 py-2" 
                                    required
                                />
                            </div>
                             <div className="w-32">
                                <label className="block text-xs text-slate-500 mb-1">Role</label>
                                <select 
                                    value={newUserRole}
                                    onChange={e => setNewUserRole(e.target.value as any)}
                                    className="w-full text-sm border border-slate-300 rounded px-3 py-2" 
                                >
                                    <option value="USER">User</option>
                                    <option value="ADMIN">Admin</option>
                                </select>
                            </div>
                            
                            <div className="flex items-center pb-2">
                                <label className="flex items-center cursor-pointer relative">
                                    <input 
                                        type="checkbox"
                                        checked={newUserAllowAI}
                                        onChange={e => setNewUserAllowAI(e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600"></div>
                                    <span className="ml-2 text-xs font-medium text-slate-600">Allow AI</span>
                                </label>
                            </div>

                            <div className="flex gap-2">
                                {isEditing && (
                                    <button type="button" onClick={cancelEdit} className="bg-slate-500 text-white px-4 py-2 rounded text-sm hover:bg-slate-600">
                                        Cancel
                                    </button>
                                )}
                                <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700 flex items-center gap-2">
                                    {isEditing ? <Save className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                                    {isEditing ? 'Update' : 'Add'}
                                </button>
                            </div>
                        </form>
                    </div>

                    <div className="overflow-hidden border border-slate-200 rounded-lg">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">User ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Role</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">AI Access</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {localSettings.users.map((user) => (
                                    <tr key={user.username}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{user.username}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">{user.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'}`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                                            {user.allowAI ? (
                                                <span className="text-green-600 bg-green-50 px-2 py-0.5 rounded text-xs border border-green-200">Enabled</span>
                                            ) : (
                                                <span className="text-slate-400 bg-slate-50 px-2 py-0.5 rounded text-xs border border-slate-200">Disabled</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-end gap-3">
                                            <button onClick={() => startEdit(user)} className="text-indigo-600 hover:text-indigo-900">
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            {user.username !== 'admin' && (
                                                <button onClick={() => removeUser(user.username)} className="text-red-600 hover:text-red-900">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            
            {/* Footer Action Bar */}
            <div className="mt-8 pt-6 border-t border-slate-200 flex justify-end">
                <button 
                    onClick={handleSave}
                    className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-lg font-semibold shadow-md transition-all"
                >
                    <Save className="w-4 h-4" />
                    Save All Changes
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};
