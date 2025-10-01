"use client";

import { useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import mermaid from "mermaid";
// DOMPurify is available for future sanitization enhancements
// import DOMPurify from "dompurify";

interface MarkdownPreviewProps {
  content: string;
  onScroll?: (scrollPercentage: number) => void;
}

export interface MarkdownPreviewHandle {
  scrollTo: (percentage: number) => void;
}

// Initialize mermaid
if (typeof window !== "undefined") {
  mermaid.initialize({
    startOnLoad: false,
    theme: "default",
    securityLevel: "strict",
  });
}

export const MarkdownPreview = forwardRef<
  MarkdownPreviewHandle,
  MarkdownPreviewProps
>(({ content, onScroll }, ref) => {
  const previewRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
    scrollTo: (percentage: number) => {
      if (previewRef.current) {
        const maxScroll =
          previewRef.current.scrollHeight - previewRef.current.clientHeight;
        previewRef.current.scrollTop = maxScroll * percentage;
      }
    },
  }));

  const handleScroll = () => {
    if (previewRef.current && onScroll) {
      const { scrollTop, scrollHeight, clientHeight } = previewRef.current;
      const maxScroll = scrollHeight - clientHeight;
      const percentage = maxScroll > 0 ? scrollTop / maxScroll : 0;
      onScroll(percentage);
    }
  };

  // Render mermaid diagrams after markdown is rendered
  useEffect(() => {
    if (previewRef.current) {
      const mermaidElements = previewRef.current.querySelectorAll(".mermaid");
      mermaidElements.forEach(async (element, index) => {
        try {
          const code = element.textContent || "";
          const id = `mermaid-${Date.now()}-${index}`;
          const { svg } = await mermaid.render(id, code);
          element.innerHTML = svg;
        } catch (error) {
          console.error("Mermaid rendering error:", error);
          element.innerHTML = `<div class="border border-red-300 bg-red-50 dark:bg-red-900/20 rounded p-3 text-sm">
            <div class="font-semibold text-red-700 dark:text-red-400 mb-1">⚠️ Mermaid 図表のレンダリングエラー</div>
            <div class="text-red-600 dark:text-red-300 text-xs font-mono">${error instanceof Error ? error.message : 'Unknown error'}</div>
          </div>`;
        }
      });
    }
  }, [content]);

  return (
    <div className="h-full flex flex-col min-h-0">
      <div className="border-b px-4 py-2 bg-muted/50 flex-shrink-0">
        <h3 className="text-sm font-medium">プレビュー</h3>
      </div>
      <div
        ref={previewRef}
        onScroll={handleScroll}
        className="scrollable flex-1 min-h-0 px-6 py-4 prose prose-slate dark:prose-invert max-w-none"
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[rehypeKatex, rehypeRaw]}
          components={{
            // Mermaid code blocks
            code(props) {
              const { className, children } = props;
              const match = /language-mermaid/.test(className || "");
              if (match) {
                return (
                  <div className="mermaid my-4">
                    {String(children).replace(/\n$/, "")}
                  </div>
                );
              }
              return (
                <code className={className}>
                  {children}
                </code>
              );
            },
          }}
        >
          {content || "*プレビューがここに表示されます...*"}
        </ReactMarkdown>
      </div>
    </div>
  );
});

MarkdownPreview.displayName = "MarkdownPreview";
