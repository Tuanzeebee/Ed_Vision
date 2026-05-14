import apiClient from './apiClient';

// ─── Types ─────────────────────────────────────────────────────────────────

export interface RagDocument {
  id: number;
  title: string;
  source_type: string;
  cert_type: string;
  category: string | null;
  language: string;
  status: 'pending' | 'processing' | 'indexing' | 'ready' | 'error' | 'deleted';
  error_msg: string | null;
  chunk_count: number;
  file_size: number | null;
  created_at: string;
  createdBy: { email: string };
}

export interface RagChunkPreview {
  id: number;
  chunk_index: number;
  content: string;
  token_count: number;
  page_number: number | null;
}

export interface RagStats {
  totalDocs: number;
  totalChunks: number;
  byCertType: Array<{ cert_type: string; _count: { id: number } }>;
  byStatus: Array<{ status: string; _count: { id: number } }>;
}

export interface RagTestQueryResult {
  chunks: Array<{
    content: string;
    score: number;
    documentTitle: string;
    category: string | null;
    certType: string;
    chunkIndex: number;
    pageNumber: number | null;
  }>;
  contextText: string;
  sourceCitations: string[];
  totalDocuments: number;
}

// ─── API Functions ──────────────────────────────────────────────────────────

export async function getRagStats(): Promise<RagStats> {
  const res = await apiClient.get<RagStats>('/admin/rag/stats');
  return res.data;
}

export async function listRagDocuments(
  certType?: string,
  page = 1,
  limit = 20,
): Promise<{ total: number; page: number; limit: number; data: RagDocument[] }> {
  const params: Record<string, string | number> = { page, limit };
  if (certType) params.cert_type = certType;
  const res = await apiClient.get('/admin/rag/documents', { params });
  return res.data;
}

export async function uploadRagDocument(
  file: File,
  certType: string,
  language = 'en',
): Promise<{ documentId: number; title: string; status: string; message: string }> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('cert_type', certType);
  formData.append('language', language);
  const res = await apiClient.post('/admin/rag/documents', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

export async function getRagDocumentChunks(
  documentId: number,
  page = 1,
  limit = 20,
): Promise<{
  document: RagDocument;
  total: number;
  page: number;
  limit: number;
  chunks: RagChunkPreview[];
}> {
  const res = await apiClient.get(`/admin/rag/documents/${documentId}/chunks`, {
    params: { page, limit },
  });
  return res.data;
}

export async function deleteRagDocument(documentId: number): Promise<void> {
  await apiClient.delete(`/admin/rag/documents/${documentId}`);
}

export async function reprocessRagDocument(documentId: number): Promise<void> {
  await apiClient.post(`/admin/rag/documents/${documentId}/reprocess`);
}

export async function testRagQuery(
  question: string,
  certType?: string,
  topK = 5,
): Promise<RagTestQueryResult> {
  const res = await apiClient.post('/admin/rag/test-query', {
    question,
    cert_type: certType,
    top_k: topK,
  });
  return res.data;
}
