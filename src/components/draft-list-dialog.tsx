"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Draft } from "@/types/domain";
import { getAllDrafts, deleteDraft } from "@/lib/db";

interface DraftListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (draft: Draft) => void;
}

export function DraftListDialog({
  open,
  onOpenChange,
  onSelect,
}: DraftListDialogProps) {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadDrafts();
    }
  }, [open]);

  const loadDrafts = async () => {
    setIsLoading(true);
    try {
      const allDrafts = await getAllDrafts();
      // Sort by updated date descending
      setDrafts(allDrafts.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()));
    } catch (error) {
      console.error("Failed to load drafts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("この下書きを削除しますか？")) {
      try {
        await deleteDraft(id);
        await loadDrafts();
      } catch (error) {
        console.error("Failed to delete draft:", error);
      }
    }
  };

  const handleSelect = (draft: Draft) => {
    onSelect(draft);
    onOpenChange(false);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>下書き一覧</DialogTitle>
          <DialogDescription>
            保存された下書きから復元できます。
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-y-auto max-h-[60vh]">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              読み込み中...
            </div>
          ) : drafts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              保存された下書きはありません。
            </div>
          ) : (
            <div className="space-y-2">
              {drafts.map((draft) => (
                <div
                  key={draft.id}
                  className="border rounded-lg p-4 hover:bg-accent cursor-pointer transition-colors"
                  onClick={() => handleSelect(draft)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{draft.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {draft.markdown.slice(0, 100)}
                        {draft.markdown.length > 100 && "..."}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        最終更新: {formatDate(draft.updatedAt)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        文字数: {draft.markdown.length}
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={(e) => handleDelete(draft.id, e)}
                    >
                      削除
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
