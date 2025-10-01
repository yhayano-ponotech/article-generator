"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArticleMeta } from "@/types/domain";

interface MetaApprovalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meta: ArticleMeta | null;
  onApprove: (meta: ArticleMeta) => void;
}

export function MetaApprovalDialog({
  open,
  onOpenChange,
  meta,
  onApprove,
}: MetaApprovalDialogProps) {
  const [editedMeta, setEditedMeta] = useState<ArticleMeta | null>(meta);

  // Update editedMeta when meta prop changes
  if (meta && (!editedMeta || editedMeta !== meta)) {
    setEditedMeta(meta);
  }

  const handleApprove = () => {
    if (editedMeta) {
      onApprove(editedMeta);
      onOpenChange(false);
    }
  };

  if (!editedMeta) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>メタ情報の確認・編集</DialogTitle>
          <DialogDescription>
            生成された記事のメタ情報を確認し、必要に応じて編集してください。
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="theme">テーマ/タイトル</Label>
            <Input
              id="theme"
              value={editedMeta.theme}
              onChange={(e) =>
                setEditedMeta({ ...editedMeta, theme: e.target.value })
              }
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="targetAudience">対象読者</Label>
            <Textarea
              id="targetAudience"
              value={editedMeta.targetAudience}
              onChange={(e) =>
                setEditedMeta({ ...editedMeta, targetAudience: e.target.value })
              }
              className="min-h-[60px]"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="purpose">記事の目的</Label>
            <Input
              id="purpose"
              value={editedMeta.purpose}
              onChange={(e) =>
                setEditedMeta({ ...editedMeta, purpose: e.target.value })
              }
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="tone">トーン</Label>
            <Input
              id="tone"
              value={editedMeta.tone}
              onChange={(e) =>
                setEditedMeta({ ...editedMeta, tone: e.target.value })
              }
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="length">記事の長さ</Label>
            <Input
              id="length"
              value={editedMeta.length}
              onChange={(e) =>
                setEditedMeta({ ...editedMeta, length: e.target.value })
              }
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="specialInstructions">特別な指示</Label>
            <Textarea
              id="specialInstructions"
              value={editedMeta.specialInstructions}
              onChange={(e) =>
                setEditedMeta({
                  ...editedMeta,
                  specialInstructions: e.target.value,
                })
              }
              className="min-h-[80px]"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            キャンセル
          </Button>
          <Button onClick={handleApprove}>承認して記事生成</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
