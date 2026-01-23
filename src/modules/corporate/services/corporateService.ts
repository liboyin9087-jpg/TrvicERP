/**
 * 企業客戶管理服務層
 * Corporate Account Service Layer
 */

import { api, API_ENDPOINTS } from '../../../lib/api';
import type {
  CorporateAccount,
  CreateCorporateAccountData,
  UpdateCorporateAccountData,
  ContactPerson,
  CreateContactPersonData,
  UpdateContactPersonData,
  EngagementLog,
  CreateEngagementLogData,
} from '../../../core/types/corporate';

export class CorporateService {
  static async getAccounts(): Promise<{ data: CorporateAccount[] | null; error: any }> {
    return api.get<CorporateAccount[]>(API_ENDPOINTS.corporateAccounts.list);
  }

  static async getAccount(id: string): Promise<{ data: CorporateAccount | null; error: any }> {
    return api.get<CorporateAccount>(API_ENDPOINTS.corporateAccounts.detail(id));
  }

  static async createAccount(
    payload: CreateCorporateAccountData
  ): Promise<{ data: CorporateAccount | null; error: any }> {
    return api.post<CorporateAccount>(API_ENDPOINTS.corporateAccounts.create, payload);
  }

  static async updateAccount(
    id: string,
    payload: UpdateCorporateAccountData
  ): Promise<{ data: CorporateAccount | null; error: any }> {
    return api.patch<CorporateAccount>(API_ENDPOINTS.corporateAccounts.update(id), payload);
  }

  static async deleteAccount(id: string): Promise<{ data: null; error: any }> {
    return api.delete(API_ENDPOINTS.corporateAccounts.delete(id));
  }

  static async getContacts(
    accountId: string
  ): Promise<{ data: ContactPerson[] | null; error: any }> {
    return api.get<ContactPerson[]>(API_ENDPOINTS.corporateAccounts.contacts(accountId));
  }

  static async addContact(
    accountId: string,
    payload: CreateContactPersonData
  ): Promise<{ data: ContactPerson | null; error: any }> {
    return api.post<ContactPerson>(API_ENDPOINTS.corporateAccounts.contacts(accountId), payload);
  }

  static async updateContact(
    accountId: string,
    contactId: string,
    payload: UpdateContactPersonData
  ): Promise<{ data: ContactPerson | null; error: any }> {
    return api.patch<ContactPerson>(
      API_ENDPOINTS.corporateAccounts.contactDetail(accountId, contactId),
      payload
    );
  }

  static async deleteContact(
    accountId: string,
    contactId: string
  ): Promise<{ data: null; error: any }> {
    return api.delete(API_ENDPOINTS.corporateAccounts.contactDetail(accountId, contactId));
  }

  static async getEngagements(
    accountId: string
  ): Promise<{ data: EngagementLog[] | null; error: any }> {
    return api.get<EngagementLog[]>(API_ENDPOINTS.corporateAccounts.engagements(accountId));
  }

  static async addEngagement(
    accountId: string,
    payload: CreateEngagementLogData
  ): Promise<{ data: EngagementLog | null; error: any }> {
    return api.post<EngagementLog>(API_ENDPOINTS.corporateAccounts.engagements(accountId), payload);
  }
}

export default CorporateService;
