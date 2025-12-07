export enum MessageStatus {
  QUEUED = 'QUEUED',
  SENDING = 'SENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
  DELIVERED = 'DELIVERED'
}

export interface SMSMessage {
  id: string;
  recipient: string;
  content: string;
  status: MessageStatus;
  timestamp: number;
  aiOptimized?: boolean;
  batchId?: string;
}

export interface SecureLink {
  id: string;
  encryptedData: string; // Base64 for this demo
  createdAt: number;
  views: number;
  maxViews: number;
  isBurned: boolean;
}

export interface VaultItem {
  id: string;
  title: string;
  username?: string;
  password?: string;
  totpSecret?: string; // Base32 encoded secret
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

export interface DashboardStats {
  totalSms: number;
  deliveredSms: number;
  activeLinks: number;
  vaultItems: number;
}