/**
 * CommandBar - VicERP 全域指令列
 *
 * 根據規格書實作的 Vision Pro 風格指令界面
 * 特點：
 * - Cmd + K 喚起
 * - Function Calling 的入口
 * - 智能搜尋與指令執行
 * - AI 意圖解析與 API 呼叫
 * - Diff View 顯示變更預覽
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Command,
  Search,
  Sparkles,
  ArrowRight,
  Calculator,
  Calendar,
  Users,
  DollarSign,
  Map,
  FileText,
  TrendingUp,
  Settings,
  Loader2,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================
// Type Definitions
// ============================================
interface CommandAction {
  id: string;
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  category: string;
  keywords: string[];
  action: () => void | Promise<void>;
  requiresConfirmation?: boolean;
  aiGenerated?: boolean;
}

interface AICommand {
  query: string;
  intent: string;
  parameters: Record<string, any>;
  preview?: string;
  confidence: number;
}

interface CommandBarProps {
  isOpen: boolean;
  onClose: () => void;
  onExecuteCommand?: (command: CommandAction | AICommand) => void;
}

// ============================================
// Predefined Commands
// ============================================
const PREDEFINED_COMMANDS: CommandAction[] = [
  {
    id: "dashboard",
    title: "切換至儀表板",
    subtitle: "查看營運概況",
    icon: <TrendingUp className="w-4 h-4" />,
    category: "導覽",
    keywords: ["dashboard", "儀表板", "overview", "總覽"],
    action: () => console.log("Navigate to dashboard"),
  },
  {
    id: "new-tour",
    title: "新增旅遊行程",
    subtitle: "建立新的旅遊產品",
    icon: <Calendar className="w-4 h-4" />,
    category: "建立",
    keywords: ["new", "tour", "行程", "新增", "create"],
    action: () => console.log("Create new tour"),
  },
  {
    id: "customer-search",
    title: "搜尋客戶",
    subtitle: "查找客戶資料",
    icon: <Users className="w-4 h-4" />,
    category: "搜尋",
    keywords: ["customer", "客戶", "search", "搜尋"],
    action: () => console.log("Search customers"),
  },
  {
    id: "profit-analysis",
    title: "獲利分析",
    subtitle: "檢視財務報表",
    icon: <DollarSign className="w-4 h-4" />,
    category: "分析",
    keywords: ["profit", "獲利", "analysis", "分析", "financial"],
    action: () => console.log("Open profit analysis"),
  },
  {
    id: "route-planner",
    title: "路線規劃",
    subtitle: "智能行程規劃",
    icon: <Map className="w-4 h-4" />,
    category: "工具",
    keywords: ["route", "路線", "planner", "規劃", "itinerary"],
    action: () => console.log("Open route planner"),
  },
];

// AI 指令模式匹配
const AI_COMMAND_PATTERNS = [
  {
    pattern: /(?:提升|增加|調整).*?(?:價格|報價).*?(\d+)%/i,
    intent: "price_adjustment",
    extract: (match: RegExpMatchArray) => ({ percentage: parseInt(match[1]) }),
  },
  {
    pattern: /(?:規劃|建立|新增).*?(\d+)天.*?行程/i,
    intent: "create_itinerary",
    extract: (match: RegExpMatchArray) => ({ days: parseInt(match[1]) }),
  },
  {
    pattern: /(?:搜尋|查找|找).*?客戶.*?([\u4e00-\u9fa5\w]+)/i,
    intent: "search_customer",
    extract: (match: RegExpMatchArray) => ({ name: match[1] }),
  },
  {
    pattern: /(?:計算|分析).*?毛利/i,
    intent: "calculate_profit",
    extract: () => ({}),
  },
];

// ============================================
// Command Bar Component
// ============================================
export const CommandBar: React.FC<CommandBarProps> = ({
  isOpen,
  onClose,
  onExecuteCommand,
}) => {
  const [query, setQuery] = useState("");
  const [filteredCommands, setFilteredCommands] =
    useState<CommandAction[]>(PREDEFINED_COMMANDS);
  const [aiCommand, setAiCommand] = useState<AICommand | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [executionState, setExecutionState] = useState<
    "idle" | "processing" | "success" | "error"
  >("idle");
  const inputRef = useRef<HTMLInputElement>(null);

  // 重置狀態
  const resetState = useCallback(() => {
    setQuery("");
    setFilteredCommands(PREDEFINED_COMMANDS);
    setAiCommand(null);
    setSelectedIndex(0);
    setIsProcessing(false);
    setExecutionState("idle");
  }, []);

  // 處理開啟/關閉
  useEffect(() => {
    if (isOpen) {
      resetState();
      // 聚焦輸入框
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, resetState]);

  // 全域快捷鍵監聽
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K 喚起
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (!isOpen) {
          // 這裡需要觸發父組件開啟 Command Bar
        } else {
          onClose();
        }
      }

      // ESC 關閉
      if (e.key === "Escape" && isOpen) {
        onClose();
      }

      // 方向鍵導覽
      if (isOpen && !isProcessing) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setSelectedIndex((prev) =>
            Math.min(
              prev + 1,
              (aiCommand ? 1 : 0) + filteredCommands.length - 1,
            ),
          );
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
        }
        if (e.key === "Enter") {
          e.preventDefault();
          handleExecuteSelected();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    isOpen,
    isProcessing,
    filteredCommands,
    aiCommand,
    selectedIndex,
    onClose,
  ]);

  // 解析 AI 指令
  const parseAICommand = useCallback((input: string): AICommand | null => {
    for (const pattern of AI_COMMAND_PATTERNS) {
      const match = input.match(pattern.pattern);
      if (match) {
        const parameters = pattern.extract(match);
        return {
          query: input,
          intent: pattern.intent,
          parameters,
          preview: generatePreview(pattern.intent, parameters),
          confidence: 0.85,
        };
      }
    }
    return null;
  }, []);

  // 生成預覽文字
  const generatePreview = (
    intent: string,
    params: Record<string, any>,
  ): string => {
    switch (intent) {
      case "price_adjustment":
        return `將所有產品價格調整 ${params.percentage}%`;
      case "create_itinerary":
        return `AI 將規劃一個 ${params.days} 天的行程`;
      case "search_customer":
        return `搜尋客戶："${params.name}"`;
      case "calculate_profit":
        return `計算所有行程的毛利率`;
      default:
        return "執行 AI 指令";
    }
  };

  // 過濾指令
  const filterCommands = useCallback(
    (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setFilteredCommands(PREDEFINED_COMMANDS);
        setAiCommand(null);
        return;
      }

      const query = searchQuery.toLowerCase().trim();

      // 先嘗試解析 AI 指令
      const aiCmd = parseAICommand(searchQuery);
      setAiCommand(aiCmd);

      // 過濾預定義指令
      const filtered = PREDEFINED_COMMANDS.filter(
        (cmd) =>
          cmd.title.toLowerCase().includes(query) ||
          cmd.subtitle?.toLowerCase().includes(query) ||
          cmd.keywords.some((keyword) => keyword.toLowerCase().includes(query)),
      );

      setFilteredCommands(filtered);
      setSelectedIndex(0);
    },
    [parseAICommand],
  );

  // 處理輸入變化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    filterCommands(value);
  };

  // 執行選中的指令
  const handleExecuteSelected = async () => {
    const allOptions = aiCommand
      ? [aiCommand, ...filteredCommands]
      : filteredCommands;
    const selected = allOptions[selectedIndex];

    if (!selected) return;

    setIsProcessing(true);
    setExecutionState("processing");

    try {
      if ("intent" in selected) {
        // AI 指令
        await executeAICommand(selected);
      } else {
        // 預定義指令
        await selected.action();
      }

      setExecutionState("success");
      onExecuteCommand?.(selected);

      // 成功後自動關閉
      setTimeout(() => {
        onClose();
      }, 800);
    } catch (error) {
      setExecutionState("error");
      console.error("Command execution failed:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  // 執行 AI 指令
  const executeAICommand = async (command: AICommand): Promise<void> => {
    // 這裡應該調用實際的 AI API
    console.log("Executing AI command:", command);

    // 模擬 API 調用
    await new Promise((resolve) => setTimeout(resolve, 1500));

    switch (command.intent) {
      case "price_adjustment":
        console.log(`Adjusting prices by ${command.parameters.percentage}%`);
        break;
      case "create_itinerary":
        console.log(`Creating ${command.parameters.days}-day itinerary`);
        break;
      case "search_customer":
        console.log(`Searching for customer: ${command.parameters.name}`);
        break;
      default:
        console.log("Unknown AI command");
    }
  };

  // 渲染指令項目
  const renderCommandItem = (
    item: CommandAction | AICommand,
    index: number,
    isSelected: boolean,
  ) => {
    const isAI = "intent" in item;

    return (
      <motion.div
        key={isAI ? `ai-${item.intent}` : item.id}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.05 }}
        className={cn(
          "flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-all duration-200",
          isSelected
            ? [
                "bg-blue-500/20 dark:bg-blue-400/20",
                "border border-blue-500/30 dark:border-blue-400/30",
                "shadow-[0_0_20px_rgba(59,130,246,0.15)]",
              ]
            : ["hover:bg-white/5 dark:hover:bg-white/[0.02]"],
        )}
        onClick={() => handleExecuteSelected()}
      >
        {/* 圖示 */}
        <div
          className={cn(
            "flex-shrink-0 p-2 rounded-md",
            isAI
              ? "bg-purple-500/20 text-purple-400"
              : "bg-gray-500/20 text-gray-400",
          )}
        >
          {isAI ? <Sparkles className="w-4 h-4" /> : item.icon}
        </div>

        {/* 內容 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-medium text-white truncate">
              {isAI ? `AI: ${item.query}` : item.title}
            </h4>
            {isAI && (
              <span className="text-sm px-1.5 py-0.5 bg-purple-500/20 text-purple-300 rounded">
                {Math.round(item.confidence * 100)}%
              </span>
            )}
          </div>
          <p className="text-sm text-gray-400 truncate">
            {isAI ? item.preview : item.subtitle}
          </p>
        </div>

        {/* 執行指示器 */}
        {isSelected && (
          <div className="flex-shrink-0 text-blue-400">
            <ArrowRight className="w-4 h-4" />
          </div>
        )}
      </motion.div>
    );
  };

  if (!isOpen) return null;

  const allOptions = aiCommand
    ? [aiCommand, ...filteredCommands]
    : filteredCommands;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] bg-primary-900/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -20 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="w-full max-w-2xl mx-4"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 主要命令面板 */}
          <div className="bg-primary-900/80 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
            {/* 標題欄 */}
            <div className="flex items-center gap-3 px-6 py-4 border-b border-white/10">
              <Command className="w-5 h-5 text-blue-400" />
              <span className="text-sm font-medium text-white">指令面板</span>
              <span className="text-sm text-gray-400">Cmd + K</span>
            </div>

            {/* 搜尋輸入 */}
            <div className="p-6 border-b border-white/10">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={handleInputChange}
                  placeholder="輸入指令或自然語言查詢..."
                  className={cn(
                    "w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg",
                    "text-white placeholder-gray-400 text-sm",
                    "focus:outline-none focus:border-blue-500/30 focus:bg-white/[0.07]",
                    "transition-all duration-200",
                  )}
                  disabled={isProcessing}
                />

                {/* 處理狀態指示器 */}
                {executionState !== "idle" && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {executionState === "processing" && (
                      <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                    )}
                    {executionState === "success" && (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    )}
                    {executionState === "error" && (
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* 指令列表 */}
            <div className="max-h-96 overflow-y-auto">
              {allOptions.length > 0 ? (
                <div className="p-4 space-y-2">
                  {allOptions.map((item, index) =>
                    renderCommandItem(item, index, index === selectedIndex),
                  )}
                </div>
              ) : (
                <div className="p-8 text-center text-gray-400">
                  <Search className="w-8 h-8 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">沒有找到相關指令</p>
                  <p className="text-sm mt-1">
                    試試使用自然語言，如「提升所有價格 5%」
                  </p>
                </div>
              )}
            </div>

            {/* 底部提示 */}
            <div className="px-6 py-3 bg-white/[0.02] border-t border-white/10">
              <div className="flex items-center justify-between text-sm text-gray-400">
                <div className="flex items-center gap-4">
                  <span>↑↓ 選擇</span>
                  <span>Enter 執行</span>
                  <span>Esc 關閉</span>
                </div>
                {aiCommand && (
                  <div className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-purple-400" />
                    <span className="text-purple-300">AI 指令已識別</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// ============================================
// Command Bar Hook
// ============================================
export const useCommandBar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const openCommandBar = useCallback(() => setIsOpen(true), []);
  const closeCommandBar = useCallback(() => setIsOpen(false), []);
  const toggleCommandBar = useCallback(() => setIsOpen((prev) => !prev), []);

  return {
    isOpen,
    openCommandBar,
    closeCommandBar,
    toggleCommandBar,
  };
};

// ============================================
// Exports
// ============================================
export default CommandBar;
export type { CommandBarProps, CommandAction, AICommand };
