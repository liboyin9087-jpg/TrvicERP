import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
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
import { cn } from "@/lib/utils"; // Assuming this utility exists

// ============================================
// Type Definitions
// ============================================

/**
 * Represents a predefined command that can be executed.
 */
interface CommandAction {
  id: string;
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  category: string;
  keywords: string[];
  // The 'action' here is a placeholder; in a real app, this would be a command ID or a function
  // that the parent component resolves. CommandBar only "selects" it.
  action: () => void | Promise<void>;
  requiresConfirmation?: boolean;
}

/**
 * Represents an AI-parsed command.
 */
interface AICommand {
  query: string;
  intent: string;
  parameters: Record<string, any>;
  preview?: string;
  confidence: number;
  aiGenerated: boolean; // Explicitly mark as AI-generated
}

/**
 * Defines a pattern for AI command recognition.
 */
interface AICommandPattern {
  pattern: RegExp;
  intent: string;
  extract: (match: RegExpMatchArray) => Record<string, any>;
  generatePreview: (params: Record<string, any>) => string;
}

/**
 * Configuration for the CommandBar component.
 * This replaces hardcoded global state and allows for dynamic configuration.
 */
interface CommandBarConfig {
  /** Title displayed at the top of the command bar. */
  title?: string;
  /** Keyboard shortcut hint displayed. */
  shortcut?: string;
  /** Tailwind class for default icon size (e.g., "w-4 h-4"). */
  defaultIconSizeClass: string;
  /** A list of predefined, static commands. */
  predefinedCommands: CommandAction[];
  /** A list of patterns to recognize AI-driven commands. */
  aiCommandPatterns: AICommandPattern[];
  /** Optional: A function to generate a generic message when no commands are found. */
  noResultsMessage?: {
    title: string;
    subtitle?: string;
  };
}

/**
 * Props for the CommandBar component.
 */
interface CommandBarProps {
  /** Controls the visibility of the command bar. */
  isOpen: boolean;
  /** Callback to close the command bar. */
  onClose: () => void;
  /**
   * Callback invoked when a command (predefined or AI-parsed) is selected.
   * The actual execution logic should reside in the parent component.
   */
  onCommandSelected?: (command: CommandAction | AICommand) => void;
  /** Configuration object for the CommandBar. */
  config: CommandBarConfig;
}

// ============================================
// Helper Hook: useCommandProcessor
// This hook encapsulates the command filtering and AI parsing logic.
// ============================================
interface UseCommandProcessorOptions {
  predefinedCommands: CommandAction[];
  aiCommandPatterns: AICommandPattern[];
  // This could also be passed via config to define processing delays if needed
}

interface UseCommandProcessorResult {
  aiCommand: AICommand | null;
  filteredCommands: CommandAction[];
  isProcessingQuery: boolean; // Indicates if AI parsing/filtering is ongoing
  processQuery: (searchQuery: string) => void;
  resetProcessor: () => void;
}

const useCommandProcessor = ({
  predefinedCommands,
  aiCommandPatterns,
}: UseCommandProcessorOptions): UseCommandProcessorResult => {
  const [aiCommand, setAiCommand] = useState<AICommand | null>(null);
  const [filteredCommands, setFilteredCommands] = useState<CommandAction[]>(predefinedCommands);
  const [isProcessingQuery, setIsProcessingQuery] = useState(false);
  const processTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const parseAICommand = useCallback((input: string): AICommand | null => {
    for (const patternObj of aiCommandPatterns) {
      const match = input.match(patternObj.pattern);
      if (match) {
        const parameters = patternObj.extract(match);
        return {
          query: input,
          intent: patternObj.intent,
          parameters,
          preview: patternObj.generatePreview(parameters),
          confidence: 0.85, // Default confidence, can be dynamic
          aiGenerated: true,
        };
      }
    }
    return null;
  }, [aiCommandPatterns]);

  const processQuery = useCallback((searchQuery: string) => {
    if (processTimeoutRef.current) {
      clearTimeout(processTimeoutRef.current);
    }

    if (!searchQuery.trim()) {
      setFilteredCommands(predefinedCommands);
      setAiCommand(null);
      setIsProcessingQuery(false);
      return;
    }

    setIsProcessingQuery(true);
    const queryLower = searchQuery.toLowerCase().trim();

    processTimeoutRef.current = setTimeout(() => {
      // AI Parsing
      const aiCmd = parseAICommand(searchQuery);
      setAiCommand(aiCmd);

      // Predefined Commands Filtering
      const filtered = predefinedCommands.filter(
        (cmd) =>
          cmd.title.toLowerCase().includes(queryLower) ||
          cmd.subtitle?.toLowerCase().includes(queryLower) ||
          cmd.keywords.some((keyword) => keyword.toLowerCase().includes(queryLower)),
      );
      setFilteredCommands(filtered);
      setIsProcessingQuery(false);
    }, 100); // Simulate a slight delay for processing
  }, [predefinedCommands, parseAICommand]);

  const resetProcessor = useCallback(() => {
    if (processTimeoutRef.current) {
      clearTimeout(processTimeoutRef.current);
    }
    setAiCommand(null);
    setFilteredCommands(predefinedCommands);
    setIsProcessingQuery(false);
  }, [predefinedCommands]);

  return {
    aiCommand,
    filteredCommands,
    isProcessingQuery,
    processQuery,
    resetProcessor,
  };
};

// ============================================
// Command Bar Component
// ============================================
export const CommandBar: React.FC<CommandBarProps> = ({
  isOpen,
  onClose,
  onCommandSelected,
  config,
}) => {
  const {
    title = "指令面板",
    shortcut = "Cmd + K",
    defaultIconSizeClass,
    predefinedCommands,
    aiCommandPatterns,
    noResultsMessage = {
      title: "沒有找到相關指令",
      subtitle: "試試使用自然語言，如「提升所有價格 5%」",
    },
  } = config;

  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    aiCommand,
    filteredCommands,
    isProcessingQuery,
    processQuery,
    resetProcessor,
  } = useCommandProcessor({ predefinedCommands, aiCommandPatterns });

  // Reset state on open/close
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      resetProcessor();
      // Focus input
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, resetProcessor]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K (handled by parent to toggle isOpen)
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) {
          onClose();
        }
        // If not open, the parent component that listens globally should open it.
      }

      // ESC to close
      if (e.key === "Escape" && isOpen) {
        onClose();
      }

      // Navigation within the command bar
      if (isOpen && !isProcessingQuery) {
        const allOptions = aiCommand
          ? [aiCommand, ...filteredCommands]
          : filteredCommands;
        const totalOptions = allOptions.length;

        if (totalOptions === 0) return;

        if (e.key === "ArrowDown") {
          e.preventDefault();
          setSelectedIndex((prev) => Math.min(prev + 1, totalOptions - 1));
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
        }
        if (e.key === "Enter") {
          e.preventDefault();
          handleSelectCommand();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    isOpen,
    isProcessingQuery,
    filteredCommands,
    aiCommand,
    selectedIndex,
    onClose,
  ]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    processQuery(value);
    setSelectedIndex(0); // Reset selection on input change
  };

  const handleSelectCommand = () => {
    const allOptions = aiCommand
      ? ([aiCommand] as (CommandAction | AICommand)[]).concat(filteredCommands)
      : filteredCommands;
    const selected = allOptions[selectedIndex];

    if (selected) {
      onCommandSelected?.(selected);
      // It's up to the parent to decide if the bar closes after selection.
      // For immediate closing after selection:
      setTimeout(onClose, 300); // Give a brief moment for UI feedback if any
    }
  };

  const allOptions = useMemo(() => {
    return aiCommand
      ? ([aiCommand] as (CommandAction | AICommand)[]).concat(filteredCommands)
      : filteredCommands;
  }, [aiCommand, filteredCommands]);

  // Render individual command item
  const renderCommandItem = (
    item: CommandAction | AICommand,
    index: number,
    isSelected: boolean,
  ) => {
    const isAI = "aiGenerated" in item && item.aiGenerated;
    const itemKey = isAI ? `ai-${(item as AICommand).intent}-${index}` : (item as CommandAction).id;

    return (
      <motion.div
        key={itemKey}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05, duration: 0.2 }}
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
        onClick={() => {
          setSelectedIndex(index); // Select this item on click
          handleSelectCommand(); // And execute
        }}
      >
        {/* Icon */}
        <div
          className={cn(
            "flex-shrink-0 p-2 rounded-md",
            isAI
              ? "bg-purple-500/20 text-purple-400"
              : "bg-gray-500/20 text-gray-400",
          )}
        >
          {isAI ? <Sparkles className={defaultIconSizeClass} /> : item.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-medium text-white truncate">
              {isAI ? `AI: ${(item as AICommand).query}` : (item as CommandAction).title}
            </h4>
            {isAI && (
              <span className="text-sm px-1.5 py-0.5 bg-purple-500/20 text-purple-300 rounded">
                {Math.round((item as AICommand).confidence * 100)}%
              </span>
            )}
          </div>
          <p className="text-sm text-gray-400 truncate">
            {isAI ? (item as AICommand).preview : (item as CommandAction).subtitle}
          </p>
        </div>

        {/* Indicator */}
        {isSelected && (
          <div className="flex-shrink-0 text-blue-400">
            <ArrowRight className={defaultIconSizeClass} />
          </div>
        )}
      </motion.div>
    );
  };

  if (!isOpen) return null;

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
          {/* Main Command Panel */}
          <div className="bg-primary-900/80 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
            {/* Drag Handle & Title Bar */}
            <div className="flex items-center gap-3 px-6 py-4 border-b border-white/10">
              {/* Dashtail drag handle */}
              <div className="drag-handle cursor-grab active:cursor-grabbing">
                <Command className={cn(defaultIconSizeClass, "text-blue-400")} />
              </div>
              <span className="text-sm font-medium text-white">{title}</span>
              <span className="text-sm text-gray-400">{shortcut}</span>
            </div>

            {/* Search Input */}
            <div className="p-6 border-b border-white/10">
              <div className="relative">
                <Search className={cn("absolute left-3 top-1/2 -translate-y-1/2 text-gray-400", defaultIconSizeClass)} />
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
                  disabled={isProcessingQuery}
                />

                {/* Query processing indicator */}
                {isProcessingQuery && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 className={cn(defaultIconSizeClass, "text-blue-400 animate-spin")} />
                  </div>
                )}
              </div>
            </div>

            {/* Command List */}
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
                  <p className="text-sm">{noResultsMessage.title}</p>
                  {noResultsMessage.subtitle && <p className="text-sm mt-1">{noResultsMessage.subtitle}</p>}
                </div>
              )}
            </div>

            {/* Bottom Hints */}
            <div className="px-6 py-3 bg-white/[0.02] border-t border-white/10">
              <div className="flex items-center justify-between text-sm text-gray-400">
                <div className="flex items-center gap-4">
                  <span>↑↓ 選擇</span>
                  <span>Enter 執行</span>
                  <span>Esc 關閉</span>
                </div>
                {aiCommand && (
                  <div className="flex items-center gap-1">
                    <Sparkles className={cn(defaultIconSizeClass, "text-purple-400")} />
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
// Command Bar Hook for Parent Component
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
// Example Predefined Commands & AI Patterns (moved from global to example config)
// These would typically be imported from a separate config file or a global store.
// ============================================
const EXAMPLE_PREDEFINED_COMMANDS: CommandAction[] = [
  {
    id: "dashboard",
    title: "切換至儀表板",
    subtitle: "查看營運概況",
    icon: <TrendingUp className="w-4 h-4" />,
    category: "導覽",
    keywords: ["dashboard", "儀表板", "overview", "總覽"],
    action: () => console.log("Navigating to dashboard"),
  },
  {
    id: "new-tour",
    title: "新增旅遊行程",
    subtitle: "建立新的旅遊產品",
    icon: <Calendar className="w-4 h-4" />,
    category: "建立",
    keywords: ["new", "tour", "行程", "新增", "create"],
    action: () => console.log("Creating new tour"),
  },
  {
    id: "customer-search",
    title: "搜尋客戶",
    subtitle: "查找客戶資料",
    icon: <Users className="w-4 h-4" />,
    category: "搜尋",
    keywords: ["customer", "客戶", "search", "搜尋"],
    action: () => console.log("Searching customers"),
  },
  {
    id: "profit-analysis",
    title: "獲利分析",
    subtitle: "檢視財務報表",
    icon: <DollarSign className="w-4 h-4" />,
    category: "分析",
    keywords: ["profit", "獲利", "analysis", "分析", "financial"],
    action: () => console.log("Opening profit analysis"),
  },
  {
    id: "route-planner",
    title: "路線規劃",
    subtitle: "智能行程規劃",
    icon: <Map className="w-4 h-4" />,
    category: "工具",
    keywords: ["route", "路線", "planner", "規劃", "itinerary"],
    action: () => console.log("Opening route planner"),
  },
  {
    id: "settings",
    title: "設定",
    subtitle: "調整系統偏好",
    icon: <Settings className="w-4 h-4" />,
    category: "設定",
    keywords: ["settings", "配置", "選項"],
    action: () => console.log("Opening settings"),
  },
];

const EXAMPLE_AI_COMMAND_PATTERNS: AICommandPattern[] = [
  {
    pattern: /(?:提升|增加|調整).*?(?:價格|報價).*?(\d+)%/i,
    intent: "price_adjustment",
    extract: (match: RegExpMatchArray) => ({ percentage: parseInt(match[1]) }),
    generatePreview: (params: Record<string, any>) =>
      `將所有產品價格調整 ${params.percentage}%`,
  },
  {
    pattern: /(?:規劃|建立|新增).*?(\d+)天.*?行程/i,
    intent: "create_itinerary",
    extract: (match: RegExpMatchArray) => ({ days: parseInt(match[1]) }),
    generatePreview: (params: Record<string, any>) =>
      `AI 將規劃一個 ${params.days} 天的行程`,
  },
  {
    pattern: /(?:搜尋|查找|找).*?客戶.*?([\u4e00-\u9fa5\w]+)/i,
    intent: "search_customer",
    extract: (match: RegExpMatchArray) => ({ name: match[1] }),
    generatePreview: (params: Record<string, any>) =>
      `搜尋客戶："${params.name}"`,
  },
  {
    pattern: /(?:計算|分析).*?毛利/i,
    intent: "calculate_profit",
    extract: () => ({}),
    generatePreview: () => `計算所有行程的毛利率`,
  },
];

// This is an example of how the config would be structured and passed
// In a real application, this would come from a global configuration, a Context API, or prop drilling from a parent.
export const EXAMPLE_COMMAND_BAR_CONFIG: CommandBarConfig = {
  title: "指令面板",
  shortcut: "Cmd + K",
  defaultIconSizeClass: "w-4 h-4", // Unified icon size
  predefinedCommands: EXAMPLE_PREDEFINED_COMMANDS,
  aiCommandPatterns: EXAMPLE_AI_COMMAND_PATTERNS,
  noResultsMessage: {
    title: "沒有找到相關指令",
    subtitle: "試試使用自然語言，如「提升所有價格 5%」",
  },
};

// ============================================
// Exports
// ============================================
export default CommandBar;
export type { CommandBarProps, CommandAction, AICommand, CommandBarConfig, AICommandPattern };