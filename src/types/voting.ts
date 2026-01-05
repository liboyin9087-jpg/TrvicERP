// =====================================================
// TravelCanvas - Voting Types
// 目的：用最小成本把「福委會發起投票」↔「員工投票」串起來
// NOTE: 展示版採 localStorage，同一瀏覽器可跨角色看到同步結果
// =====================================================

export interface VoteOption {
  id: string;
  label: string;
  votes: number;
}

export interface VotePoll {
  id: string;
  title: string;
  description?: string;
  deadlineISO: string; // YYYY-MM-DD
  createdAtISO: string;
  createdByRole: 'welfare_committee' | 'agency';
  options: VoteOption[];
  // 用 email/員工編號都可以；展示版用 "EMPLOYEE" + randomId
  voters: Record<string, string>; // voterId -> optionId
}
