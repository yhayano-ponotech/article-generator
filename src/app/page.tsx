"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApiKeyDialog } from "@/components/api-key-dialog";
import { MetaInputForm } from "@/components/meta-input-form";
import { MetaApprovalDialog } from "@/components/meta-approval-dialog";
import {
  MarkdownEditor,
  MarkdownEditorHandle,
} from "@/components/markdown-editor";
import {
  MarkdownPreview,
  MarkdownPreviewHandle,
} from "@/components/markdown-preview";
import { DraftListDialog } from "@/components/draft-list-dialog";
import { ValidationPanel } from "@/components/validation-panel";
import { ThemeToggle } from "@/components/theme-toggle";
import { ArticleMeta, Draft } from "@/types/domain";
import {
  createGeminiClient,
  suggestMeta,
  streamArticle,
  getApiKey,
  setApiKey as saveApiKey,
} from "@/lib/gemini";
import { downloadMarkdown, generateFilename } from "@/lib/export";
import { saveDraft, generateId } from "@/lib/db";
import { useAutoSave } from "@/hooks/use-auto-save";

type AppState = "input" | "meta-review" | "generating" | "editing";

export default function Home() {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);
  const [showDraftList, setShowDraftList] = useState(false);
  const [state, setState] = useState<AppState>("input");
  const [suggestedMeta, setSuggestedMeta] = useState<ArticleMeta | null>(null);
  const [approvedMeta, setApprovedMeta] = useState<ArticleMeta | null>(null);
  const [markdown, setMarkdown] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Refs for scroll synchronization
  const editorRef = useRef<MarkdownEditorHandle>(null);
  const previewRef = useRef<MarkdownPreviewHandle>(null);
  const isScrollingRef = useRef<"editor" | "preview" | null>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load API key from localStorage on mount
  useEffect(() => {
    const key = getApiKey();
    if (key) {
      setApiKey(key);
    } else {
      setShowApiKeyDialog(true);
    }
  }, []);

  // Auto-save draft
  const handleAutoSave = useCallback(
    async (data: { markdown: string; meta: ArticleMeta | null }) => {
      if (!data.meta || !data.markdown) return;

      try {
        const draftId = currentDraftId || generateId();
        const now = new Date();

        const draft: Draft = {
          id: draftId,
          title: data.meta.theme,
          markdown: data.markdown,
          meta: data.meta,
          style: { theme: "light", fontSize: 16, previewWidth: "50%" },
          updatedAt: now,
          createdAt: currentDraftId ? new Date() : now,
        };

        await saveDraft(draft);
        setCurrentDraftId(draftId);
        setLastSaved(now);
      } catch (error) {
        console.error("Auto-save failed:", error);
      }
    },
    [currentDraftId]
  );

  // Use auto-save hook
  useAutoSave(
    { markdown, meta: approvedMeta },
    handleAutoSave,
    2000,
    state === "editing" && !!approvedMeta
  );

  // Handle scroll synchronization
  const handleEditorScroll = useCallback((percentage: number) => {
    if (isScrollingRef.current === "preview") return;

    isScrollingRef.current = "editor";
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    previewRef.current?.scrollTo(percentage);

    scrollTimeoutRef.current = setTimeout(() => {
      isScrollingRef.current = null;
    }, 100);
  }, []);

  const handlePreviewScroll = useCallback((percentage: number) => {
    if (isScrollingRef.current === "editor") return;

    isScrollingRef.current = "preview";
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    editorRef.current?.scrollTo(percentage);

    scrollTimeoutRef.current = setTimeout(() => {
      isScrollingRef.current = null;
    }, 100);
  }, []);

  // Handle API key save
  const handleApiKeySave = (key: string) => {
    saveApiKey(key);
    setApiKey(key);
  };

  // Handle draft restore
  const handleDraftRestore = (draft: Draft) => {
    setMarkdown(draft.markdown);
    setApprovedMeta(draft.meta);
    setCurrentDraftId(draft.id);
    setState("editing");
  };

  // Handle meta suggestion request
  const handleMetaSuggestion = async (input: string) => {
    if (!apiKey) {
      setShowApiKeyDialog(true);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const client = createGeminiClient(apiKey);
      const meta = await suggestMeta(client, input);
      setSuggestedMeta(meta);
      setState("meta-review");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "メタ情報の生成に失敗しました"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Handle meta approval and start article generation
  const handleMetaApproval = async (meta: ArticleMeta) => {
    if (!apiKey) {
      setShowApiKeyDialog(true);
      return;
    }

    setApprovedMeta(meta);
    setState("generating");
    setMarkdown("");
    setError(null);

    try {
      const client = createGeminiClient(apiKey);
      let accumulated = "";

      for await (const chunk of streamArticle(client, meta)) {
        accumulated += chunk;
        setMarkdown(accumulated);
      }

      setState("editing");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "記事の生成に失敗しました"
      );
      setState("editing");
    }
  };

  // Handle markdown export
  const handleExportMarkdown = () => {
    const title = approvedMeta?.theme || "article";
    const filename = generateFilename(title, "md");
    downloadMarkdown(markdown, filename);
  };

  // Reset to initial state
  const handleReset = () => {
    if (confirm("現在の編集内容を破棄しますか？")) {
      setState("input");
      setSuggestedMeta(null);
      setApprovedMeta(null);
      setMarkdown("");
      setError(null);
      setCurrentDraftId(null);
      setLastSaved(null);
    }
  };

  return (
    <div className="h-screen flex flex-col min-h-0">
      {/* Header */}
      <header className="border-b px-6 py-3 flex items-center justify-between bg-background">
        <div>
          <h1 className="text-xl font-bold">記事生成アプリ</h1>
          <p className="text-sm text-muted-foreground">
            Gemini 2.5 Flash による日本語記事生成
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDraftList(true)}
          >
            下書き一覧
          </Button>
          {state !== "input" && (
            <>
              <Button variant="outline" size="sm" onClick={handleReset}>
                リセット
              </Button>
              {markdown && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportMarkdown}
                >
                  .md エクスポート
                </Button>
              )}
            </>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowApiKeyDialog(true)}
          >
            API キー設定
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden min-h-0">
        {state === "input" && (
          <div className="h-full flex items-center justify-center p-8">
            <div className="max-w-2xl w-full space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold">記事を生成しましょう</h2>
                <p className="text-muted-foreground">
                  まず、記事のテーマやキーワードを入力してください。
                  <br />
                  AIがメタ情報を提案します。
                </p>
              </div>
              {error && (
                <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md">
                  {error}
                </div>
              )}
              <MetaInputForm
                onSubmit={handleMetaSuggestion}
                isLoading={isLoading}
              />
            </div>
          </div>
        )}

        {(state === "generating" || state === "editing") && (
          <div className="h-full hidden md:grid md:grid-cols-2 min-h-0">
            {/* Desktop: Split view */}
            <MarkdownEditor
              ref={editorRef}
              value={markdown}
              onChange={setMarkdown}
              disabled={state === "generating"}
              onScroll={handleEditorScroll}
            />
            <div className="border-l h-full min-h-0">
              <MarkdownPreview
                ref={previewRef}
                content={markdown}
                onScroll={handlePreviewScroll}
              />
            </div>
          </div>
        )}

        {(state === "generating" || state === "editing") && (
          <div className="h-full md:hidden min-h-0">
            {/* Mobile: Tabs view */}
            <Tabs defaultValue="preview" className="h-full flex flex-col">
              <TabsList className="w-full rounded-none">
                <TabsTrigger value="editor" className="flex-1">
                  エディタ
                </TabsTrigger>
                <TabsTrigger value="preview" className="flex-1">
                  プレビュー
                </TabsTrigger>
              </TabsList>
              <TabsContent value="editor" className="flex-1 mt-0 min-h-0">
                <MarkdownEditor
                  value={markdown}
                  onChange={setMarkdown}
                  disabled={state === "generating"}
                />
              </TabsContent>
              <TabsContent value="preview" className="flex-1 mt-0 min-h-0">
                <MarkdownPreview content={markdown} />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </main>

      {/* Status Bar and Validation Panel */}
      {(state === "generating" || state === "editing") && (
        <footer>
          {/* Status Bar */}
          <div className="border-t px-6 py-2 bg-muted/50 text-sm flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="text-muted-foreground">
                {state === "generating"
                  ? "生成中..."
                  : `${markdown.length} 文字`}
              </div>
              {lastSaved && state === "editing" && (
                <div className="text-xs text-muted-foreground">
                  保存済み:{" "}
                  {new Intl.DateTimeFormat("ja-JP", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  }).format(lastSaved)}
                </div>
              )}
            </div>
            {approvedMeta && (
              <div className="text-xs text-muted-foreground">
                テーマ: {approvedMeta.theme}
              </div>
            )}
          </div>

          {/* Validation Panel */}
          {state === "editing" && markdown && (
            <ValidationPanel markdown={markdown} />
          )}
        </footer>
      )}

      {/* Dialogs */}
      <ApiKeyDialog
        open={showApiKeyDialog}
        onOpenChange={setShowApiKeyDialog}
        onSave={handleApiKeySave}
        currentKey={apiKey || undefined}
      />
      <DraftListDialog
        open={showDraftList}
        onOpenChange={setShowDraftList}
        onSelect={handleDraftRestore}
      />
      <MetaApprovalDialog
        open={state === "meta-review"}
        onOpenChange={(open) => {
          if (!open) setState("input");
        }}
        meta={suggestedMeta}
        onApprove={handleMetaApproval}
      />
    </div>
  );
}
