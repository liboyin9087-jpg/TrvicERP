// =====================================================
// TravelCanvas - Voting Store (Demo)
// - localStorage persistence
// - same browser session can simulate Committee ↔ Employee flow
// =====================================================

import type { VotePoll } from '../types/voting';

const STORAGE_KEY = 'travelcanvas_votes_v1';

function safeParse(json: string | null): VotePoll[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) return [];
    return parsed as VotePoll[];
  } catch {
    return [];
  }
}

export function listPolls(): VotePoll[] {
  return safeParse(localStorage.getItem(STORAGE_KEY));
}

export function getPoll(pollId: string): VotePoll | null {
  return listPolls().find(p => p.id === pollId) || null;
}

export function savePolls(polls: VotePoll[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(polls));
}

export function upsertPoll(poll: VotePoll) {
  const polls = listPolls();
  const idx = polls.findIndex(p => p.id === poll.id);
  if (idx >= 0) polls[idx] = poll;
  else polls.unshift(poll);
  savePolls(polls);
}

export function createPoll(input: Omit<VotePoll, 'id' | 'createdAtISO' | 'voters' | 'options'> & { options: { label: string }[] }): VotePoll {
  const now = new Date();
  const id = `poll_${now.getTime()}`;
  const poll: VotePoll = {
    id,
    title: input.title,
    description: input.description,
    deadlineISO: input.deadlineISO,
    createdAtISO: now.toISOString(),
    createdByRole: input.createdByRole,
    voters: {},
    options: input.options.map((o, i) => ({ id: `opt_${i + 1}`, label: o.label, votes: 0 }))
  };
  upsertPoll(poll);
  return poll;
}

export function castVote(pollId: string, voterId: string, optionId: string): VotePoll | null {
  const polls = listPolls();
  const poll = polls.find(p => p.id === pollId);
  if (!poll) return null;

  // 若已投過票，先回收原票
  const previous = poll.voters[voterId];
  if (previous) {
    const prevOpt = poll.options.find(o => o.id === previous);
    if (prevOpt) prevOpt.votes = Math.max(0, prevOpt.votes - 1);
  }

  poll.voters[voterId] = optionId;
  const opt = poll.options.find(o => o.id === optionId);
  if (opt) opt.votes += 1;

  savePolls(polls);
  return poll;
}

export function deletePoll(pollId: string) {
  const polls = listPolls().filter(p => p.id !== pollId);
  savePolls(polls);
}
