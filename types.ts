export interface NavItem {
  label: string;
  href: string;
}

export interface Slide {
  title: string;
  content: string[];
  speakerNotes?: string;
  imageDescription?: string;
  imageUrl?: string;
}

export interface PdfState {
  file: File | null;
  base64: string | null;
}

export enum AppStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  GENERATING_IMAGES = 'GENERATING_IMAGES',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export interface User {
  id: string;
  name: string;
  email: string;
  plan: 'Free' | 'Pro' | 'Team';
  status: 'Active' | 'Inactive';
  lastLogin: string;
}

export interface ActivityLog {
  id: string;
  user: string;
  action: string;
  timestamp: string;
  status: 'Success' | 'Failed';
}

export interface Template {
  id: string;
  name: string;
  type: 'Free' | 'Pro';
  thumbnail: string;
  downloads: number;
}