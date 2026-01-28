import React, { useEffect, useState, useCallback } from "react";
import { DataGrid, Column } from "@/design-system";
import { useDataGrid, useAudit } from "@/hooks/useDataGrid"; // Assuming useAudit is a general logging hook
import AICopilotPanel from "@/components/shared/AICopilotPanel";

// ============================================
// Types Definition
// ============================================

/**
 * Defines the structure for a Tour Session.
 * This interface is essential for type-checking data passed into the component.
 */
export interface TourSession {
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

/**
 * Defines the configuration properties for the TourSessionExample component.
 * This allows the component to receive all necessary data and dependencies via props,
 * ensuring Kintone independence and avoiding reliance on global stores or mock data.
 * The component's name matches its file path, `/src/examples/TourSessionExample.tsx`.
 */
export interface TourSessionExampleConfig {
  /**
   * Initial data for the tour sessions to be displayed in the DataGrid.
   * This replaces the direct dependency on mock data.
   */
  initialTourSessions: TourSession[];
  /**
   * Optional callback for logging audit actions.
   * This allows external services (like an audit service) to be injected
   * instead of the component directly coupling to a specific implementation.
   */
  onLogAction?: (
    action: string,
    resource_type: string,
    resource_id: string,
    metadata?: Record<string, any>,
  ) => Promise<void>;
  /**
   * Optional title for the component's main heading.
   */
  title?: string;
  /**
   * Optional description for the component.
   */
  description?: string;
  /**
   * Optional placeholder for the search bar in the DataGrid.
   */
  searchPlaceholder?: string;
  /**
   * Optional page size for the DataGrid.
   */
  pageSize?: number;
  /**
   * If true, AI Copilot Panel will be shown.
   */
  showAICopilot?: boolean;
}

// ============================================
// TourSessionExample Component
// ============================================

/**
 * `TourSessionExample` component for managing tour sessions.
 * This component is designed to be configurable via props,
 * ensuring Kintone independence and separation of concerns.
 */
export default function TourSessionExample({
  initialTourSessions,
  onLogAction,
  title = "團體行程管理",
  description = "管理所有團體行程，包含招團、成團、和完成狀態",
  searchPlaceholder = "搜尋團號或系列...",
  pageSize = 10,
  showAICopilot = true,
}: TourSessionExampleConfig) {
  // Use `useAudit` internally as a fallback or if `onLogAction` is not provided.
  // The architectural issue was about *initializing sample audit logs* in the component,
  // not the act of logging itself, which is a valid component responsibility.
  const { log: internalLogAction } = useAudit();

  // Unified logging function, preferring `onLogAction` prop if provided.
  const logger = useCallback(
    async (
      action: string,
      resource_type: string,
      resource_id: string,
      metadata?: Record<string, any>,
    ) => {
      if (onLogAction) {
        await onLogAction(action, resource_type, resource_id, metadata);
      } else {
        await internalLogAction(action, resource_type, resource_id, metadata);
      }
    },
    [onLogAction, internalLogAction],
  );

  // State for error handling
  const [error, setError] = useState<string | null>(null);

  // useDataGrid hook for managing data grid state (pagination, sorting, filtering)
  const {
    currentPageData,
    pagination,
    loading,
    updateData, // `updateData` is used to feed new data to the grid
    handlePaginationChange,
    handleSortChange,
    handleRowSelection,
  } = useDataGrid<TourSession>({
    initialData: initialTourSessions, // Data now comes from props
    pageSize: pageSize,
  });

  // Effect to update DataGrid's internal data if `initialTourSessions` prop changes
  useEffect(() => {
    // This ensures reactivity if the parent provides new or updated data.
    updateData(initialTourSessions);
  }, [initialTourSessions, updateData]);

  // Define columns for the DataGrid
  // All color values use Tailwind tokens as per Dashtail UI规范.
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
          soliciting: { label: "招團中", color: "bg-orange-100 text-orange-700" },
          guaranteed: { label: "成團", color: "bg-green-100 text-green-700" },
          closed: { label: "已截止", color: "bg-gray-100 text-gray-600" },
          completed: { label: "已完成", color: "bg-blue-100 text-blue-700" },
        };

        const config =
          statusConfig[status as keyof typeof statusConfig] ||
          statusConfig.soliciting; // Fallback to soliciting

        return (
          <span
            className={`px-2 py-1 rounded-full text-sm font-medium ${config.color}`}
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

  // Handle status change (with audit logging and error handling)
  const handleStatusChange = async (
    tourSession: TourSession,
    newStatus: TourSession["status"],
  ) => {
    try {
      const oldStatus = tourSession.status;

      // Update the data (optimistic update to the DataGrid's internal state)
      // Note: In a real-world scenario, this would typically involve an API call
      // and then refetching/re-updating `initialTourSessions` or `updateData`
      // based on the server response.
      const updatedData = initialTourSessions.map((session) =>
        session.id === tourSession.id
          ? { ...session, status: newStatus }
          : session,
      );
      updateData(updatedData); // Update the internal state of useDataGrid

      // Log the status change using the unified logger
      await logger("tour_session_updated", "tour_session", tourSession.id, {
        status_transition: `${oldStatus} → ${newStatus}`,
        group_number: tourSession.group_number,
      });

      setError(null); // Clear any previous errors on successful operation
    } catch (err) {
      console.error("Failed to update tour session status:", err);
      setError("更新狀態失敗，請稍後再試。"); // Set error message for the user
      // Optionally, revert the optimistic update here if the operation failed.
    }
  };

  // State to manage AICopilotPanel visibility
  const [isAICopilotOpen, setAICopilotOpen] = useState(false);

  const toggleAICopilot = () => {
    setAICopilotOpen((prev) => !prev);
  };

  return (
    // Outermost container for the widget, including standard card structure and drag-handle
    <div className="p-6 bg-white rounded-lg shadow-sm drag-handle">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        <p className="text-gray-600 mt-1">{description}</p>
      </div>

      {/* Display error message if present */}
      {error && (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
          role="alert"
        >
          <strong className="font-bold">錯誤!</strong>
          <span className="block sm:inline"> {error}</span>
          <span className="absolute top-0 bottom-0 right-0 px-4 py-3">
            <svg
              className="fill-current h-6 w-6 text-red-500"
              role="button"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              onClick={() => setError(null)}
            >
              <title>Close</title>
              <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z" />
            </svg>
          </span>
        </div>
      )}

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
            placeholder: searchPlaceholder,
            onSearch: (value) => {
              // Implement search logic, filtering the `initialTourSessions` and updating the grid
              console.log("Searching for:", value);
              const filteredData = initialTourSessions.filter(
                (session) =>
                  session.group_number
                    .toLowerCase()
                    .includes(value.toLowerCase()) ||
                  session.series_id.toLowerCase().includes(value.toLowerCase()),
              );
              updateData(filteredData);
            },
          },
          refresh: {
            onRefresh: () => {
              console.log("Refreshing data...");
              // Re-initialize the data grid with the original initial data
              updateData(initialTourSessions);
              setError(null); // Clear any errors on refresh
            },
          },
          export: {
            filename: "tour_sessions",
            onExport: () => {
              console.log("Exporting data...");
              // Implement export logic here, potentially calling an external service.
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
        hoverable
        bordered
      />

      {/* AI Copilot Panel, conditionally rendered */}
      {showAICopilot && (
        <AICopilotPanel isOpen={isAICopilotOpen} onToggle={toggleAICopilot} />
      )}
    </div>
  );
}