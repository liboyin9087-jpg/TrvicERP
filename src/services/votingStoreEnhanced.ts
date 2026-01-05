// =====================================================
// TravelCanvas - Enhanced Voting Store
// Supabase 優先，localStorage 作為 fallback
// =====================================================

import type { VotePoll, VoteOption } from '../types/voting';
import supabaseService from './supabaseService';

// =====================================================
// Storage Keys
// =====================================================

const STORAGE_KEY = 'travelcanvas_votes_v2';

// =====================================================
// Local Storage Operations (Fallback)
// =====================================================

function getLocalPolls(): VotePoll[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as VotePoll[];
  } catch {
    return [];
  }
}

function saveLocalPolls(polls: VotePoll[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(polls));
  } catch (e) {
    console.error('Failed to save polls to localStorage:', e);
  }
}

function generateId(): string {
  return `poll_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

// =====================================================
// Unified API (Supabase-first, localStorage fallback)
// =====================================================

export async function listPollsAsync(): Promise<VotePoll[]> {
  // Try Supabase first
  if (supabaseService.isAvailable) {
    try {
      const polls = await supabaseService.fetchPolls();
      
      // Convert Supabase format to VotePoll format
      const convertedPolls: VotePoll[] = await Promise.all(
        polls.map(async (p) => {
          const result = await supabaseService.fetchPollWithOptions(p.id);
          if (!result) return null;
          
          return {
            id: p.id,
            title: p.title,
            description: p.description || undefined,
            deadlineISO: p.deadline.split('T')[0],
            createdByRole: p.created_by_role,
            createdAt: p.created_at,
            options: result.options.map(o => ({
              id: o.id,
              label: o.label,
              votes: o.vote_count
            })),
            voters: {} // Will be populated when needed
          } as VotePoll;
        })
      );
      
      return convertedPolls.filter((p): p is VotePoll => p !== null);
    } catch (e) {
      console.error('Supabase fetch failed, falling back to localStorage:', e);
    }
  }
  
  // Fallback to localStorage
  return getLocalPolls();
}

// Synchronous version for backward compatibility
export function listPolls(): VotePoll[] {
  return getLocalPolls();
}

export async function createPollAsync(input: {
  title: string;
  description?: string;
  deadlineISO: string;
  createdByRole: 'agency' | 'welfare_committee';
  options: { label: string }[];
}): Promise<VotePoll | null> {
  // Try Supabase first
  if (supabaseService.isAvailable) {
    try {
      const poll = await supabaseService.createPoll({
        title: input.title,
        description: input.description,
        deadline: input.deadlineISO,
        created_by_role: input.createdByRole,
        options: input.options.map(o => o.label)
      });
      
      if (poll) {
        // Refetch to get complete poll with options
        const result = await supabaseService.fetchPollWithOptions(poll.id);
        if (result) {
          return {
            id: poll.id,
            title: poll.title,
            description: poll.description || undefined,
            deadlineISO: poll.deadline.split('T')[0],
            createdByRole: poll.created_by_role,
            createdAt: poll.created_at,
            options: result.options.map(o => ({
              id: o.id,
              label: o.label,
              votes: o.vote_count
            })),
            voters: {}
          };
        }
      }
    } catch (e) {
      console.error('Supabase create failed, falling back to localStorage:', e);
    }
  }
  
  // Fallback to localStorage
  return createPoll(input);
}

// Synchronous version for backward compatibility
export function createPoll(input: {
  title: string;
  description?: string;
  deadlineISO: string;
  createdByRole: 'agency' | 'welfare_committee';
  options: { label: string }[];
}): VotePoll {
  const polls = getLocalPolls();
  
  const newPoll: VotePoll = {
    id: generateId(),
    title: input.title,
    description: input.description,
    deadlineISO: input.deadlineISO,
    createdByRole: input.createdByRole,
    createdAt: new Date().toISOString(),
    options: input.options.filter(o => o.label.trim()).map(o => ({
      id: generateId(),
      label: o.label.trim(),
      votes: 0
    })),
    voters: {}
  };
  
  polls.unshift(newPoll);
  saveLocalPolls(polls);
  
  return newPoll;
}

export async function castVoteAsync(pollId: string, voterId: string, optionId: string): Promise<boolean> {
  // Try Supabase first
  if (supabaseService.isAvailable) {
    try {
      return await supabaseService.castVote(pollId, voterId, optionId);
    } catch (e) {
      console.error('Supabase vote failed, falling back to localStorage:', e);
    }
  }
  
  // Fallback to localStorage
  castVote(pollId, voterId, optionId);
  return true;
}

// Synchronous version for backward compatibility
export function castVote(pollId: string, voterId: string, optionId: string): void {
  const polls = getLocalPolls();
  const poll = polls.find(p => p.id === pollId);
  
  if (!poll) return;
  
  const previousOptionId = poll.voters[voterId];
  
  // If changing vote, decrement previous option
  if (previousOptionId && previousOptionId !== optionId) {
    const prevOption = poll.options.find(o => o.id === previousOptionId);
    if (prevOption && prevOption.votes > 0) {
      prevOption.votes--;
    }
  }
  
  // Record new vote
  poll.voters[voterId] = optionId;
  
  // Increment new option (only if not already voted for this option)
  if (previousOptionId !== optionId) {
    const option = poll.options.find(o => o.id === optionId);
    if (option) {
      option.votes++;
    }
  }
  
  saveLocalPolls(polls);
}

export async function deletePollAsync(pollId: string): Promise<boolean> {
  // For Supabase, we would need a delete endpoint
  // For now, just use localStorage
  deletePoll(pollId);
  return true;
}

// Synchronous version for backward compatibility
export function deletePoll(pollId: string): void {
  const polls = getLocalPolls();
  const filtered = polls.filter(p => p.id !== pollId);
  saveLocalPolls(filtered);
}

export function getPoll(pollId: string): VotePoll | null {
  const polls = getLocalPolls();
  return polls.find(p => p.id === pollId) || null;
}

export async function getVoterChoiceAsync(pollId: string, voterId: string): Promise<string | null> {
  // Try Supabase first
  if (supabaseService.isAvailable) {
    try {
      return await supabaseService.getVoterChoice(pollId, voterId);
    } catch (e) {
      console.error('Supabase getVoterChoice failed, falling back to localStorage:', e);
    }
  }
  
  // Fallback to localStorage
  const poll = getPoll(pollId);
  return poll?.voters[voterId] || null;
}

// =====================================================
// Real-time Subscription (Supabase only)
// =====================================================

export function subscribeToPollUpdates(
  pollId: string, 
  onUpdate: (options: VoteOption[]) => void
): () => void {
  if (!supabaseService.isAvailable) {
    // No-op for localStorage
    return () => {};
  }
  
  return supabaseService.subscribeToPollUpdates(pollId, (supabaseOptions) => {
    const options: VoteOption[] = supabaseOptions.map(o => ({
      id: o.id,
      label: o.label,
      votes: o.vote_count
    }));
    onUpdate(options);
  });
}

// =====================================================
// Migration Helper (localStorage to Supabase)
// =====================================================

export async function migrateLocalPollsToSupabase(): Promise<number> {
  if (!supabaseService.isAvailable) return 0;
  
  const localPolls = getLocalPolls();
  let migrated = 0;
  
  for (const poll of localPolls) {
    try {
      const created = await supabaseService.createPoll({
        title: poll.title,
        description: poll.description,
        deadline: poll.deadlineISO,
        created_by_role: poll.createdByRole,
        options: poll.options.map(o => o.label)
      });
      
      if (created) migrated++;
    } catch (e) {
      console.error('Failed to migrate poll:', poll.id, e);
    }
  }
  
  // Clear localStorage after successful migration
  if (migrated === localPolls.length && migrated > 0) {
    localStorage.removeItem(STORAGE_KEY);
  }
  
  return migrated;
}
