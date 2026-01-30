import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  Shield,
  AlertTriangle,
  Users,
  Download,
  RefreshCw,
  Eye,
  Trash2,
  AlertCircle,
  Info,
  Clock,
} from "lucide-react";
import DataGrid, { Column } from "@/design-system/DataGrid";
import Button from "@/design-system/Button";
import type { AuditLog, AuditLogQuery, AuditLogStats } from "@/types/audit";

// ============================================
// Design System/Theming Definitions (Conceptual)
// These would typically live in a global theme config or design system files.
// For this exercise, they are defined here for clarity and compliance.
// ============================================

// Centralized color configuration for consistency using Tailwind Tokens
interface ThemeColors {
  primary: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  secondary: string;
}

const THEME_COLOR_MAP: ThemeColors = {
  primary: "bg-primary-500", // Corresponds to original blue
  success: "bg-success-500", // Corresponds to original green
  warning: "bg-warning-500", // Corresponds to original yellow
  error: "bg-error-500", // Corresponds to original red
  info: "bg-info-500", // For info/medium severity, distinct from primary
  secondary: "bg-secondary-500", // For general/low severity
};

// Badges specific colors using Tailwind Tokens
const BADGE_CONFIG = {
  low: { color: "bg-secondary/10 text-secondary", icon: Info }, // bg-secondary-100 text-secondary-800
  medium: { color: "bg-info/10 text-info", icon: Info }, // bg-blue-100 text-blue-800 -> bg-info/10 text-info
  high: { color: "bg-warning/10 text-warning", icon: AlertTriangle },
  critical: { color: "bg-error/10 text-error", icon: AlertCircle },
};

const ACTION_COLOR_MAP: { [key: string]: string } = {
  create: "bg-success/10 text-success",
  update: "bg-info/10 text-info",
  delete: "bg-error/10 text-error",
  failed: "bg-error/10 text-error",
  login: "bg-primary/10 text-primary", // bg-blue-100 text-blue-800 -> bg-primary/10 text-primary
  default: "bg-secondary/10 text-secondary",
};

// ============================================
// Presentational Sub-Components
// ============================================

// WidgetContainer: A conceptual design system component for draggable widgets.
// It provides the standard card structure and the drag-handle.
interface WidgetContainerProps {
  title: string | React.ReactNode;
  description?: string | React.ReactNode;
  headerActions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string; // For applying classes directly to the content area
}

function WidgetContainer({
  title,
  description,
  headerActions,
  children,
  className,
  contentClassName,
}: WidgetContainerProps) {
  return (
    <div
      className={`bg-surface rounded-lg border border-border-default shadow-sm ${className}`}
    >
      <div className="flex items-center justify-between p-4 border-b border-border-default drag-handle">
        {/* .drag-handle is essential for Dashtail/TrvicERP draggable widgets */}
        <div>
          {typeof title === "string" ? (
            <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
          ) : (
            title
          )}
          {description &&
            (typeof description === "string" ? (
              <p className="text-sm text-text-secondary mt-0.5">
                {description}
              </p>
            ) : (
              description
            ))}
        </div>
        {headerActions && <div className="flex-shrink-0">{headerActions}</div>}
      </div>
      <div className={`p-4 ${contentClassName}`}>{children}</div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color?: keyof ThemeColors; // Use defined theme keys
  trend?: { value: number; label: string };
}

function StatCard({
  title,
  value,
  icon,
  color = "primary",
  trend,
}: StatCardProps) {
  const bgColorClass = THEME_COLOR_MAP[color] || THEME_COLOR_MAP.primary;

  return (
    <div className="bg-surface rounded-lg border border-border-default p-4 md:p-6 focus:ring-2 focus:ring-primary-300 active:bg-primary-100 transition-all duration-200 ease-in-out">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-text-secondary">{title}</p>
          <p className="text-xl md:text-2xl font-bold text-text-primary">
            {value}
          </p>
          {trend && (
            <p className="text-xs md:text-sm text-text-tertiary mt-1">
              {trend.value > 0 ? "+" : ""}
              {trend.value}% {trend.label}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-full ${bgColorClass} text-white`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

interface SeverityBadgeProps {
  severity: AuditLog["severity"];
}

function SeverityBadge({ severity }: SeverityBadgeProps) {
  const { color, icon: Icon } = BADGE_CONFIG[severity];

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}
    >
      <Icon className="w-3 h-3 mr-1" />
      {severity.toUpperCase()}
    </span>
  );
}

interface ActionBadgeProps {
  action: string;
}

function ActionBadge({ action }: ActionBadgeProps) {
  const getActionColor = useCallback((action: string) => {
    if (action.includes("create")) return ACTION_COLOR_MAP.create;
    if (action.includes("update")) return ACTION_COLOR_MAP.update;
    if (action.includes("delete")) return ACTION_COLOR_MAP.delete;
    if (action.includes("failed")) return ACTION_COLOR_MAP.failed;
    if (action.includes("login")) return ACTION_COLOR_MAP.login;
    return ACTION_COLOR_MAP.default;
  }, []);

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionColor(action)}`}
    >
      {action.replace(/_/g, " ").toUpperCase()}
    </span>
  );
}

// ============================================
// Presentational Component Interface
// ============================================

/**
 * AuditDashboardConfig defines the props for the AuditDashboardPresentational component.
 * This interface allows the component to receive all necessary data, callbacks,
 * and configurations from a parent (e.g., a container component or a widget configuration system).
 */
interface AuditDashboardConfig {
  logs: AuditLog[];
  stats: AuditLogStats | null;
  loading: boolean;
  query: AuditLogQuery;
  selectedRows: AuditLog[];
  onRefresh: () => void;
  onExport: (logsToExport: AuditLog[]) => void;
  onSearch: (searchValue: string) => void;
  onPaginationChange: (page: number, pageSize: number) => void;
  onRowSelectionChange: (keys: string[], rows: AuditLog[]) => void;
  totalLogsCount: number; // For DataGrid pagination
  // Add more configurable props here if needed, e.g., default filters, visible columns.
}

/**
 * AuditDashboardPresentational is responsible for rendering the UI based on its props.
 * It contains no state management, data fetching, or business logic.
 */
function AuditDashboardPresentational({
  logs,
  stats,
  loading,
  query,
  selectedRows,
  onRefresh,
  onExport,
  onSearch,
  onPaginationChange,
  onRowSelectionChange,
  totalLogsCount,
}: AuditDashboardConfig) {
  // Table columns definition, memoized as it's purely display logic and static
  const columns: Column<AuditLog>[] = useMemo(
    () => [
      {
        key: "timestamp",
        title: "時間",
        dataIndex: "timestamp",
        sortable: true,
        width: 150,
        render: (timestamp: string) => (
          <div className="text-xs md:text-sm">
            {new Date(timestamp).toLocaleString("zh-TW")}
          </div>
        ),
      },
      {
        key: "user_name",
        title: "用戶",
        dataIndex: "user_name",
        width: 120,
        render: (name: string, record: AuditLog) => (
          <div>
            <div className="font-medium text-xs md:text-sm">{name}</div>
            <div className="text-xs text-text-tertiary">
              {record.user_role}
            </div>
          </div>
        ),
      },
      {
        key: "action",
        title: "操作",
        dataIndex: "action",
        width: 140,
        render: (action: string) => <ActionBadge action={action} />,
      },
      {
        key: "resource",
        title: "資源",
        dataIndex: "resource_type",
        width: 120,
        render: (type: string, record: AuditLog) => (
          <div>
            <div className="font-medium text-xs md:text-sm">{type}</div>
            <div
              className="text-xs text-text-tertiary truncate max-w-[100px]"
              title={record.resource_id}
            >
              {record.resource_name || record.resource_id.slice(0, 10)}...
            </div>
          </div>
        ),
      },
      {
        key: "severity",
        title: "嚴重程度",
        dataIndex: "severity",
        width: 100,
        render: (severity: AuditLog["severity"]) => (
          <SeverityBadge severity={severity} />
        ),
      },
      {
        key: "ip_address",
        title: "IP 位址",
        dataIndex: "ip_address",
        width: 100,
        render: (ip: string) => (
          <span className="text-xs md:text-sm">{ip}</span>
        ),
      },
      {
        key: "changes",
        title: "變更",
        dataIndex: "old_values",
        width: 200,
        render: (oldValues: any) => {
          if (!oldValues || Object.keys(oldValues).length === 0) {
            return (
              <span className="text-text-disabled text-xs md:text-sm">
                無變更
              </span>
            );
          }

          const changedFields = Object.keys(oldValues);
          return (
            <div className="text-xs md:text-sm">
              <span className="text-text-secondary">修改了 </span>
              <span className="font-medium">{changedFields.length}</span>
              <span className="text-text-secondary"> 個欄位</span>
              <div className="text-xs text-text-tertiary mt-1">
                {changedFields.slice(0, 2).join(", ")}
                {changedFields.length > 2 && " ..."}
              </div>
            </div>
          );
        },
      },
    ],
    [],
  ); // columns are static and don't depend on props, so memoize once

  return (
    <div className="p-4 md:p-6 bg-surface-secondary min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
        {/* Header - This could be part of a page layout or the widget itself if it's a fullscreen component */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-text-primary flex items-center gap-2">
              <Shield className="w-6 h-6 md:w-7 md:h-7 text-brand-600" />
              審計日誌管理
            </h1>
            <p className="text-text-secondary mt-1">系統操作記錄與安全監控</p>
          </div>

          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            <Button variant="ghost" onClick={onRefresh} disabled={loading} size="sm">
              <RefreshCw
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              />
              重新整理
            </Button>

            <Button
              variant="secondary"
              onClick={() => onExport(selectedRows.length > 0 ? selectedRows : logs)}
              disabled={logs.length === 0 && selectedRows.length === 0}
              size="sm"
            >
              <Download className="w-4 h-4" />
              匯出記錄
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <StatCard
              title="總記錄數"
              value={stats.total_logs.toLocaleString()}
              icon={<Activity className="w-5 h-5" />}
              color="primary"
            />

            <StatCard
              title="關鍵警報"
              value={stats.logs_by_severity.critical || 0}
              icon={<AlertTriangle className="w-5 h-5" />}
              color="error"
            />

            <StatCard
              title="活躍用戶"
              value={stats.logs_by_user.length}
              icon={<Users className="w-5 h-5" />}
              color="success"
            />

            <StatCard
              title="今日活動"
              value={
                stats.recent_activity.filter(
                  (log) =>
                    new Date(log.timestamp).toDateString() ===
                    new Date().toDateString(),
                ).length
              }
              icon={<Clock className="w-5 h-5" />}
              color="warning"
            />
          </div>
        )}

        {/* Recent Security Alerts */}
        {stats?.security_alerts && stats.security_alerts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-error-surface border border-error-border rounded-lg p-4 focus:ring-2 focus:ring-primary-300 active:bg-primary-100 transition-all duration-200 ease-in-out"
          >
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="w-5 h-5 text-error" />
              <h3 className="font-semibold text-error-dark">最近安全警報</h3>
            </div>
            <div className="space-y-2">
              {stats.security_alerts.slice(0, 3).map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between text-xs md:text-sm"
                >
                  <div className="flex flex-wrap items-center gap-2 md:gap-3">
                    <ActionBadge action={alert.action} />
                    <span className="text-error-dark">{alert.user_name}</span>
                    <span className="text-error-normal">
                      {alert.resource_type}:{alert.resource_id}
                    </span>
                  </div>
                  <span className="text-text-tertiary">
                    {new Date(alert.timestamp).toLocaleString("zh-TW")}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Data Grid */}
        <WidgetContainer
          title={`審計記錄 (${logs.length})`}
          headerActions={
            <div className="flex items-center gap-2">
              {/* Optional: Add specific widget-level actions here if not handled by DataGrid toolbar */}
            </div>
          }
          contentClassName="p-0" // DataGrid has its own internal padding
        >
          <DataGrid<AuditLog>
            data={logs}
            columns={columns}
            loading={loading}
            rowKey="id"
            rowSelection={{
              selectedRowKeys: selectedRows.map((row) => row.id),
              onChange: onRowSelectionChange,
            }}
            toolbar={{
              title: null, // Title is handled by WidgetContainer
              search: {
                placeholder: "搜尋用戶、操作或資源...",
                onSearch: onSearch,
              },
              refresh: {
                onRefresh: onRefresh,
              },
              export: {
                filename: "audit_logs",
                onExport: () =>
                  onExport(selectedRows.length > 0 ? selectedRows : logs),
              },
            }}
            actions={{
              show: true,
              items: [
                {
                  key: "view",
                  label: "查看詳情",
                  icon: <Eye className="w-4 h-4" />,
                  onClick: (record) => {
                    console.log("View audit log:", record);
                    // Open modal or navigate to detail view
                  },
                },
                {
                  key: "delete",
                  label: "刪除記錄",
                  icon: <Trash2 className="w-4 h-4" />,
                  onClick: (record) => {
                    console.log("Delete audit log:", record);
                    // Show confirmation modal
                  },
                  disabled: (record) => record.severity === "critical",
                },
              ],
            }}
            pagination={{
              current: (query.offset || 0) / (query.limit || 50) + 1,
              pageSize: query.limit || 50,
              total: totalLogsCount,
            }}
            onPaginationChange={onPaginationChange}
            hoverable
            bordered
          />
        </WidgetContainer>
      </div>
    </div>
  );
}

// ============================================
// Container Component
// ============================================

// Import auditService ONLY in the container component
import { auditService } from "@/services/auditService";

/**
 * AuditDashboardContainer handles data fetching, state management, and business logic.
 * It acts as the "smart" component that provides data and callbacks to the "dumb"
 * AuditDashboardPresentational component. This is the default export for the widget.
 */
export default function AuditDashboardContainer() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<AuditLogStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState<AuditLogQuery>({
    limit: 50,
    offset: 0,
    order_by: "timestamp",
    order_direction: "desc",
  });
  const [selectedRows, setSelectedRows] = useState<AuditLog[]>([]);
  const [totalLogsCount, setTotalLogsCount] = useState(0); // State to store total logs count for pagination

  // Load data function, memoized with useCallback
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [logsResult, statsResult] = await Promise.all([
        auditService.query(query),
        auditService.getStats(),
      ]);

      setLogs(logsResult.logs);
      setTotalLogsCount(logsResult.total_count || 0); // Assuming logsResult includes total_count
      setStats(statsResult);
    } catch (error) {
      console.error("Failed to load audit data:", error);
      // In a real app, integrate with a notification system (e.g., toast)
    } finally {
      setLoading(false);
    }
  }, [query]); // Rerun when query changes

  // Effect to load data on component mount and when query changes
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Export handler, memoized
  const handleExport = useCallback((logsToExport: AuditLog[]) => {
    const csv = generateCSV(logsToExport);
    downloadCSV(
      csv,
      `audit_logs_${new Date().toISOString().split("T")[0]}.csv`,
    );
  }, []);

  // Refresh handler, memoized
  const handleRefresh = useCallback(() => {
    setQuery({
      limit: 50,
      offset: 0,
      order_by: "timestamp",
      order_direction: "desc",
    }); // Reset query for fresh data fetch
    setSelectedRows([]); // Clear selected rows on refresh
    // loadData will be re-triggered by the useEffect due to query change
  }, []);

  // Search handler, memoized
  const handleSearch = useCallback((searchValue: string) => {
    // In a real implementation, this would involve updating the 'query' state
    // with a search_term and potentially resetting offset to 0.
    console.log("Search value:", searchValue);
    setQuery((prev) => ({
      ...prev,
      offset: 0,
      // search_term: searchValue, // Example: Add search term to query
    }));
  }, []);

  // Pagination change handler, memoized
  const handlePaginationChange = useCallback(
    (page: number, pageSize: number) => {
      setQuery((prev) => ({
        ...prev,
        offset: (page - 1) * pageSize,
        limit: pageSize,
      }));
    },
    [],
  );

  // Row selection change handler, memoized
  const handleRowSelectionChange = useCallback(
    (keys: string[], rows: AuditLog[]) => {
      setSelectedRows(rows);
    },
    [],
  );

  // Helper functions for CSV generation (could be externalized to a utility file)
  const generateCSV = (data: AuditLog[]): string => {
    const headers = [
      "時間",
      "用戶",
      "角色",
      "操作",
      "資源類型",
      "資源ID",
      "嚴重程度",
      "IP位址",
      "變更詳情", // Added for completeness, if changes are complex, this might need more logic
    ];
    const rows = data.map((log) => [
      log.timestamp,
      log.user_name,
      log.user_role,
      log.action,
      log.resource_type,
      log.resource_id,
      log.severity,
      log.ip_address || "",
      JSON.stringify({ old: log.old_values, new: log.new_values }), // Export changes as JSON string
    ]);

    // Simple CSV generation, for complex data, a dedicated CSV library might be better
    return [headers, ...rows].map((row) => row.join(",")).join("\n");
  };

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob(["\ufeff" + content], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href); // Clean up the URL object
  };

  return (
    <AuditDashboardPresentational
      logs={logs}
      stats={stats}
      loading={loading}
      query={query}
      selectedRows={selectedRows}
      onRefresh={handleRefresh}
      onExport={handleExport}
      onSearch={handleSearch}
      onPaginationChange={handlePaginationChange}
      onRowSelectionChange={handleRowSelectionChange}
      totalLogsCount={totalLogsCount}
    />
  );
}