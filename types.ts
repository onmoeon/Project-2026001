
export enum EnhancementType {
  CHILD_NARRATIVE = 'CHILD_NARRATIVE',
  TEACHER_EVALUATION = 'TEACHER_EVALUATION',
  CASE_HISTORY_NARRATIVE = 'CASE_HISTORY_NARRATIVE'
}

export interface PromptSetting {
  systemInstruction: string;
  promptTemplate: string;
}

export interface GlobalAIConfig {
  [EnhancementType.CHILD_NARRATIVE]: PromptSetting;
  [EnhancementType.TEACHER_EVALUATION]: PromptSetting;
  [EnhancementType.CASE_HISTORY_NARRATIVE]: PromptSetting;
}

export const DEFAULT_AI_CONFIG: GlobalAIConfig = {
  [EnhancementType.CHILD_NARRATIVE]: {
    systemInstruction: "You are a helpful assistant polishing text for a child's sponsorship report. You should adopt a simple  and positive tone suitable for a child when writing in first person, or a clear descriptive tone when describing surroundings.",
    promptTemplate: "Refine the following text. If the context implies a personal story or future aim, use the first person ('I am', 'I want'). If it is a description of a place (home, school), keep it descriptive. \n\nKeep the response strictly under 90 words. \nFormat as a single paragraph. \nReturn only the result.\n\nText: \"{{text}}\"\n\nContext: {{context}}"
  },
  [EnhancementType.TEACHER_EVALUATION]: {
    systemInstruction: "You are a school teacher writing a report card comment. Output ONLY the final text.",
    promptTemplate: "Rewrite the remarks to be professional, encouraging, and specific. Use standard educational phrasing. Keep the response strictly under 30 words. Format as a single paragraph. Return only the result.\n\nText: \"{{text}}\"\n\nContext: {{context}}"
  },
  [EnhancementType.CASE_HISTORY_NARRATIVE]: {
    systemInstruction: "You are a social worker preparing a case history profile for a child sponsorship program. Maintain a professional, empathetic, and descriptive tone.",
    promptTemplate: "Expand and polish the following details into a concise narrative paragraph. Ensure it flows well and highlights key details. \n\nKeep it under 60 words.\n\nText: \"{{text}}\"\n\nContext: {{context}}"
  }
};

export interface DossierProfile {
  // Header Info
  schoolName: string;

  // Left Column Bio
  childName: string;
  dob: string;
  sponsorshipCategory: string;
  gender: string;
  height: string;
  personality: string;
  fathersName: string;
  fathersStatus: string;
  familyIncomeSource: string;

  // Right Column Bio
  aidNo: string;
  donorAgency: string;
  aimInLife: string;
  grade: string;
  weight: string;
  academicYear: string;
  mothersName: string;
  mothersStatus: string;
  monthlyIncome: string;

  // Descriptive Fields
  aboutSelfAndFuture: string;
  homeDescription: string;
  schoolDescription: string;
  interestingStory: string;
  teachersRemarks: string;

  // Footer
  preparedBy: string;
  preparedDate: string;
}

export const INITIAL_DOSSIER: DossierProfile = {
  schoolName: 'Tongi Children Education Program',
  childName: '',
  dob: '',
  sponsorshipCategory: 'Day',
  gender: '',
  height: '',
  personality: '',
  fathersName: '',
  fathersStatus: '',
  familyIncomeSource: '',
  aidNo: '',
  donorAgency: 'ADRA Czech',
  aimInLife: '',
  grade: '',
  weight: '',
  academicYear: '2025',
  mothersName: '',
  mothersStatus: '',
  monthlyIncome: '',
  aboutSelfAndFuture: '',
  homeDescription: '',
  schoolDescription: '',
  interestingStory: '',
  teachersRemarks: '',
  preparedBy: '',
  preparedDate: new Date().toLocaleDateString('en-GB').replace(/\//g, '.') // Format DD.MM.YYYY
};

// --- New Case History Type ---

export interface CaseHistoryProfile {
  schoolName: string;
  childName: string;
  aidNo: string;
  donorAgency: string;
  sponsorshipCategory: string;
  aimInLife: string;
  dob: string;
  birthPlace: string;
  gender: string;
  grade: string;
  height: string;
  weight: string;
  languageKnown: string;
  hobby: string;
  fathersName: string;
  mothersName: string;
  fatherLiteracy: string;
  motherLiteracy: string;
  siblingsSisters: string;
  siblingsBrothers: string;
  familyIncomeSource: string;
  monthlyIncome: string;
  
  // Narratives
  childProfile: string;
  familyBackground: string;

  preparedBy: string;
  preparedDate: string;
}

export const INITIAL_CASE_HISTORY: CaseHistoryProfile = {
  schoolName: 'Tongi Children Education Program',
  childName: '',
  aidNo: '',
  donorAgency: 'ADRA Czech',
  sponsorshipCategory: 'Day',
  aimInLife: '',
  dob: '',
  birthPlace: '',
  gender: '',
  grade: '',
  height: '',
  weight: '',
  languageKnown: 'Bangla',
  hobby: '',
  fathersName: '',
  mothersName: '',
  fatherLiteracy: '',
  motherLiteracy: '',
  siblingsSisters: '',
  siblingsBrothers: '',
  familyIncomeSource: '',
  monthlyIncome: '',
  childProfile: '',
  familyBackground: '',
  preparedBy: '',
  preparedDate: new Date().toLocaleDateString('en-GB').replace(/\//g, '.')
};

// --- Auth & Config Types ---

export type Role = 'ADMIN' | 'USER';

export interface User {
  username: string; // UserID
  password: string; // In a real app, hash this!
  role: Role;
  name: string; // Full Name for "Prepared By"
  allowAI: boolean; // Enhancement Control
}

export interface SavedReport {
    id: string;
    created_by: string;
    report_type: 'APR' | 'CASE_HISTORY';
    aid: string;
    child_name: string;
    report_data: DossierProfile | CaseHistoryProfile;
    updated_at: string;
}

export interface AppSettings {
  aiConfig: GlobalAIConfig;
  defaultDossierValues: Partial<DossierProfile>;
  users: User[];
}

export const DEFAULT_USERS: User[] = [
  { username: 'admin', password: '123', role: 'ADMIN', name: 'System Administrator', allowAI: true },
  { username: 'user', password: '123', role: 'USER', name: 'General User', allowAI: false }
];
