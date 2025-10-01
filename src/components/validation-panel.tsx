"use client";

import { useMemo, useState } from "react";
import { validateNoteStyle, getValidationSummary } from "@/lib/validation";
import { Button } from "@/components/ui/button";

interface ValidationPanelProps {
  markdown: string;
}

export function ValidationPanel({ markdown }: ValidationPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const result = useMemo(() => {
    if (!markdown) return null;
    return validateNoteStyle(markdown);
  }, [markdown]);

  if (!result) return null;

  const summary = getValidationSummary(result);
  const hasIssues = result.issues.length > 0;

  return (
    <div className="w-full border-t bg-muted/30">
      <div className="px-6 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-7 px-2"
          >
            <span className="mr-2">{isExpanded ? "▼" : "▶"}</span>
            バリデーション
          </Button>
          <div
            className={`text-sm ${
              hasIssues
                ? "text-yellow-600 dark:text-yellow-400"
                : "text-green-600 dark:text-green-400"
            }`}
          >
            {summary}
          </div>
        </div>
      </div>

      {isExpanded && hasIssues && (
        <div className="px-6 pb-3 max-h-60 overflow-y-auto">
          <div className="space-y-1">
            {result.issues.map((issue, index) => (
              <div
                key={index}
                className={`text-xs p-2 rounded ${
                  issue.type === "error"
                    ? "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                    : issue.type === "warning"
                    ? "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400"
                    : "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                }`}
              >
                {issue.line && <span className="font-mono mr-2">L{issue.line}:</span>}
                {issue.message}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
