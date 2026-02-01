import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Download,
  Upload,
  RefreshCw,
  Search,
  Filter,
  FileJson,
  ArrowRightLeft,
  Trash2,
  Eye,
  ChevronDown,
  X,
  Building2,
  MapPin,
  Calendar,
  Users,
  DollarSign,
  Tag,
  ExternalLink,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";
import { API_ENDPOINTS, api } from "@/lib/api";

// ============ Types ============

interface ImportedOrder {
  id: string;
  external_id: string;
  company: string;
  product_name: string | null;
  group_name: string | null;
  destination: string | null;
  depart_date: string | null;
  return_date: string | null;
  days: number | null;
  nights: number | null;
  pax: number | null;
  total_price: number | null;
  status: "scraped" | "imported" | "converted";
  poi_list: string[] | null;
  itinerary: Record<string, any>[] | null;
  cost_breakdown: Record<string, any> | null;
  inclusions: string[] | null;
  exclusions: string[] | null;
  payment_status: string | null;
  source: string;
  tags: string[] | null;
  converted_order_id: string | null;
  created_at: string;
  updated_at: string;
}

interface ImportStats {
  total: number;
  by_company: Record<string, number>;
  by_status: Record<string, number>;
}

// ============ Status Config ============

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  scraped: { label: "已擷取", color: "bg-amber-100 text-amber-800", icon: Clock },
  imported: { label: "已匯入", color: "bg-blue-100 text-blue-800", icon: Download },
  converted: { label: "已轉單", color: "bg-emerald-100 text-emerald-800", icon: CheckCircle2 },
};

const COMPANY_COLORS: Record<string, string> = {
  "雄獅旅遊": "bg-red-100 text-red-700",
  "山富旅遊": "bg-orange-100 text-orange-700",
  "五福旅遊": "bg-purple-100 text-purple-700",
  "可樂旅遊": "bg-pink-100 text-pink-700",
  "易遊網": "bg-cyan-100 text-cyan-700",
};

// ============ Component ============

const ImportManager: React.FC = () => {
  const [orders, setOrders] = useState<ImportedOrder[]>([]);
  const [stats, setStats] = useState<ImportStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<ImportedOrder | null>(null);
  const [filterCompany, setFilterCompany] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showUpload, setShowUpload] = useState(false);

  // ============ Data Fetching ============

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterCompany) params.set("company", filterCompany);
    if (filterStatus) params.set("status_filter", filterStatus);
    const url = `${API_ENDPOINTS.import.list}?${params.toString()}`;
    const resp = await api.get<ImportedOrder[]>(url);
    if (resp.data) setOrders(resp.data);
    setLoading(false);
  }, [filterCompany, filterStatus]);

  const fetchStats = useCallback(async () => {
    const resp = await api.get<ImportStats>(API_ENDPOINTS.import.stats);
    if (resp.data) setStats(resp.data);
  }, []);

  useEffect(() => {
    fetchOrders();
    fetchStats();
  }, [fetchOrders, fetchStats]);

  // ============ Actions ============

  const handleConvert = async (id: string) => {
    const resp = await api.post(API_ENDPOINTS.import.convert(id), {});
    if (resp.data) {
      fetchOrders();
      fetchStats();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("確定要刪除此筆匯入資料？")) return;
    await api.delete(API_ENDPOINTS.import.delete(id));
    fetchOrders();
    fetchStats();
    if (selectedOrder?.id === id) setSelectedOrder(null);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);

    const token = localStorage.getItem("auth_token");
    const resp = await fetch(API_ENDPOINTS.import.upload, {
      method: "POST",
      headers: { ...(token && { Authorization: `Bearer ${token}` }) },
      body: formData,
    });
    if (resp.ok) {
      setShowUpload(false);
      fetchOrders();
      fetchStats();
    }
    e.target.value = "";
  };

  // ============ Filtering ============

  const filtered = orders.filter((o) => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const match =
        o.product_name?.toLowerCase().includes(term) ||
        o.external_id.toLowerCase().includes(term) ||
        o.destination?.toLowerCase().includes(term) ||
        o.company.toLowerCase().includes(term);
      if (!match) return false;
    }
    return true;
  });

  // ============ Render ============

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">競品資料匯入管理</h1>
            <p className="text-sm text-gray-500 mt-1">Chrome Extension 擷取 / JSON 檔案匯入</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowUpload(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <Upload className="w-4 h-4" />
              上傳 JSON
            </button>
            <button
              onClick={() => { fetchOrders(); fetchStats(); }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              重新整理
            </button>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4">
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-xs text-gray-500">總筆數</div>
            </div>
            {Object.entries(stats.by_status).map(([status, count]) => {
              const cfg = STATUS_CONFIG[status] || { label: status, color: "bg-gray-100 text-gray-700", icon: AlertCircle };
              return (
                <div key={status} className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-gray-900">{count}</div>
                  <div className={`text-xs inline-flex items-center gap-1 px-2 py-0.5 rounded-full mt-1 ${cfg.color}`}>
                    <cfg.icon className="w-3 h-3" /> {cfg.label}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mt-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜尋產品名稱、外部單號、目的地..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
          <select
            value={filterCompany}
            onChange={(e) => setFilterCompany(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
          >
            <option value="">所有來源</option>
            {stats && Object.keys(stats.by_company).map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
          >
            <option value="">所有狀態</option>
            <option value="scraped">已擷取</option>
            <option value="imported">已匯入</option>
            <option value="converted">已轉單</option>
          </select>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* List */}
        <div className={`flex-1 overflow-y-auto p-4 ${selectedOrder ? "hidden md:block md:w-1/2" : ""}`}>
          {loading ? (
            <div className="flex items-center justify-center h-40 text-gray-400">
              <RefreshCw className="w-6 h-6 animate-spin mr-2" /> 載入中...
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <FileJson className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>尚無匯入資料</p>
              <p className="text-sm mt-1">請使用 Chrome Extension 擷取或上傳 JSON 檔案</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((order) => {
                const statusCfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.scraped;
                const companyCls = COMPANY_COLORS[order.company] || "bg-gray-100 text-gray-700";
                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`bg-white border rounded-lg p-4 cursor-pointer hover:border-emerald-300 transition-colors ${
                      selectedOrder?.id === order.id ? "border-emerald-500 ring-1 ring-emerald-500" : "border-gray-200"
                    }`}
                    onClick={() => setSelectedOrder(order)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${companyCls}`}>
                            {order.company}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusCfg.color}`}>
                            {statusCfg.label}
                          </span>
                        </div>
                        <h3 className="font-medium text-gray-900 mt-1 truncate">
                          {order.product_name || order.external_id}
                        </h3>
                        <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                          {order.destination && (
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="w-3 h-3" /> {order.destination}
                            </span>
                          )}
                          {order.depart_date && (
                            <span className="inline-flex items-center gap-1">
                              <Calendar className="w-3 h-3" /> {order.depart_date}
                            </span>
                          )}
                          {order.days && (
                            <span>{order.days}天{order.nights ? `${order.nights}夜` : ""}</span>
                          )}
                        </div>
                      </div>
                      {order.total_price != null && (
                        <div className="text-right ml-4">
                          <div className="text-sm font-semibold text-gray-900">
                            NT$ {order.total_price.toLocaleString()}
                          </div>
                        </div>
                      )}
                    </div>
                    {order.tags && order.tags.length > 0 && (
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {order.tags.map((tag, i) => (
                          <span key={i} className="text-xs px-1.5 py-0.5 bg-violet-50 text-violet-600 rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Detail Panel */}
        <AnimatePresence>
          {selectedOrder && (
            <motion.div
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 300, opacity: 0 }}
              className="w-full md:w-1/2 bg-white border-l overflow-y-auto"
            >
              <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between z-10">
                <h2 className="font-medium text-gray-900">匯入詳情</h2>
                <div className="flex items-center gap-2">
                  {selectedOrder.status !== "converted" && (
                    <button
                      onClick={() => handleConvert(selectedOrder.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white rounded-md text-xs font-medium hover:bg-emerald-700"
                    >
                      <ArrowRightLeft className="w-3 h-3" /> 轉為正式訂單
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(selectedOrder.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="p-1.5 text-gray-400 hover:text-gray-600 rounded md:hidden"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-4 space-y-4">
                {/* Basic Info */}
                <section>
                  <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">基本資訊</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-500">外部單號</span>
                      <p className="font-mono text-gray-900">{selectedOrder.external_id}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">來源公司</span>
                      <p className="font-medium text-gray-900">{selectedOrder.company}</p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-500">產品名稱</span>
                      <p className="font-medium text-gray-900">{selectedOrder.product_name || "—"}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">目的地</span>
                      <p>{selectedOrder.destination || "—"}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">天數</span>
                      <p>{selectedOrder.days ? `${selectedOrder.days}天${selectedOrder.nights || 0}夜` : "—"}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">出發日</span>
                      <p>{selectedOrder.depart_date || "—"}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">總價</span>
                      <p className="font-semibold">
                        {selectedOrder.total_price != null ? `NT$ ${selectedOrder.total_price.toLocaleString()}` : "—"}
                      </p>
                    </div>
                  </div>
                </section>

                {/* POI List */}
                {selectedOrder.poi_list && selectedOrder.poi_list.length > 0 && (
                  <section>
                    <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">行程景點</h3>
                    <div className="flex flex-wrap gap-1">
                      {selectedOrder.poi_list.map((poi, i) => (
                        <span key={i} className="text-xs px-2 py-1 bg-emerald-50 text-emerald-700 rounded-md">
                          {poi}
                        </span>
                      ))}
                    </div>
                  </section>
                )}

                {/* Inclusions / Exclusions */}
                {(selectedOrder.inclusions?.length || selectedOrder.exclusions?.length) ? (
                  <section>
                    <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">包含 / 不含</h3>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="font-medium text-emerald-600 mb-1">包含</p>
                        <ul className="space-y-0.5">
                          {(selectedOrder.inclusions || []).map((item, i) => (
                            <li key={i} className="text-gray-700">+ {item}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="font-medium text-red-500 mb-1">不含</p>
                        <ul className="space-y-0.5">
                          {(selectedOrder.exclusions || []).map((item, i) => (
                            <li key={i} className="text-gray-700">- {item}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </section>
                ) : null}

                {/* Tags */}
                {selectedOrder.tags && selectedOrder.tags.length > 0 && (
                  <section>
                    <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">AI 標籤</h3>
                    <div className="flex flex-wrap gap-1">
                      {selectedOrder.tags.map((tag, i) => (
                        <span key={i} className="text-xs px-2 py-1 bg-violet-50 text-violet-600 rounded-md font-medium">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </section>
                )}

                {/* Metadata */}
                <section className="pt-2 border-t">
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
                    <div>建立時間: {new Date(selectedOrder.created_at).toLocaleString("zh-TW")}</div>
                    <div>更新時間: {new Date(selectedOrder.updated_at).toLocaleString("zh-TW")}</div>
                    <div>來源: {selectedOrder.source}</div>
                    <div>ID: {selectedOrder.id}</div>
                  </div>
                </section>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Upload Modal */}
      <AnimatePresence>
        {showUpload && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
            onClick={() => setShowUpload(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl p-6 w-full max-w-md mx-4 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-2">上傳 JSON 檔案</h3>
              <p className="text-sm text-gray-500 mb-4">
                支援 Chrome Extension 匯出的 JSON 格式，或 {"{"}"items": [...]{"}"} 格式
              </p>
              <label className="block border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-emerald-400 transition-colors">
                <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                <span className="text-sm text-gray-600">點擊選擇檔案或拖放到此</span>
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </label>
              <button
                onClick={() => setShowUpload(false)}
                className="mt-4 w-full py-2 text-sm text-gray-600 hover:text-gray-900"
              >
                取消
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ImportManager;
