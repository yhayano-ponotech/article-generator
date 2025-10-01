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
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface ApiKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (apiKey: string) => void;
  currentKey?: string;
}

export function ApiKeyDialog({
  open,
  onOpenChange,
  onSave,
  currentKey,
}: ApiKeyDialogProps) {
  const [apiKey, setApiKey] = useState(currentKey || "");

  const handleSave = () => {
    if (apiKey.trim()) {
      onSave(apiKey.trim());
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gemini API キー設定</DialogTitle>
          <DialogDescription>
            Google AI Studio で取得した API キーを入力してください。
            <br />
            <strong>セキュリティ:</strong> HTTP リファラ制限を必ず設定してください。
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="api-key">API キー</Label>
            <Input
              id="api-key"
              type="password"
              placeholder="AIza..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSave();
                }
              }}
            />
            <p className="text-xs text-muted-foreground">
              キーはブラウザのローカルストレージに保存されます。
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            キャンセル
          </Button>
          <Button onClick={handleSave} disabled={!apiKey.trim()}>
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
