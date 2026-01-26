import React, { useState, useEffect } from "react";
import { Vote, CheckCircle, Users } from "lucide-react";
import Button from "@/design-system/Button";

interface Poll {
  id: string;
  title: string;
  description: string;
  options: { id: string; text: string; votes: number }[];
  totalVotes: number;
  hasVoted: boolean;
  selectedOption?: string;
}

const MOCK_POLLS: Poll[] = [
  {
    id: "1",
    title: "第三天自由活動地點",
    description: "請投票選擇您偏好的自由活動地點",
    options: [
      { id: "a", text: "原宿竹下通", votes: 12 },
      { id: "b", text: "秋葉原電器街", votes: 8 },
      { id: "c", text: "銀座購物區", votes: 4 },
    ],
    totalVotes: 24,
    hasVoted: false,
  },
  {
    id: "2",
    title: "團體晚餐餐廳選擇",
    description: "請選擇第二天的晚餐餐廳",
    options: [
      { id: "d", text: "燒肉敘敘苑", votes: 15 },
      { id: "e", text: "壽司大", votes: 6 },
      { id: "f", text: "一蘭拉麵", votes: 3 },
    ],
    totalVotes: 24,
    hasVoted: true,
    selectedOption: "d",
  },
];

export default function VotingPage() {
  const [polls, setPolls] = useState<Poll[]>(MOCK_POLLS);

  // Load persisted votes from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem("trvicerp_voting");
      if (!raw) return;
      const saved: Record<string, string> = JSON.parse(raw);
      if (!saved || typeof saved !== "object") return;

      setPolls((prev) =>
        prev.map((poll) => {
          const selected = saved[poll.id];
          if (selected && !poll.hasVoted) {
            // apply persisted vote (increment counts locally)
            return {
              ...poll,
              hasVoted: true,
              selectedOption: selected,
              totalVotes: poll.totalVotes + 1,
              options: poll.options.map((opt) =>
                opt.id === selected ? { ...opt, votes: opt.votes + 1 } : opt,
              ),
            };
          }
          return poll;
        }),
      );
    } catch (e) {
      console.warn("Failed to load persisted votes", e);
    }
  }, []);

  const handleVote = (pollId: string, optionId: string) => {
    setPolls((prev) =>
      prev.map((poll) => {
        if (poll.id === pollId && !poll.hasVoted) {
          return {
            ...poll,
            hasVoted: true,
            selectedOption: optionId,
            totalVotes: poll.totalVotes + 1,
            options: poll.options.map((opt) =>
              opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt,
            ),
          };
        }
        return poll;
      }),
    );

    // persist selection for this poll
    try {
      const raw = localStorage.getItem("trvicerp_voting");
      const saved: Record<string, string> = raw ? JSON.parse(raw) : {};
      saved[pollId] = optionId;
      localStorage.setItem("trvicerp_voting", JSON.stringify(saved));
    } catch (e) {
      console.warn("Failed to persist vote", e);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 animate-fade-in">
      <header className="bg-black text-white px-6 py-4">
        <div className="flex items-center gap-3">
          <Vote className="w-6 h-6" />
          <h1 className="text-xl font-bold">團體投票</h1>
        </div>
      </header>
      <main className="p-6 space-y-6">
        {polls.map((poll) => (
          <div
            key={poll.id}
            className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
          >
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-gray-900">{poll.title}</h2>
                {poll.hasVoted && (
                  <span className="text-xs bg-brand-100 text-brand-700 px-2 py-1 rounded-full flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    已投票
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-1">{poll.description}</p>
              <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                <Users className="w-3 h-3" />
                {poll.totalVotes} 人已投票
              </p>
            </div>
            <div className="p-4 space-y-3">
              {poll.options.map((option) => {
                const percentage =
                  poll.totalVotes > 0
                    ? Math.round((option.votes / poll.totalVotes) * 100)
                    : 0;
                const isSelected = poll.selectedOption === option.id;
                return (
                  <Button
                    key={option.id}
                    onClick={() => handleVote(poll.id, option.id)}
                    disabled={poll.hasVoted}
                    aria-disabled={poll.hasVoted}
                    variant="ghost"
                    className={`w-full p-4 rounded-xl border-2 transform transition duration-200 ease ${isSelected ? "scale-100 border-brand-500 bg-brand-50" : "hover:scale-[0.995] border-gray-100 hover:border-gray-200"} ${poll.hasVoted ? "cursor-default" : "cursor-pointer"}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`font-semibold ${isSelected ? "text-brand-700" : "text-gray-900"}`}
                      >
                        {option.text}
                      </span>
                      {poll.hasVoted && (
                        <span className="text-sm font-bold text-gray-600">
                          {percentage}%
                        </span>
                      )}
                    </div>
                    {poll.hasVoted && (
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${isSelected ? "bg-brand-500" : "bg-gray-300"}`}
                          style={{
                            width: `${percentage}%`,
                            transition: "width 400ms ease",
                          }}
                        />
                      </div>
                    )}
                  </Button>
                );
              })}
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}
