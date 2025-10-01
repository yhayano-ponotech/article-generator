/**
 * Domain types for the article generator application
 * Based on the design document in docs/design.md
 */

// Meta information for article generation
export interface ArticleMeta {
  theme: string; // テーマ/タイトル
  targetAudience: string; // 対象読者（年齢層、興味、知識レベル）
  purpose: string; // 記事の目的（情報提供/教育/エンタメ等）
  tone: string; // 希望トーン（カジュアル/フォーマル/会話調等）
  length: string; // 記事の長さ（希望文字数）
  specialInstructions: string; // 特別な指示（用語の扱い/避ける表現等）
}

// Style settings for rendering
export interface StyleSettings {
  theme: "light" | "dark";
  fontSize: number;
  previewWidth: string;
}

// Draft entity (stored in IndexedDB)
export interface Draft {
  id: string;
  title: string;
  markdown: string;
  meta: ArticleMeta;
  style: StyleSettings;
  updatedAt: Date;
  createdAt: Date;
}

// Session status
export type SessionStatus = "idle" | "running" | "paused" | "completed" | "error";

// Generation session (tracks AI generation process)
export interface Session {
  id: string;
  draftId: string;
  status: SessionStatus;
  prompt: string; // 実際に送信したプロンプト全文
  tokens: string[]; // 受信済みトークン/チャンク
  startedAt: Date;
  endedAt?: Date;
  error?: string;
}

// Reference/citation
export interface Reference {
  id: string;
  draftId: string;
  label: string;
  url: string;
  note?: string;
}

// Export type
export type ExportType = "pdf" | "md";

// Export status
export type ExportStatus = "queued" | "working" | "done" | "error";

// Export job
export interface ExportJob {
  id: string;
  draftId: string;
  type: ExportType;
  url?: string; // 完成ファイル保存先（Blob URL等）
  status: ExportStatus;
  createdAt: Date;
  error?: string;
}

// Gemini API configuration
export interface GeminiConfig {
  apiKey: string;
  model: string; // gemini-2.5-flash-preview-09-2025
  temperature?: number;
  maxOutputTokens?: number;
}

// Streaming state
export interface StreamingState {
  isStreaming: boolean;
  tokensReceived: number;
  speed: number; // tokens per second
  estimatedRemaining?: number;
}
