import React, { useEffect } from "react";
import { DataGrid, Column } from "@/design-system";
import { useDataGrid, useAudit } from "@/hooks/useDataGrid";
import { auditService } from "@/services/auditService";

// ============================================
// Example Data
// ============================================

interface TourSession {
  id: string;
  series_id: string;
  group_number: string;
  start_date: string;
  end_date: string;
  status: "soliciting" | "guaranteed" | "closed" | "completed";
  current_pax: number;
  max_pax: number;
  price_twd: number;
}

const mockTourSessions: TourSession[] = [
  {
    id: "tour_001",
    series_id: "TOKYO2025",
    group_number: "TK001",
    start_date: "2025-03-15",
    end_date: "2025-03-19",
    status: "guaranteed",
    current_pax: 25,
    max_pax: 30,
    price_twd: 45000,
  },
  {
    id: "tour_002",
    series_id: "OSAKA2025",
    group_number: "OS001",
    start_date: "2025-04-10",
    end_date: "2025-04-14",
    status: "soliciting",
    current_pax: 8,
    max_pax: 25,
    price_twd: 38000,
  },
  // Add more mock data as needed
];

// ============================================
// Example Component
// ============================================

export default function TourSessionManager() {
  const { log: logAction } = useAudit();
  const {
    currentPageData,
    pagination,
    loading,
    updateData,
    handlePaginationChange,
    handleSortChange,
    handleRowSelection,
  } = useDataGrid<TourSession>({
    initialData: mockTourSessions,
    pageSize: 10,
  });

  // Initialize some audit logs for demonstration
  useEffect(() => {
    const initializeAuditLogs = async () => {
      // Log some sample activities
      await auditService.log({
        action: "tour_session_created",
        resource_type: "tour_session",
        resource_id: "tour_001",
        resource_name: "東京五日遊",
        user_id: "user_001",
        user_name: "張經理",
        user_role: "staff",
        new_values: { status: "soliciting", max_pax: 30 },
        metadata: { initial_creation: true },
      });

      await auditService.log({
        action: "tour_session_updated",
        resource_type: "tour_session",
        resource_id: "tour_001",
        old_values: { status: "soliciting" },
        new_values: { status: "guaranteed" },
        user_id: "user_001",
        user_name: "張經理",
        user_role: "staff",
        metadata: { reason: "minimum participants reached" },
      });
    };

    initializeAuditLogs();
  }, []);

  // Define columns for the DataGrid
  const columns: Column<TourSession>[] = [
    {
      key: "group_number",
      title: "團號",
      dataIndex: "group_number",
      sortable: true,
      width: 120,
    },
    {
      key: "series_id",
      title: "系列",
      dataIndex: "series_id",
      width: 140,
    },
    {
      key: "dates",
      title: "日期",
      dataIndex: "start_date",
      width: 200,
      render: (value: string, record: TourSession) => (
        <div>
          <div className="font-medium">{record.start_date}</div>
          <div className="text-sm text-gray-500">至 {record.end_date}</div>
        </div>
      ),
    },
    {
      key: "status",
      title: "狀態",
      dataIndex: "status",
      width: 120,
      render: (status: string) => {
        const statusConfig = {
          soliciting: { label: "招團中", color: "bg-warning/10 text-warning" },
          guaranteed: { label: "成團", color: "bg-success/10 text-success" },
          closed: { label: "已截止", color: "bg-gray-100 text-gray-600" },
          completed: { label: "已完成", color: "bg-blue-100 text-blue-800" },
        };

        const config =
          statusConfig[status as keyof typeof statusConfig] ||
          statusConfig.soliciting;

        return (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}
          >
            {config.label}
          </span>
        );
      },
    },
    {
      key: "participants",
      title: "人數",
      dataIndex: "current_pax",
      width: 120,
      align: "center",
      render: (current: number, record: TourSession) => (
        <div className="text-center">
          <span className="font-medium">{current}</span>
          <span className="text-gray-400"> / {record.max_pax}</span>
        </div>
      ),
    },
    {
      key: "price_twd",
      title: "價格",
      dataIndex: "price_twd",
      width: 120,
      align: "right",
      render: (price: number) => (
        <span className="font-medium">NT$ {price.toLocaleString()}</span>
      ),
    },
  ];

  // Handle status change (with audit logging)
  const handleStatusChange = async (
    tourSession: TourSession,
    newStatus: TourSession["status"],
  ) => {
    const oldStatus = tourSession.status;

    // Update the data
    const updatedData = mockTourSessions.map((session) =>
      session.id === tourSession.id
        ? { ...session, status: newStatus }
        : session,
    );
    updateData(updatedData);

    // Log the status change
    await logAction("tour_session_updated", "tour_session", tourSession.id, {
      status_transition: `${oldStatus} → ${newStatus}`,
      group_number: tourSession.group_number,
    });
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">團體行程管理</h1>
        <p className="text-gray-600 mt-1">
          管理所有團體行程，包含招團、成團、和完成狀態
        </p>
      </div>

      <DataGrid<TourSession>
        data={currentPageData}
        columns={columns}
        loading={loading}
        rowKey="id"
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
        }}
        onPaginationChange={handlePaginationChange}
        onSortChange={handleSortChange}
        rowSelection={{
          onChange: handleRowSelection,
        }}
        toolbar={{
          title: `團體行程 (${pagination.total})`,
          search: {
            placeholder: "搜尋團號或系列...",
            onSearch: (value) => {
              // Implement search logic
              console.log("Searching for:", value);
            },
          },
          refresh: {
            onRefresh: () => {
              console.log("Refreshing data...");
              // Implement refresh logic
            },
          },
          export: {
            filename: "tour_sessions",
            onExport: () => {
              console.log("Exporting data...");
              // Implement export logic
            },
          },
        }}
        actions={{
          show: true,
          items: [
            {
              key: "view",
              label: "查看詳情",
              onClick: (record) => {
                console.log("View tour session:", record);
              },
            },
            {
              key: "edit",
              label: "編輯",
              onClick: (record) => {
                console.log("Edit tour session:", record);
              },
            },
            {
              key: "guarantee",
              label: "確認成團",
              onClick: (record) => {
                handleStatusChange(record, "guaranteed");
              },
              disabled: (record) => record.status !== "soliciting",
            },
            {
              key: "close",
              label: "截止報名",
              onClick: (record) => {
                handleStatusChange(record, "closed");
              },
              disabled: (record) =>
                ["closed", "completed"].includes(record.status),
            },
          ],
        }}
        className="bg-white rounded-lg shadow-sm"
        hoverable
        bordered
      />
    </div>
  );
}
