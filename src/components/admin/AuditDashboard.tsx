import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  Shield,
  AlertTriangle,
  Users,
  Calendar,
  FileText,
  Filter,
  Download,
  Search,
  RefreshCw,
  Eye,
  Trash2,
  AlertCircle,
  CheckCircle,
  Info,
  Clock,
} from "lucide-react";
import DataGrid, { Column } from "@/design-system/DataGrid";
import Button from "@/design-system/Button";
import { auditService } from "@/services/auditService";
import type { AuditLog, AuditLogQuery, AuditLogStats } from "@/types/audit";

// ============================================
// Components
// ============================================

function StatCard({
  title,
  value,
  icon,
  color = "blue",
  trend,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color?: string;
  trend?: { value: number; label: string };
}) {
  const colorClasses = {
    blue: "bg-blue-500",
    green: "bg-success",
    yellow: "bg-warning",
    red: "bg-error",
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {trend && (
            <p className="text-sm text-gray-500 mt-1">
              {trend.value > 0 ? "+" : ""}
              {trend.value}% {trend.label}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-full ${colorClasses[color]} text-white`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function SeverityBadge({ severity }: { severity: AuditLog["severity"] }) {
  const config = {
    low: { color: "bg-secondary-100 text-secondary-800", icon: Info },
    medium: { color: "bg-blue-100 text-blue-800", icon: Info },
    high: { color: "bg-warning/10 text-warning", icon: AlertTriangle },
    critical: { color: "bg-error/10 text-error", icon: AlertCircle },
  };

  const { color, icon: Icon } = config[severity];

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}
    >
      <Icon className="w-3 h-3 mr-1" />
      {severity.toUpperCase()}
    </span>
  );
}

function ActionBadge({ action }: { action: string }) {
  const getActionColor = (action: string) => {
    if (action.includes("create")) return "bg-success/10 text-success";
    if (action.includes("update")) return "bg-info/10 text-info";
    if (action.includes("delete")) return "bg-error/10 text-error";
    if (action.includes("failed")) return "bg-error/10 text-error";
    if (action.includes("login")) return "bg-blue-100 text-blue-800";
    return "bg-secondary-100 text-secondary-800";
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionColor(action)}`}
    >
      {action.replace(/_/g, " ").toUpperCase()}
    </span>
  );
}

// ============================================
// Main Component
// ============================================

export default function AuditDashboard() {
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

  // Load data
  const loadData = async () => {
    setLoading(true);
    try {
      const [logsResult, statsResult] = await Promise.all([
        auditService.query(query),
        auditService.getStats(),
      ]);

      setLogs(logsResult.logs);
      setStats(statsResult);
    } catch (error) {
      console.error("Failed to load audit data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Table columns
  const columns: Column<AuditLog>[] = [
    {
      key: "timestamp",
      title: "時間",
      dataIndex: "timestamp",
      sortable: true,
      width: 150,
      render: (timestamp: string) => (
        <div className="text-sm">
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
          <div className="font-medium text-sm">{name}</div>
          <div className="text-xs text-gray-500">{record.user_role}</div>
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
          <div className="font-medium text-sm">{type}</div>
          <div className="text-xs text-gray-500" title={record.resource_id}>
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
    },
    {
      key: "changes",
      title: "變更",
      dataIndex: "old_values",
      width: 200,
      render: (oldValues: any, record: AuditLog) => {
        if (!oldValues || Object.keys(oldValues).length === 0) {
          return <span className="text-gray-400">無變更</span>;
        }

        const changedFields = Object.keys(oldValues);
        return (
          <div className="text-sm">
            <span className="text-gray-600">修改了 </span>
            <span className="font-medium">{changedFields.length}</span>
            <span className="text-gray-600"> 個欄位</span>
            <div className="text-xs text-gray-500 mt-1">
              {changedFields.slice(0, 2).join(", ")}
              {changedFields.length > 2 && " ..."}
            </div>
          </div>
        );
      },
    },
  ];

  // Handlers
  const handleExport = async () => {
    // Export selected logs or all logs
    const logsToExport = selectedRows.length > 0 ? selectedRows : logs;
    const csv = generateCSV(logsToExport);
    downloadCSV(
      csv,
      `audit_logs_${new Date().toISOString().split("T")[0]}.csv`,
    );
  };

  const handleRefresh = () => {
    loadData();
  };

  const handleSearch = (searchValue: string) => {
    setQuery((prev) => ({ ...prev, offset: 0 }));
    // In real implementation, this would be sent to the backend
  };

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
    ]);

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
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "red";
      case "high":
        return "yellow";
      case "medium":
        return "blue";
      default:
        return "green";
    }
  };

  return (
    <div className="p-6 bg-surface min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Shield className="w-7 h-7 text-brand-600" />
              審計日誌管理
            </h1>
            <p className="text-gray-600 mt-1">系統操作記錄與安全監控</p>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={handleRefresh} disabled={loading}>
              <RefreshCw
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              />
              重新整理
            </Button>

            <Button
              variant="secondary"
              onClick={handleExport}
              disabled={logs.length === 0}
            >
              <Download className="w-4 h-4" />
              匯出記錄
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="總記錄數"
              value={stats.total_logs.toLocaleString()}
              icon={<Activity className="w-5 h-5" />}
              color="blue"
            />

            <StatCard
              title="關鍵警報"
              value={stats.logs_by_severity.critical || 0}
              icon={<AlertTriangle className="w-5 h-5" />}
              color="red"
            />

            <StatCard
              title="活躍用戶"
              value={stats.logs_by_user.length}
              icon={<Users className="w-5 h-5" />}
              color="green"
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
              color="yellow"
            />
          </div>
        )}

        {/* Recent Security Alerts */}
        {stats?.security_alerts && stats.security_alerts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 rounded-lg p-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <h3 className="font-semibold text-red-900">最近安全警報</h3>
            </div>
            <div className="space-y-2">
              {stats.security_alerts.slice(0, 3).map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-3">
                    <ActionBadge action={alert.action} />
                    <span className="text-red-800">{alert.user_name}</span>
                    <span className="text-red-600">
                      {alert.resource_type}:{alert.resource_id}
                    </span>
                  </div>
                  <span className="text-red-500">
                    {new Date(alert.timestamp).toLocaleString("zh-TW")}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Data Grid */}
        <DataGrid<AuditLog>
          data={logs}
          columns={columns}
          loading={loading}
          rowKey="id"
          rowSelection={{
            selectedRowKeys: selectedRows.map((row) => row.id),
            onChange: (keys, rows) => setSelectedRows(rows),
          }}
          toolbar={{
            title: `審計記錄 (${logs.length})`,
            search: {
              placeholder: "搜尋用戶、操作或資源...",
              onSearch: handleSearch,
            },
            refresh: {
              onRefresh: handleRefresh,
            },
            export: {
              filename: "audit_logs",
              onExport: handleExport,
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
            total: stats?.total_logs || 0,
          }}
          onPaginationChange={(page, pageSize) => {
            setQuery((prev) => ({
              ...prev,
              offset: (page - 1) * pageSize,
              limit: pageSize,
            }));
          }}
          className="bg-white"
          hoverable
          bordered
        />
      </div>
    </div>
  );
}
