/**
 * Database Service - Supabase 資料庫操作
 * 
 * 統一的資料庫存取層，取代 mockDataService
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ==============================================
// Supabase Client
// ==============================================

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const isConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase: SupabaseClient | null = isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// ==============================================
// Types
// ==============================================

export interface Trip {
  id: string;
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  headcount: number;
  status: 'draft' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  basePrice: number;
  currency: string;
  agencyId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RFP {
  id: string;
  companyName: string;
  contactPerson: string;
  contactEmail: string;
  headcount: number;
  budgetMin: number;
  budgetMax: number;
  destination: string;
  duration: number;
  departureDate?: string;
  deadline: string;
  specialRequirements?: string;
  notes?: string;
  status: 'pending' | 'quoted' | 'won' | 'lost';
  createdAt: string;
  updatedAt: string;
}

export interface Voting {
  id: string;
  title: string;
  description?: string;
  options: VotingOption[];
  deadline: string;
  status: 'active' | 'closed';
  createdBy: string;
  createdAt: string;
}

export interface VotingOption {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  votes: number;
}

export interface SupplierWarning {
  id: string;
  supplierName: string;
  supplierType: string;
  reason: string;
  severity: 'low' | 'medium' | 'high';
  reportedBy: string;
  verified: boolean;
  createdAt: string;
}

// ==============================================
// Generic CRUD Operations
// ==============================================

async function handleError<T>(promise: Promise<{ data: T | null; error: any }>): Promise<T> {
  const { data, error } = await promise;
  if (error) throw new Error(error.message);
  if (!data) throw new Error('No data returned');
  return data;
}

// ==============================================
// Trip Operations
// ==============================================

export const TripService = {
  async getAll(): Promise<Trip[]> {
    if (!supabase) return [];
    return handleError(
      supabase.from('trips').select('*').order('created_at', { ascending: false })
    );
  },

  async getById(id: string): Promise<Trip | null> {
    if (!supabase) return null;
    const { data } = await supabase.from('trips').select('*').eq('id', id).single();
    return data;
  },

  async create(trip: Omit<Trip, 'id' | 'createdAt' | 'updatedAt'>): Promise<Trip> {
    if (!supabase) throw new Error('Database not configured');
    return handleError(
      supabase.from('trips').insert(trip).select().single()
    );
  },

  async update(id: string, updates: Partial<Trip>): Promise<Trip> {
    if (!supabase) throw new Error('Database not configured');
    return handleError(
      supabase.from('trips').update(updates).eq('id', id).select().single()
    );
  },

  async delete(id: string): Promise<void> {
    if (!supabase) throw new Error('Database not configured');
    const { error } = await supabase.from('trips').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },
};

// ==============================================
// RFP Operations
// ==============================================

export const RFPService = {
  async getAll(): Promise<RFP[]> {
    if (!supabase) return [];
    return handleError(
      supabase.from('rfps').select('*').order('deadline', { ascending: true })
    );
  },

  async getById(id: string): Promise<RFP | null> {
    if (!supabase) return null;
    const { data } = await supabase.from('rfps').select('*').eq('id', id).single();
    return data;
  },

  async create(rfp: Omit<RFP, 'id' | 'createdAt' | 'updatedAt'>): Promise<RFP> {
    if (!supabase) throw new Error('Database not configured');
    return handleError(
      supabase.from('rfps').insert(rfp).select().single()
    );
  },

  async update(id: string, updates: Partial<RFP>): Promise<RFP> {
    if (!supabase) throw new Error('Database not configured');
    return handleError(
      supabase.from('rfps').update(updates).eq('id', id).select().single()
    );
  },

  async delete(id: string): Promise<void> {
    if (!supabase) throw new Error('Database not configured');
    const { error } = await supabase.from('rfps').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },
};

// ==============================================
// Voting Operations
// ==============================================

export const VotingService = {
  async getAll(): Promise<Voting[]> {
    if (!supabase) return [];
    return handleError(
      supabase.from('votings').select('*').order('deadline', { ascending: true })
    );
  },

  async getById(id: string): Promise<Voting | null> {
    if (!supabase) return null;
    const { data } = await supabase.from('votings').select('*').eq('id', id).single();
    return data;
  },

  async create(voting: Omit<Voting, 'id' | 'createdAt'>): Promise<Voting> {
    if (!supabase) throw new Error('Database not configured');
    return handleError(
      supabase.from('votings').insert(voting).select().single()
    );
  },

  async vote(votingId: string, optionId: string, userId: string): Promise<void> {
    if (!supabase) throw new Error('Database not configured');

    const { data: existingVote } = await supabase
      .from('votes')
      .select('*')
      .eq('voting_id', votingId)
      .eq('user_id', userId)
      .single();

    if (existingVote) {
      throw new Error('您已經投過票了');
    }

    const { error } = await supabase.from('votes').insert({
      voting_id: votingId,
      option_id: optionId,
      user_id: userId,
    });

    if (error) throw new Error(error.message);
  },

  async close(id: string): Promise<void> {
    if (!supabase) throw new Error('Database not configured');
    await supabase.from('votings').update({ status: 'closed' }).eq('id', id);
  },
};

// ==============================================
// Supplier Warning Operations
// ==============================================

export const WarningService = {
  async getAll(): Promise<SupplierWarning[]> {
    if (!supabase) return [];
    return handleError(
      supabase.from('supplier_warnings').select('*').order('created_at', { ascending: false })
    );
  },

  async getVerified(): Promise<SupplierWarning[]> {
    if (!supabase) return [];
    return handleError(
      supabase.from('supplier_warnings').select('*').eq('verified', true)
    );
  },

  async create(warning: Omit<SupplierWarning, 'id' | 'createdAt' | 'verified'>): Promise<SupplierWarning> {
    if (!supabase) throw new Error('Database not configured');
    return handleError(
      supabase.from('supplier_warnings').insert({ ...warning, verified: false }).select().single()
    );
  },

  async verify(id: string): Promise<void> {
    if (!supabase) throw new Error('Database not configured');
    await supabase.from('supplier_warnings').update({ verified: true }).eq('id', id);
  },

  async search(query: string): Promise<SupplierWarning[]> {
    if (!supabase) return [];
    return handleError(
      supabase.from('supplier_warnings')
        .select('*')
        .or(`supplier_name.ilike.%${query}%,reason.ilike.%${query}%`)
    );
  },
};

// ==============================================
// Realtime Subscriptions
// ==============================================

export function subscribeToVoting(votingId: string, callback: (voting: Voting) => void) {
  if (!supabase) return () => {};

  const subscription = supabase
    .channel(`voting:${votingId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'votings',
      filter: `id=eq.${votingId}`,
    }, (payload) => {
      callback(payload.new as Voting);
    })
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
}

export function subscribeToWarnings(callback: (warning: SupplierWarning) => void) {
  if (!supabase) return () => {};

  const subscription = supabase
    .channel('warnings')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'supplier_warnings',
    }, (payload) => {
      callback(payload.new as SupplierWarning);
    })
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
}

export default {
  supabase,
  TripService,
  RFPService,
  VotingService,
  WarningService,
  subscribeToVoting,
  subscribeToWarnings,
};
