import React, { useState, useEffect, useCallback, useRef } from "react";
import AdminLayout from "../../components/ui/admin/AdminLayout";
import {
  Upload,
  FileText,
  Trash2,
  RefreshCw,
  Search,
  ChevronDown,
  ChevronUp,
  Eye,
  BarChart3,
  BookOpen,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  X,
  Plus,
} from "lucide-react";
import {
  getRagStats,
  listRagDocuments,
  uploadRagDocument,
  deleteRagDocument,
  reprocessRagDocument,
  testRagQuery,
  type RagDocument,
  type RagStats,
  type RagTestQueryResult,
} from "../../services/api/ragService";
import toast from "react-hot-toast";

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: RagDocument["status"] }) {
  const config: Record<
    string,
    { icon: React.ReactNode; label: string; cls: string }
  > = {
    ready: {
      icon: <CheckCircle className="w-3.5 h-3.5" />,
      label: "Sẵn sàng",
      cls: "bg-emerald-100 text-emerald-700",
    },
    processing: {
      icon: <Clock className="w-3.5 h-3.5 animate-spin" />,
      label: "Đang xử lý",
      cls: "bg-blue-100 text-blue-700",
    },
    indexing: {
      icon: <Clock className="w-3.5 h-3.5 animate-spin" />,
      label: "Đang tạo vector",
      cls: "bg-purple-100 text-purple-700",
    },
    pending: {
      icon: <Clock className="w-3.5 h-3.5" />,
      label: "Chờ xử lý",
      cls: "bg-yellow-100 text-yellow-700",
    },
    error: {
      icon: <XCircle className="w-3.5 h-3.5" />,
      label: "Lỗi",
      cls: "bg-red-100 text-red-700",
    },
    deleted: {
      icon: <XCircle className="w-3.5 h-3.5" />,
      label: "Đã xóa",
      cls: "bg-slate-100 text-slate-500",
    },
  };
  const { icon, label, cls } = config[status] ?? config.pending;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}`}
    >
      {icon} {label}
    </span>
  );
}

// ─── Confirm Modal ────────────────────────────────────────────────────────────
function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "Xác nhận",
  confirmCls = "bg-indigo-600 hover:bg-indigo-700 text-white",
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  confirmCls?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div className="relative bg-white rounded-2xl shadow-xl p-6 max-w-md w-full mx-4">
        <h3 className="text-base font-semibold text-slate-800 mb-2">{title}</h3>
        <div className="text-sm text-slate-600 mb-6">{message}</div>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Hủy bỏ
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${confirmCls}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Upload Zone ──────────────────────────────────────────────────────────────
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

type QueuedFile = {
  file: File;
  status: "pending" | "uploading" | "done" | "error";
  error?: string;
};

function UploadZone({ onUploaded }: { onUploaded: () => void }) {
  const [dragging, setDragging] = useState(false);
  const [certType, setCertType] = useState("toeic");
  const [language, setLanguage] = useState("en");
  const [queue, setQueue] = useState<QueuedFile[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    const valid: QueuedFile[] = [];
    Array.from(files).forEach((f) => {
      if (f.size > MAX_FILE_SIZE) {
        toast.error(`"${f.name}" vượt quá 20MB — bỏ qua.`);
      } else {
        valid.push({ file: f, status: "pending" });
      }
    });
    if (valid.length > 0) setQueue((q) => [...q, ...valid]);
  }, []);

  const removeFromQueue = (idx: number) =>
    setQueue((q) => q.filter((_, i) => i !== idx));

  const startUpload = async () => {
    setShowConfirm(false);
    setIsUploading(true);
    let success = 0;
    for (let i = 0; i < queue.length; i++) {
      if (queue[i].status !== "pending") continue;
      setQueue((q) =>
        q.map((item, idx) =>
          idx === i ? { ...item, status: "uploading" } : item,
        ),
      );
      try {
        await uploadRagDocument(queue[i].file, certType, language);
        setQueue((q) =>
          q.map((item, idx) =>
            idx === i ? { ...item, status: "done" } : item,
          ),
        );
        success++;
      } catch (err) {
        setQueue((q) =>
          q.map((item, idx) =>
            idx === i
              ? { ...item, status: "error", error: (err as Error).message }
              : item,
          ),
        );
      }
    }
    setIsUploading(false);
    if (success > 0) {
      toast.success(`Đã nạp ${success} tài liệu, hệ thống đang xử lý.`);
      onUploaded();
      // Xóa các file đã done sau 2s
      setTimeout(
        () => setQueue((q) => q.filter((f) => f.status !== "done")),
        2000,
      );
    }
  };

  const pendingCount = queue.filter((f) => f.status === "pending").length;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <h3 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
        <Upload className="w-4 h-4 text-indigo-500" />
        Nạp tài liệu mới
      </h3>

      {/* Config row */}
      <div className="flex gap-3 mb-4">
        <div className="flex-1">
          <label className="text-xs font-medium text-slate-600 mb-1 block">
            Chứng chỉ
          </label>
          <select
            value={certType}
            onChange={(e) => setCertType(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white text-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="toeic">TOEIC</option>
            <option value="ielts">IELTS</option>
            <option value="general">Chung</option>
          </select>
        </div>
        <div className="flex-1">
          <label className="text-xs font-medium text-slate-600 mb-1 block">
            Ngôn ngữ
          </label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white text-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="en">English</option>
            <option value="vi">Tiếng Việt</option>
            <option value="mixed">Song ngữ</option>
          </select>
        </div>
      </div>

      {/* Drop zone */}
      <div
        className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${
          dragging
            ? "border-indigo-400 bg-indigo-50"
            : "border-slate-300 hover:border-indigo-300 hover:bg-slate-50"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          addFiles(e.dataTransfer.files);
        }}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.docx,.txt,.csv,.xlsx"
          className="hidden"
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <div className="flex flex-col items-center gap-2">
          <div className="w-10 h-10 rounded-2xl bg-indigo-100 flex items-center justify-center">
            <Plus className="w-5 h-5 text-indigo-500" />
          </div>
          <p className="text-sm font-medium text-slate-700">
            Kéo thả hoặc bấm để chọn file
          </p>
          <p className="text-xs text-slate-500">
            PDF, DOCX, TXT, CSV, XLSX • Tối đa 20MB/file
          </p>
        </div>
      </div>

      {/* Queue list */}
      {queue.length > 0 && (
        <div className="mt-4 space-y-2">
          {queue.map((item, idx) => (
            <div
              key={idx}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl border text-sm ${
                item.status === "done"
                  ? "border-emerald-200 bg-emerald-50"
                  : item.status === "error"
                    ? "border-red-200 bg-red-50"
                    : item.status === "uploading"
                      ? "border-indigo-200 bg-indigo-50"
                      : "border-slate-200 bg-slate-50"
              }`}
            >
              {item.status === "uploading" && (
                <RefreshCw className="w-3.5 h-3.5 text-indigo-500 animate-spin shrink-0" />
              )}
              {item.status === "done" && (
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              )}
              {item.status === "error" && (
                <XCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
              )}
              {item.status === "pending" && (
                <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              )}

              <span className="flex-1 truncate text-slate-700">
                {item.file.name}
              </span>
              <span className="text-xs text-slate-400 shrink-0">
                {(item.file.size / 1024).toFixed(0)} KB
              </span>
              {item.status === "error" && (
                <span className="text-xs text-red-500 shrink-0 max-w-[100px] truncate">
                  {item.error}
                </span>
              )}
              {item.status === "pending" && !isUploading && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFromQueue(idx);
                  }}
                  className="p-0.5 rounded text-slate-400 hover:text-red-500 transition-colors shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload button */}
      {pendingCount > 0 && !isUploading && (
        <button
          onClick={() => setShowConfirm(true)}
          className="mt-4 w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
        >
          <Upload className="w-4 h-4" />
          Nạp {pendingCount} tài liệu
        </button>
      )}

      {/* Confirm modal */}
      <ConfirmModal
        open={showConfirm}
        title="Xác nhận nạp tài liệu"
        message={
          <>
            Hệ thống sẽ nạp <strong>{pendingCount} tài liệu</strong> theo thứ tự
            hàng đợi. Quá trình xử lý diễn ra lần lượt và có thể mất vài phút.
          </>
        }
        confirmLabel="Bắt đầu nạp"
        confirmCls="bg-indigo-600 hover:bg-indigo-700 text-white"
        onConfirm={() => void startUpload()}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  );
}

// ─── Test Query Panel ────────────────────────────────────────────────────────
function TestQueryPanel() {
  const [question, setQuestion] = useState("");
  const [certType, setCertType] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RagTestQueryResult | null>(null);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  const handleQuery = async () => {
    if (!question.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await testRagQuery(question, certType || undefined, 5);
      setResult(res);
    } catch {
      toast.error("Lỗi khi truy vấn Knowledge Base");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <h3 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
        <Search className="w-4 h-4 text-violet-500" />
        Kiểm thử RAG Query
      </h3>

      <div className="flex gap-3 mb-3">
        <input
          type="text"
          placeholder="Nhập câu hỏi để tìm kiếm trong knowledge base..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && void handleQuery()}
          className="flex-1 rounded-lg border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
        <select
          value={certType}
          onChange={(e) => setCertType(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white text-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
        >
          <option value="">Tất cả</option>
          <option value="toeic">TOEIC</option>
          <option value="ielts">IELTS</option>
          <option value="general">Chung</option>
        </select>
        <button
          onClick={() => void handleQuery()}
          disabled={loading || !question.trim()}
          className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "Đang tìm..." : "Tìm kiếm"}
        </button>
      </div>

      {result && (
        <div className="mt-4 space-y-3">
          <p className="text-xs text-slate-500">
            Tìm thấy <strong>{result.chunks.length}</strong> chunks liên quan
            (trong {result.totalDocuments} tài liệu ready)
          </p>
          {result.chunks.length === 0 ? (
            <div className="text-center py-6 text-slate-500 text-sm">
              Không tìm thấy chunk nào liên quan đến câu hỏi này.
            </div>
          ) : (
            result.chunks.map((chunk, i) => (
              <div
                key={i}
                className="border border-slate-200 rounded-xl overflow-hidden"
              >
                <button
                  className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors"
                  onClick={() => setExpandedIdx(expandedIdx === i ? null : i)}
                >
                  <div className="flex items-center gap-3 text-left">
                    <span className="text-xs font-bold text-violet-600 bg-violet-100 px-2 py-0.5 rounded-full">
                      {(chunk.score * 100).toFixed(0)}%
                    </span>
                    <span className="text-sm font-medium text-slate-700 truncate max-w-xs">
                      {chunk.documentTitle}
                    </span>
                    {chunk.category && (
                      <span className="text-xs text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">
                        {chunk.category}
                      </span>
                    )}
                  </div>
                  {expandedIdx === i ? (
                    <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                </button>
                {expandedIdx === i && (
                  <div className="px-4 py-3 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed bg-white">
                    {chunk.content}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminRagKnowledgeBase() {
  const [stats, setStats] = useState<RagStats | null>(null);
  const [documents, setDocuments] = useState<RagDocument[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filterCert, setFilterCert] = useState("");
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [expandedDocId, setExpandedDocId] = useState<number | null>(null);

  const LIMIT = 15;

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, docsRes] = await Promise.all([
        getRagStats(),
        listRagDocuments(filterCert || undefined, page, LIMIT),
      ]);
      setStats(statsRes);
      setDocuments(docsRes.data);
      setTotal(docsRes.total);
    } catch {
      toast.error("Không tải được dữ liệu");
    } finally {
      setLoading(false);
    }
  }, [filterCert, page]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Poll khi có document đang xử lý (processing / pending / indexing)
  useEffect(() => {
    const hasActive = documents.some(
      (d) =>
        d.status === "processing" ||
        d.status === "pending" ||
        d.status === "indexing",
    );
    if (!hasActive) return;
    const timer = setInterval(() => void loadData(), 3000);
    return () => clearInterval(timer);
  }, [documents, loadData]);

  const [deleteTarget, setDeleteTarget] = useState<RagDocument | null>(null);

  const handleDelete = async (doc: RagDocument) => {
    setDeleteTarget(doc);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeletingId(deleteTarget.id);
    setDeleteTarget(null);
    try {
      await deleteRagDocument(deleteTarget.id);
      toast.success("Đã xóa tài liệu.");
      void loadData();
    } catch {
      toast.error("Lỗi khi xóa tài liệu.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleReprocess = async (doc: RagDocument) => {
    try {
      await reprocessRagDocument(doc.id);
      toast.success("Đang xử lý lại tài liệu...");
      void loadData();
    } catch {
      toast.error("Lỗi khi yêu cầu xử lý lại.");
    }
  };

  const formatSize = (bytes: number | null) => {
    if (!bytes) return "–";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-7 h-7 text-indigo-600" />
              Knowledge Base — RAG System
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Quản lý tài liệu học thuật cho AI Tutor và Chatbot
            </p>
          </div>
          <button
            onClick={() => void loadData()}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Làm mới
          </button>
        </div>

        {/* Stats cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                label: "Tổng tài liệu",
                value: stats.totalDocs,
                icon: <FileText className="w-5 h-5" />,
                color: "text-indigo-600 bg-indigo-100",
                cardBg: "bg-indigo-50/60 border-indigo-100",
              },
              {
                label: "Tổng chunks",
                value: stats.totalChunks.toLocaleString(),
                icon: <BarChart3 className="w-5 h-5" />,
                color: "text-violet-600 bg-violet-100",
                cardBg: "bg-violet-50/60 border-violet-100",
              },
              {
                label: "Tài liệu TOEIC",
                value:
                  stats.byCertType.find((b) => b.cert_type === "toeic")?._count
                    .id ?? 0,
                icon: <BookOpen className="w-5 h-5" />,
                color: "text-teal-600 bg-teal-100",
                cardBg: "bg-teal-50/60 border-teal-100",
              },
              {
                label: "Tài liệu IELTS",
                value:
                  stats.byCertType.find((b) => b.cert_type === "ielts")?._count
                    .id ?? 0,
                icon: <BookOpen className="w-5 h-5" />,
                color: "text-emerald-600 bg-emerald-100",
                cardBg: "bg-emerald-50/60 border-emerald-100",
              },
            ].map((card) => (
              <div
                key={card.label}
                className={`rounded-2xl border p-4 shadow-sm flex items-center gap-4 ${card.cardBg}`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.color}`}
                >
                  {card.icon}
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">
                    {card.value}
                  </p>
                  <p className="text-xs text-slate-500">{card.label}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Upload + Test panels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <UploadZone
            onUploaded={() => {
              setPage(1);
              void loadData();
            }}
          />
          <TestQueryPanel />
        </div>

        {/* Documents table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h3 className="text-base font-semibold text-slate-800">
              Danh sách tài liệu
              <span className="ml-2 text-xs font-normal text-slate-500">
                ({total} tài liệu)
              </span>
            </h3>
            <select
              value={filterCert}
              onChange={(e) => {
                setFilterCert(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-slate-200 bg-white text-slate-800 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Tất cả loại</option>
              <option value="toeic">TOEIC</option>
              <option value="ielts">IELTS</option>
              <option value="general">Chung</option>
            </select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-20 text-slate-500">
              <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="font-medium">Chưa có tài liệu nào</p>
              <p className="text-sm mt-1">
                Hãy nạp tài liệu PDF, DOCX... để bắt đầu.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {documents.map((doc) => (
                <div key={doc.id} className="px-6 py-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4 text-indigo-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">
                          {doc.title}
                        </p>
                        <p className="text-xs text-slate-500">
                          {doc.source_type.toUpperCase()} •{" "}
                          {doc.cert_type.toUpperCase()} • {doc.category ?? "–"}{" "}
                          • {formatSize(doc.file_size)} •{" "}
                          {doc.chunk_count > 0
                            ? `${doc.chunk_count} chunks`
                            : "–"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <StatusBadge status={doc.status} />

                      <button
                        onClick={() =>
                          setExpandedDocId(
                            expandedDocId === doc.id ? null : doc.id,
                          )
                        }
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                        title="Xem chunks"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {doc.status === "error" && (
                        <button
                          onClick={() => void handleReprocess(doc)}
                          className="p-1.5 rounded-lg text-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Xử lý lại"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        onClick={() => void handleDelete(doc)}
                        disabled={deletingId === doc.id}
                        className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
                        title="Xóa"
                      >
                        {deletingId === doc.id ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Error message */}
                  {doc.status === "error" && doc.error_msg && (
                    <div className="mt-2 ml-11 flex items-start gap-2 text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">
                      <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      <span>{doc.error_msg}</span>
                    </div>
                  )}

                  {/* Expanded chunk preview */}
                  {expandedDocId === doc.id && (
                    <ChunkPreviewPanel
                      documentId={doc.id}
                      onClose={() => setExpandedDocId(null)}
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 px-6 py-4 border-t border-slate-100">
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1.5 rounded-lg text-sm text-slate-600 hover:bg-slate-100 disabled:opacity-40"
              >
                ‹ Trước
              </button>
              <span className="text-sm text-slate-600">
                {page} / {totalPages}
              </span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1.5 rounded-lg text-sm text-slate-600 hover:bg-slate-100 disabled:opacity-40"
              >
                Sau ›
              </button>
            </div>
          )}
        </div>
      </div>
      {/* Delete confirm modal */}
      <ConfirmModal
        open={!!deleteTarget}
        title="Xóa tài liệu"
        message={
          <>
            Xóa tài liệu <strong>&ldquo;{deleteTarget?.title}&rdquo;</strong>?
            <br />
            Toàn bộ {deleteTarget?.chunk_count ?? 0} chunks và vector sẽ bị xóa
            vĩnh viễn.
          </>
        }
        confirmLabel="Xóa"
        confirmCls="bg-red-600 hover:bg-red-700 text-white"
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleteTarget(null)}
      />
    </AdminLayout>
  );
}

// ─── Chunk Preview Panel ──────────────────────────────────────────────────────
function ChunkPreviewPanel({
  documentId,
  onClose,
}: {
  documentId: number;
  onClose: () => void;
}) {
  const [data, setData] = useState<{
    chunks: {
      id: number;
      chunk_index: number;
      content: string;
      token_count: number;
      page_number: number | null;
    }[];
    total: number;
  } | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    import("../../services/api/ragService")
      .then((m) => m.getRagDocumentChunks(documentId, page, 10))
      .then(setData)
      .catch(() => toast.error("Không tải được chunks"));
  }, [documentId, page]);

  return (
    <div className="mt-3 ml-11 bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200 bg-slate-100">
        <p className="text-xs font-semibold text-slate-700">
          Preview chunks {data ? `(${data.total} tổng cộng)` : ""}
        </p>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-700"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="divide-y divide-slate-200 max-h-80 overflow-y-auto">
        {!data ? (
          <div className="py-6 text-center text-sm text-slate-500">
            Đang tải...
          </div>
        ) : (
          data.chunks.map((chunk) => (
            <div key={chunk.id} className="px-4 py-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono text-slate-400">
                  #{chunk.chunk_index}
                </span>
                <span className="text-xs text-slate-400">
                  {chunk.token_count} tokens
                </span>
                {chunk.page_number && (
                  <span className="text-xs text-slate-400">
                    tr.{chunk.page_number}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-700 line-clamp-3 leading-relaxed">
                {chunk.content}
              </p>
            </div>
          ))
        )}
      </div>
      {data && data.total > 10 && (
        <div className="flex justify-center gap-2 py-2 border-t border-slate-200">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="text-xs px-3 py-1 rounded-lg hover:bg-slate-200 disabled:opacity-40"
          >
            ‹
          </button>
          <span className="text-xs text-slate-500 py-1">
            {page} / {Math.ceil(data.total / 10)}
          </span>
          <button
            disabled={page >= Math.ceil(data.total / 10)}
            onClick={() => setPage(page + 1)}
            className="text-xs px-3 py-1 rounded-lg hover:bg-slate-200 disabled:opacity-40"
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
}
