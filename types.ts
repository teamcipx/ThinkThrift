export interface ActivityLog {
  date: string;
  action: string;
  details?: string;
}

export interface UserAccount {
  id: string;
  username: string;
  platform: 'Twitter' | 'Instagram' | 'LinkedIn' | 'TikTok';
  followers: number;
  engagementRate: number;
  status: 'Active' | 'Shadowbanned' | 'Suspended' | 'Verified';
  lastActive: string;
  bio: string;
  category: string;
  avatar: string;
  
  // Credentials & Contact
  realName?: string;
  email?: string;
  password?: string;
  twoFactorSecret?: string;
  phone?: string;
  website?: string;
  
  // Advanced Data
  country?: string;
  tags?: string[];
  isFavorite?: boolean;
  
  // New Fields
  isArchived?: boolean;
  accountManager?: string;
  targetAudience?: string;
  lastPostedDate?: string;
  creationDate?: string;
  notes?: string;
  
  // Activity History
  history?: ActivityLog[];
}

export interface AuthState {
  isAuthenticated: boolean;
  user: {
    uid: string;
    email: string | null;
    displayName: string | null;
  } | null;
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  ACCOUNTS = 'ACCOUNTS',
  SETTINGS = 'SETTINGS'
}

export interface AIAnalysisResult {
  sentiment: string;
  strengths: string[];
  weaknesses: string[];
  growthStrategy: string;
}