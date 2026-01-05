// =====================================================
// TravelCanvas - Voting Center (Demo)
// 福委會：建立/關閉投票、看結果
// 員工：投票
// =====================================================

import React, { useEffect, useMemo, useState } from 'react';
import { BarChart3, Calendar, CheckCircle2, Copy, Plus, Trash2, Vote as VoteIcon } from '../Icons';
import type { VotePoll } from '../../types/voting';
import { castVote, createPoll, deletePoll, listPolls } from '../../services/votingStore';

type Mode = 'committee' | 'employee' | 'agency';

interface VotingCenterProps {
  mode: Mode;
  voterId?: string;
}

const VotingCenter: React.FC<VotingCenterProps> = ({ mode, voterId = 'EMPLOYEE_DEMO' }) => {
  const [polls, setPolls] = useState<VotePoll[]>([]);
  const [activePollId, setActivePollId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const refresh = () => {
    const data = listPolls();
    setPolls(data);
    if (!activePollId && data.length) setActivePollId(data[0].id);
  };

  useEffect(() => {
    refresh();
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'travelcanvas_votes_v1') refresh();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activePoll = useMemo(() => polls.find(p => p.id === activePollId) || null, [polls, activePollId]);
  const totalVotes = useMemo(() => (activePoll ? activePoll.options.reduce((sum, o) => sum + o.votes, 0) : 0), [activePoll]);

  const handleCreate = (payload: { title: string; deadlineISO: string; options: string[]; description?: string }) => {
    createPoll({
      title: payload.title,
      description: payload.description,
      deadlineISO: payload.deadlineISO,
      createdByRole: mode === 'committee' ? 'welfare_committee' : 'agency',
      options: payload.options.filter(Boolean).map(label => ({ label }))
    });
    setShowCreate(false);
    refresh();
  };

  const handleVote = (optionId: string) => {
    if (!activePoll) return;
    castVote(activePoll.id, voterId, optionId);
    refresh();
  };

  const handleDelete = () => {
    if (!activePoll) return;
    deletePoll(activePoll.id);
    setActivePollId(null);
    refresh();
  };

  const handleCopyCode = async () => {
    if (!activePoll) return;
    const code = activePoll.id;
    try {
      await navigator.clipboard.writeText(code);
      // no toast system, keep it simple
      alert(`投票代碼已複製：${code}`);
    } catch {
      alert(`請手動複製投票代碼：${code}`);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <VoteIcon className="text-blue-600" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">投票中心</h2>
              <p className="text-sm text-slate-500">同一瀏覽器可模擬福委會 ↔ 員工投票流程</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {(mode === 'committee' || mode === 'agency') && (
              <button
                onClick={() => setShowCreate(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
              >
                <Plus size={16} /> 建立投票
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex">
        {/* Poll List */}
        <div className="w-80 border-r border-slate-200 overflow-y-auto">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
            <BarChart3 size={16} className="text-slate-500" />
            <span className="text-sm font-bold text-slate-700">投票清單</span>
            <span className="ml-auto text-xs text-slate-500">{polls.length}</span>
          </div>
          {polls.length === 0 ? (
            <div className="p-6 text-sm text-slate-500">
              目前沒有投票。{(mode === 'committee' || mode === 'agency') ? '你可以先建立一個投票。' : '等待福委會發起投票。'}
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {polls.map(p => (
                <button
                  key={p.id}
                  onClick={() => setActivePollId(p.id)}
                  className={`w-full text-left p-4 hover:bg-slate-50 transition-colors ${activePollId === p.id ? 'bg-blue-50' : ''}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-slate-900 text-sm line-clamp-2">{p.title}</p>
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                        <Calendar size={12} /> 截止 {p.deadlineISO}
                      </p>
                    </div>
                    <span className="text-xs font-mono text-slate-400">{p.id.replace('poll_', '#')}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Poll Detail */}
        <div className="flex-1 overflow-y-auto">
          {!activePoll ? (
            <div className="h-full flex items-center justify-center text-slate-400">請先選擇一個投票</div>
          ) : (
            <div className="p-6 max-w-3xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">{activePoll.title}</h3>
                  {activePoll.description && <p className="text-slate-500 mt-2">{activePoll.description}</p>}
                  <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
                    <Calendar size={16} /> 截止 {activePoll.deadlineISO}
                    <span className="mx-2">·</span>
                    <CheckCircle2 size={16} /> 已投 {totalVotes} 票
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyCode}
                    className="px-3 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-medium flex items-center gap-2"
                  >
                    <Copy size={16} /> 複製代碼
                  </button>
                  {(mode === 'committee' || mode === 'agency') && (
                    <button
                      onClick={handleDelete}
                      className="px-3 py-2 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 text-sm font-medium flex items-center gap-2"
                    >
                      <Trash2 size={16} /> 刪除
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {activePoll.options.map(opt => {
                  const pct = totalVotes === 0 ? 0 : Math.round((opt.votes / totalVotes) * 100);
                  const myPick = activePoll.voters[voterId] === opt.id;
                  return (
                    <div key={opt.id} className="p-4 border border-slate-200 rounded-xl">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-900">{opt.label}</span>
                          {myPick && <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">我的選擇</span>}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-slate-500">{opt.votes} 票 · {pct}%</span>
                          {mode === 'employee' && (
                            <button
                              onClick={() => handleVote(opt.id)}
                              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${myPick ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
                            >
                              投這票
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="mt-3 w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-600" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {showCreate && (
        <CreatePollModal
          onClose={() => setShowCreate(false)}
          onCreate={handleCreate}
        />
      )}
    </div>
  );
};

const CreatePollModal: React.FC<{
  onClose: () => void;
  onCreate: (payload: { title: string; deadlineISO: string; options: string[]; description?: string }) => void;
}> = ({ onClose, onCreate }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadlineISO, setDeadlineISO] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 10);
  });
  const [options, setOptions] = useState<string[]>(['', '', '']);

  const canSubmit = title.trim().length >= 3 && options.filter(o => o.trim()).length >= 2;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-6 z-50">
      <div className="w-full max-w-xl bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden">
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <VoteIcon size={18} className="text-blue-600" />
            <span className="font-bold text-slate-900">建立新投票</span>
          </div>
          <button onClick={onClose} className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100">關閉</button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">投票標題</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl"
              placeholder="例如：晚餐餐廳選擇"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">描述（可選）</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl min-h-[90px]"
              placeholder="給同事一個背景：預算、地點、限制條件…"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">截止日期</label>
              <input
                type="date"
                value={deadlineISO}
                onChange={(e) => setDeadlineISO(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl"
              />
            </div>
            <div className="flex items-end">
              <p className="text-xs text-slate-500">至少要 2 個選項才可建立。</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">選項</label>
            <div className="space-y-2">
              {options.map((opt, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    value={opt}
                    onChange={(e) => {
                      const next = [...options];
                      next[idx] = e.target.value;
                      setOptions(next);
                    }}
                    className="flex-1 px-4 py-3 border border-slate-200 rounded-xl"
                    placeholder={`選項 ${idx + 1}`}
                  />
                  <button
                    onClick={() => setOptions(prev => prev.filter((_, i) => i !== idx))}
                    className="px-3 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50"
                    disabled={options.length <= 2}
                    title={options.length <= 2 ? '至少保留兩個選項' : '刪除此選項'}
                  >
                    刪
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={() => setOptions(prev => [...prev, ''])}
              className="mt-3 text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              + 新增選項
            </button>
          </div>
        </div>

        <div className="p-5 border-t border-slate-200 bg-white flex items-center justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50">取消</button>
          <button
            onClick={() => onCreate({ title: title.trim(), description: description.trim() || undefined, deadlineISO, options })}
            disabled={!canSubmit}
            className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            建立
          </button>
        </div>
      </div>
    </div>
  );
};

export default VotingCenter;
