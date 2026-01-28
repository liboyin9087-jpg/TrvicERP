import React from "react";
import { Vote, CheckCircle, Users } from "lucide-react";
import Button from "@/design-system/Button";

interface PollOption {
  id: string;
  text: string;
  votes: number;
}

interface Poll {
  id: string;
  title: string;
  description: string;
  options: PollOption[];
  totalVotes: number;
  hasVoted: boolean;
  selectedOption?: string;
}

interface VotingPageProps {
  polls: Poll[];
  onVote: (pollId: string, optionId: string) => void;
}

export default function VotingPage({ polls, onVote }: VotingPageProps) {
  const handleVoteClick = (pollId: string, optionId: string) => {
    onVote(pollId, optionId);
  };

  return (
    <div className="dashtail-widget-card p-0">
      <div className="drag-handle p-4 bg-gray-50 border-b border-gray-100 rounded-t-2xl flex items-center gap-3">
        <Vote className="w-5 h-5 text-primary-700" />
        <h2 className="text-lg font-semibold text-gray-800">團體投票</h2>
      </div>

      <main className="p-6 space-y-6">
        {polls.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            目前沒有可用的投票。
          </div>
        ) : (
          polls.map((poll) => (
            <div
              key={poll.id}
              className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm"
            >
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-gray-900">{poll.title}</h3>
                  {poll.hasVoted && (
                    <span className="text-sm bg-success-100 text-success-700 px-2 py-1 rounded-full flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      已投票
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-1">{poll.description}</p>
                <p className="text-sm text-gray-400 mt-2 flex items-center gap-1">
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
                  const isDisabled = poll.hasVoted;

                  const buttonClasses = [
                    "w-full p-4 rounded-lg border-2 transform transition duration-200 ease",
                    isDisabled ? "cursor-default opacity-80" : "cursor-pointer",
                    isSelected
                      ? "border-primary-500 bg-primary-50 text-primary-700"
                      : "border-gray-100 text-gray-900",
                    !isDisabled && !isSelected && "hover:bg-gray-50 active:bg-gray-100 hover:border-gray-200 hover:scale-[0.995]",
                    !isDisabled && "focus:ring-2 focus:ring-primary-300 focus:outline-none",
                  ].filter(Boolean).join(" ");

                  return (
                    <Button
                      key={option.id}
                      onClick={() => handleVoteClick(poll.id, option.id)}
                      disabled={isDisabled}
                      aria-disabled={isDisabled}
                      variant="ghost"
                      className={buttonClasses}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold">
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
                            className={`h-full rounded-full ${isSelected ? "bg-primary-500" : "bg-gray-300"}`}
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
          ))
        )}
      </main>
    </div>
  );
}