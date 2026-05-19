import { useState } from "react";
import { BookOpen, Dumbbell, FileUp } from "lucide-react";
import TeacherLayout from "./components/TeacherLayout";
import { ToeicRepositoryImportBody } from "./ToeicRepositoryImport";
import { ToeicPracticeQuestionImportBody } from "./ToeicPracticeQuestionImport";
import { DiagnosticImportBody } from "./DiagnosticImport";
import { VocabularyImportBody } from "./VocabularyImport";
import { GrammarImportBody } from "./GrammarImport";
import IeltsRepositoryImport from "../../pages/IeltsRepositoryImport";
import { IeltsDiagnosticImportBody } from "./IeltsDiagnosticImport";
import { IeltsPracticeListeningImportBody } from "./IeltsPracticeListeningImport";

type ImportMode = "" | "exam" | "practice" | "diagnostic" | "vocabulary" | "grammar";
type CertType = "" | "toeic" | "ielts";

export default function ExamPracticeImport() {
  const [importMode, setImportMode] = useState<ImportMode>("");
  const [certType, setCertType] = useState<CertType>("");

  return (
    <TeacherLayout currentPage="exam-practice-import">
      <div className="max-w-4xl mx-auto space-y-6 pb-10">
        {/* ── Premium Header ── */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-500 px-8 py-7 shadow-xl">
          <div
            className="pointer-events-none absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                "radial-gradient(circle, white 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
          />
          {/* Decorative glow */}
          <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -left-8 -bottom-8 h-32 w-32 rounded-full bg-fuchsia-400/20 blur-xl" />

          <div className="relative flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm shadow-inner">
              <FileUp className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                Nạp dữ liệu cho sinh viên ôn luyện chứng chỉ
              </h1>
              <p className="mt-1 text-sm text-indigo-100/90">
                Nạp đề thi, câu hỏi ôn luyện, đề khảo sát đầu vào, từ vựng, ngữ pháp — chọn loại
                nạp và loại chứng chỉ bên dưới.
              </p>
            </div>
          </div>
        </div>

        {/* ── Mode selector: 2 comboboxes ── */}
        <div className="rounded-2xl border border-gray-100 bg-white shadow-md">
          <div className="px-6 py-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Combobox 1: Import Mode */}
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
                  {importMode === "exam" ? (
                    <BookOpen className="h-4 w-4 text-indigo-500" />
                  ) : importMode === "practice" ? (
                    <Dumbbell className="h-4 w-4 text-amber-500" />
                  ) : importMode === "diagnostic" ? (
                    <FileUp className="h-4 w-4 text-emerald-500" />
                  ) : importMode === "vocabulary" ? (
                    <BookOpen className="h-4 w-4 text-rose-500" />
                  ) : (
                    <FileUp className="h-4 w-4 text-cyan-500" />
                  )}
                  Chọn loại nạp
                </label>
                <select
                  id="import-mode-select"
                  value={importMode}
                  onChange={(e) => setImportMode(e.target.value as ImportMode)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-900 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 hover:border-gray-300 cursor-pointer appearance-none"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M2 4l4 4 4-4' fill='none' stroke='%236b7280' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 12px center",
                    paddingRight: "36px",
                  }}
                >
                  <option value="" disabled>--- Chọn loại nạp ---</option>
                  <option value="exam">📘 Nạp Đề Thi (Mock Test)</option>
                  <option value="practice">📝 Nạp Câu Hỏi Ôn Luyện</option>
                  <option value="diagnostic">🎯 Nạp Đề Khảo Sát (Diagnostic)</option>
                  <option value="vocabulary">📚 Nạp Từ Vựng</option>
                  <option value="grammar">✍️ Nạp Ngữ Pháp</option>
                </select>
                <p className="mt-1.5 text-xs text-gray-400">
                  {importMode === "exam"
                    ? "Nạp đề thi vào kho đề để học viên thi mô phỏng."
                    : importMode === "practice"
                      ? "Nạp câu hỏi ôn luyện theo Part và band điểm cho học viên luyện tập."
                      : importMode === "diagnostic"
                        ? "Nạp đề khảo sát nhanh dùng để đánh giá đầu vào."
                        : importMode === "vocabulary"
                          ? "Nạp bộ từ vựng theo chủ đề, kèm phiên âm, định nghĩa."
                          : importMode === "grammar"
                            ? "Nạp các chủ điểm ngữ pháp, cấu trúc và ví dụ."
                            : "Chọn loại dữ liệu muốn tải lên hệ thống."}
                </p>
              </div>

              {/* Combobox 2: Cert Type */}
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
                  🎓 Loại chứng chỉ
                </label>
                <select
                  id="cert-type-select"
                  value={certType}
                  onChange={(e) => setCertType(e.target.value as CertType)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-900 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 hover:border-gray-300 cursor-pointer appearance-none"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M2 4l4 4 4-4' fill='none' stroke='%236b7280' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 12px center",
                    paddingRight: "36px",
                  }}
                >
                  <option value="" disabled>--- Chọn loại chứng chỉ ---</option>
                  <option value="toeic">TOEIC</option>
                  <option value="ielts">IELTS</option>
                </select>
                <p className="mt-1.5 text-xs text-gray-400">
                  Chọn loại chứng chỉ phù hợp với bộ đề đang nạp.
                </p>
              </div>
            </div>

            {/* Active mode indicator */}
            {importMode && certType && (
              <div className="mt-4 flex items-center gap-2">
                <div
                  className={`h-2 w-2 rounded-full ${importMode === "exam"
                    ? "bg-indigo-500 animate-pulse"
                    : "bg-amber-500 animate-pulse"
                    }`}
                />
                <p className="text-xs font-medium text-gray-500">
                  Đang chọn:{" "}
                  <span
                    className={`font-bold ${importMode === "exam"
                      ? "text-indigo-600"
                      : importMode === "practice"
                        ? "text-amber-600"
                        : importMode === "diagnostic"
                          ? "text-emerald-600"
                          : importMode === "vocabulary"
                            ? "text-rose-600"
                            : "text-cyan-600"
                      }`}
                  >
                    {importMode === "exam"
                      ? "Nạp Đề Thi"
                      : importMode === "practice"
                        ? "Nạp Câu Hỏi Ôn Luyện"
                        : importMode === "diagnostic"
                          ? "Nạp Đề Khảo Sát"
                          : importMode === "vocabulary"
                            ? "Nạp Từ Vựng"
                            : "Nạp Ngữ Pháp"}
                  </span>
                  {" · "}
                  <span className="font-bold text-gray-700">
                    {certType.toUpperCase()}
                  </span>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Conditional content ── */}
        {importMode && certType && (
          <div
            key={`${importMode}-${certType}`}
            className="animate-[fadeIn_0.3s_ease-out]"
          >
            {certType === "ielts" && importMode === "diagnostic" ? (
              <IeltsDiagnosticImportBody />
            ) : certType === "ielts" && importMode === "practice" ? (
              <IeltsPracticeListeningImportBody />
            ) : certType === "ielts" ? (
              <IeltsRepositoryImport mode={importMode} />
            ) : importMode === "exam" ? (
              <ToeicRepositoryImportBody certType="toeic" />
            ) : importMode === "practice" ? (
              <ToeicPracticeQuestionImportBody certType="toeic" />
            ) : importMode === "diagnostic" ? (
              <DiagnosticImportBody certType="toeic" />
            ) : importMode === "vocabulary" ? (
              <VocabularyImportBody />
            ) : (
              <GrammarImportBody />
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </TeacherLayout>
  );
}
