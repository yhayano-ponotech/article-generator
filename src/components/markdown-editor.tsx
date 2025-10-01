"use client";

import { useRef, forwardRef, useImperativeHandle } from "react";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  onScroll?: (scrollPercentage: number) => void;
}

export interface MarkdownEditorHandle {
  scrollTo: (percentage: number) => void;
}

export const MarkdownEditor = forwardRef<
  MarkdownEditorHandle,
  MarkdownEditorProps
>(({ value, onChange, disabled, onScroll }, ref) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useImperativeHandle(ref, () => ({
    scrollTo: (percentage: number) => {
      if (textareaRef.current) {
        const maxScroll =
          textareaRef.current.scrollHeight - textareaRef.current.clientHeight;
        textareaRef.current.scrollTop = maxScroll * percentage;
      }
    },
  }));

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (onScroll) {
      const target = e.currentTarget;
      const { scrollTop, scrollHeight, clientHeight } = target;
      const maxScroll = scrollHeight - clientHeight;
      const percentage = maxScroll > 0 ? scrollTop / maxScroll : 0;
      onScroll(percentage);
    }
  };

  return (
    <div className="h-full flex flex-col min-h-0">
      <div className="border-b px-4 py-2 bg-muted/50 flex-shrink-0">
        <h3 className="text-sm font-medium">エディタ</h3>
      </div>
      <div className="flex-1 min-h-0">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onScroll={handleScroll}
          disabled={disabled}
          className="scrollable w-full h-full rounded-none border-0 bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono resize-none"
          placeholder="記事が生成されるとここに表示されます..."
        />
      </div>
    </div>
  );
});

MarkdownEditor.displayName = "MarkdownEditor";
