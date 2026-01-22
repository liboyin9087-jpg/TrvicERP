/**
 * 企業客戶管理核心類型
 * Corporate Account Core Types
 */

export type CorporateAccountStatus = 'active' | 'at_risk' | 'prospect';
export type ContactRole = 'decision_maker' | 'influencer' | 'user';
export type EngagementChannel = 'meeting' | 'email' | 'call';

export interface CorporateAccount {
  id: string;
  name: string;
  industry: string;
  size: string;
  status: CorporateAccountStatus;
  nextRenewal: string;
  pipelineValue: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCorporateAccountData {
  name: string;
  industry: string;
  size: string;
  status?: CorporateAccountStatus;
  nextRenewal?: string;
  pipelineValue?: number;
}

export interface UpdateCorporateAccountData {
  name?: string;
  industry?: string;
  size?: string;
  status?: CorporateAccountStatus;
  nextRenewal?: string;
  pipelineValue?: number;
}

export interface ContactPerson {
  id: string;
  accountId: string;
  name: string;
  title: string;
  role: ContactRole;
  concern: string;
  phone: string;
  email: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateContactPersonData {
  name: string;
  title: string;
  role: ContactRole;
  concern: string;
  phone: string;
  email: string;
}

export interface UpdateContactPersonData {
  name?: string;
  title?: string;
  role?: ContactRole;
  concern?: string;
  phone?: string;
  email?: string;
}

export interface EngagementLog {
  id: string;
  accountId: string;
  date: string;
  channel: EngagementChannel;
  summary: string;
  objections: string[];
  response: string;
  createdAt?: string;
}

export interface CreateEngagementLogData {
  date: string;
  channel: EngagementChannel;
  summary: string;
  objections: string[];
  response: string;
}
