"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface MetaInputFormProps {
  onSubmit: (input: string) => void;
  isLoading?: boolean;
}

export function MetaInputForm({ onSubmit, isLoading }: MetaInputFormProps) {
  const [input, setInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSubmit(input.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="theme-input">
          記事のテーマやキーワードを入力してください
        </Label>
        <Textarea
          id="theme-input"
          placeholder="例: AIエージェントの最新トレンドについて、技術者向けに解説する記事を書きたい"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="min-h-[120px]"
          disabled={isLoading}
        />
      </div>
      <Button type="submit" disabled={!input.trim() || isLoading}>
        {isLoading ? "メタ情報を生成中..." : "メタ情報を生成"}
      </Button>
    </form>
  );
}
