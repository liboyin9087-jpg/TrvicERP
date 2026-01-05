// =====================================================
// TravelCanvas - Supabase Database Service
// 真實 Supabase CRUD 操作，保留 Mock fallback
// =====================================================

import { getSupabaseClient } from '../lib/supabase';
import type { TourGroup, BookingOrder, DashboardStats } from '../types';

// =====================================================
// Types for Supabase Tables
// =====================================================

export interface SupabaseRFP {
  id: string;
  company_name: string;
  contact_person: string;
  contact_email: string;
  contact_phone: string;
  headcount: number;
  budget_min: number;
  budget_max: number;
  destination: string;
  duration_days: number;
  departure_date: string | null;
  special_requirements: string[];
  custom_requirements: string | null;
  deadline: string;
  status: 'draft' | 'open' | 'reviewing' | 'awarded' | 'cancelled';
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface SupabaseQuote {
  id: string;
  rfp_id: string;
  agency_id: string;
  agency_name: string;
  price_per_person: number;
  total_price: number;
  features: string[];
  itinerary_summary: string | null;
  valid_until: string;
  status: 'submitted' | 'reviewing' | 'accepted' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface SupabaseWarningReport {
  id: string;
  supplier_name: string;
  supplier_type: 'hotel' | 'restaurant' | 'transport' | 'attraction' | 'guide' | 'other';
  location: string | null;
  severity: 'low' | 'medium' | 'high' | 'critical';
  issue_title: string;
  issue_description: string;
  evidence_urls: string[];
  reported_by: string | null;
  report_count: number;
  verified: boolean;
  resolution_status: 'open' | 'investigating' | 'resolved' | 'dismissed';
  created_at: string;
  updated_at: string;
}

export interface SupabaseVotePoll {
  id: string;
  title: string;
  description: string | null;
  deadline: string;
  created_by: string | null;
  created_by_role: 'agency' | 'welfare_committee';
  status: 'active' | 'closed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface SupabaseVoteOption {
  id: string;
  poll_id: string;
  label: string;
  vote_count: number;
  created_at: string;
}

export interface SupabaseVoteRecord {
  id: string;
  poll_id: string;
  option_id: string;
  voter_id: string;
  created_at: string;
}

// =====================================================
// Supabase Service Class
// =====================================================

class SupabaseService {
  private get client() {
    return getSupabaseClient();
  }

  get isAvailable(): boolean {
    return this.client !== null;
  }

  // =====================================================
  // RFP Operations
  // =====================================================

  async fetchRFPs(filters?: { status?: string; createdBy?: string }): Promise<SupabaseRFP[]> {
    if (!this.client) return [];
    
    let query = this.client.from('rfps').select('*').order('created_at', { ascending: false });
    
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.createdBy) {
      query = query.eq('created_by', filters.createdBy);
    }
    
    const { data, error } = await query;
    if (error) {
      console.error('Error fetching RFPs:', error);
      return [];
    }
    return data || [];
  }

  async createRFP(rfp: Omit<SupabaseRFP, 'id' | 'created_at' | 'updated_at'>): Promise<SupabaseRFP | null> {
    if (!this.client) return null;
    
    const { data, error } = await this.client
      .from('rfps')
      .insert(rfp)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating RFP:', error);
      return null;
    }
    return data;
  }

  async updateRFPStatus(id: string, status: SupabaseRFP['status']): Promise<boolean> {
    if (!this.client) return false;
    
    const { error } = await this.client
      .from('rfps')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);
    
    if (error) {
      console.error('Error updating RFP status:', error);
      return false;
    }
    return true;
  }

  // =====================================================
  // Quote Operations
  // =====================================================

  async fetchQuotesByRFP(rfpId: string): Promise<SupabaseQuote[]> {
    if (!this.client) return [];
    
    const { data, error } = await this.client
      .from('quotes')
      .select('*')
      .eq('rfp_id', rfpId)
      .order('price_per_person', { ascending: true });
    
    if (error) {
      console.error('Error fetching quotes:', error);
      return [];
    }
    return data || [];
  }

  async submitQuote(quote: Omit<SupabaseQuote, 'id' | 'created_at' | 'updated_at'>): Promise<SupabaseQuote | null> {
    if (!this.client) return null;
    
    const { data, error } = await this.client
      .from('quotes')
      .insert(quote)
      .select()
      .single();
    
    if (error) {
      console.error('Error submitting quote:', error);
      return null;
    }
    return data;
  }

  // =====================================================
  // Warning Database Operations
  // =====================================================

  async fetchWarnings(filters?: { severity?: string; verified?: boolean }): Promise<SupabaseWarningReport[]> {
    if (!this.client) return [];
    
    let query = this.client.from('warning_reports').select('*').order('created_at', { ascending: false });
    
    if (filters?.severity) {
      query = query.eq('severity', filters.severity);
    }
    if (filters?.verified !== undefined) {
      query = query.eq('verified', filters.verified);
    }
    
    const { data, error } = await query;
    if (error) {
      console.error('Error fetching warnings:', error);
      return [];
    }
    return data || [];
  }

  async reportWarning(report: Omit<SupabaseWarningReport, 'id' | 'report_count' | 'verified' | 'resolution_status' | 'created_at' | 'updated_at'>): Promise<SupabaseWarningReport | null> {
    if (!this.client) return null;
    
    const { data, error } = await this.client
      .from('warning_reports')
      .insert({
        ...report,
        report_count: 1,
        verified: false,
        resolution_status: 'open'
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error reporting warning:', error);
      return null;
    }
    return data;
  }

  async upvoteWarning(id: string): Promise<boolean> {
    if (!this.client) return false;
    
    const { error } = await this.client.rpc('increment_warning_count', { warning_id: id });
    
    if (error) {
      console.error('Error upvoting warning:', error);
      return false;
    }
    return true;
  }

  // =====================================================
  // Voting Operations (Real-time enabled)
  // =====================================================

  async fetchPolls(status?: 'active' | 'closed'): Promise<SupabaseVotePoll[]> {
    if (!this.client) return [];
    
    let query = this.client.from('vote_polls').select('*').order('created_at', { ascending: false });
    
    if (status) {
      query = query.eq('status', status);
    }
    
    const { data, error } = await query;
    if (error) {
      console.error('Error fetching polls:', error);
      return [];
    }
    return data || [];
  }

  async fetchPollWithOptions(pollId: string): Promise<{ poll: SupabaseVotePoll; options: SupabaseVoteOption[] } | null> {
    if (!this.client) return null;
    
    const [pollResult, optionsResult] = await Promise.all([
      this.client.from('vote_polls').select('*').eq('id', pollId).single(),
      this.client.from('vote_options').select('*').eq('poll_id', pollId).order('created_at', { ascending: true })
    ]);
    
    if (pollResult.error || optionsResult.error) {
      console.error('Error fetching poll:', pollResult.error || optionsResult.error);
      return null;
    }
    
    return {
      poll: pollResult.data,
      options: optionsResult.data || []
    };
  }

  async createPoll(poll: {
    title: string;
    description?: string;
    deadline: string;
    created_by?: string;
    created_by_role: 'agency' | 'welfare_committee';
    options: string[];
  }): Promise<SupabaseVotePoll | null> {
    if (!this.client) return null;
    
    // Create poll
    const { data: pollData, error: pollError } = await this.client
      .from('vote_polls')
      .insert({
        title: poll.title,
        description: poll.description || null,
        deadline: poll.deadline,
        created_by: poll.created_by || null,
        created_by_role: poll.created_by_role,
        status: 'active'
      })
      .select()
      .single();
    
    if (pollError || !pollData) {
      console.error('Error creating poll:', pollError);
      return null;
    }
    
    // Create options
    const optionsToInsert = poll.options.filter(Boolean).map(label => ({
      poll_id: pollData.id,
      label,
      vote_count: 0
    }));
    
    const { error: optionsError } = await this.client
      .from('vote_options')
      .insert(optionsToInsert);
    
    if (optionsError) {
      console.error('Error creating poll options:', optionsError);
      // Rollback poll creation
      await this.client.from('vote_polls').delete().eq('id', pollData.id);
      return null;
    }
    
    return pollData;
  }

  async castVote(pollId: string, voterId: string, optionId: string): Promise<boolean> {
    if (!this.client) return false;
    
    // Check if already voted
    const { data: existingVote } = await this.client
      .from('vote_records')
      .select('id, option_id')
      .eq('poll_id', pollId)
      .eq('voter_id', voterId)
      .single();
    
    if (existingVote) {
      // Change vote
      if (existingVote.option_id === optionId) return true; // Same vote
      
      // Decrement old option
      await this.client.rpc('decrement_vote_count', { opt_id: existingVote.option_id });
      
      // Update vote record
      await this.client
        .from('vote_records')
        .update({ option_id: optionId })
        .eq('id', existingVote.id);
      
      // Increment new option
      await this.client.rpc('increment_vote_count', { opt_id: optionId });
      
      return true;
    }
    
    // New vote
    const { error: voteError } = await this.client
      .from('vote_records')
      .insert({
        poll_id: pollId,
        voter_id: voterId,
        option_id: optionId
      });
    
    if (voteError) {
      console.error('Error casting vote:', voteError);
      return false;
    }
    
    // Increment vote count
    await this.client.rpc('increment_vote_count', { opt_id: optionId });
    
    return true;
  }

  async getVoterChoice(pollId: string, voterId: string): Promise<string | null> {
    if (!this.client) return null;
    
    const { data } = await this.client
      .from('vote_records')
      .select('option_id')
      .eq('poll_id', pollId)
      .eq('voter_id', voterId)
      .single();
    
    return data?.option_id || null;
  }

  // Real-time subscription for poll updates
  subscribeToPollUpdates(pollId: string, callback: (options: SupabaseVoteOption[]) => void) {
    if (!this.client) return () => {};
    
    const subscription = this.client
      .channel(`poll_${pollId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'vote_options',
        filter: `poll_id=eq.${pollId}`
      }, async () => {
        // Refetch options on any change
        const { data } = await this.client!
          .from('vote_options')
          .select('*')
          .eq('poll_id', pollId)
          .order('created_at', { ascending: true });
        
        if (data) callback(data);
      })
      .subscribe();
    
    return () => {
      subscription.unsubscribe();
    };
  }

  // =====================================================
  // Dashboard Stats
  // =====================================================

  async fetchDashboardStats(): Promise<DashboardStats | null> {
    if (!this.client) return null;
    
    const today = new Date().toISOString().split('T')[0];
    const thirtyDaysLater = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const [groupsResult, ordersResult] = await Promise.all([
      this.client
        .from('tour_groups')
        .select('*')
        .gte('departure_date', today)
        .lte('departure_date', thirtyDaysLater)
        .order('departure_date', { ascending: true }),
      this.client
        .from('booking_orders')
        .select('total_amount')
        .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
    ]);
    
    const groups = groupsResult.data || [];
    const orders = ordersResult.data || [];
    
    const criticalGroups = groups.filter(g => g.urgency_level === 'critical').length;
    const urgentGroups = groups.filter(g => g.urgency_level === 'urgent').length;
    const revenue = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
    
    return {
      upcoming_groups: groups.length,
      critical_groups: criticalGroups,
      urgent_groups: urgentGroups,
      orders_this_month: orders.length,
      revenue_this_month: revenue,
      departing_soon: groups.slice(0, 5) as TourGroup[]
    };
  }
}

// Export singleton instance
export const supabaseService = new SupabaseService();
export default supabaseService;
