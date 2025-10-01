/**
 * Validation utilities for note.com style guidelines
 * Based on docs/design.md section 12
 */

export interface ValidationIssue {
  type: "error" | "warning" | "info";
  message: string;
  line?: number;
}

export interface ValidationResult {
  isValid: boolean;
  issues: ValidationIssue[];
}

/**
 * Validate markdown content against note.com style guidelines
 */
export function validateNoteStyle(markdown: string): ValidationResult {
  const issues: ValidationIssue[] = [];
  const lines = markdown.split("\n");

  // Check heading structure (note.com規約)
  validateHeadings(lines, issues);

  // Check for proper sentence ending (句点)
  validateSentenceEnding(lines, issues);

  // Check table format (LaTeX array)
  validateTables(markdown, issues);

  // Check for diagrams frequency
  validateDiagramFrequency(markdown, issues);

  return {
    isValid: issues.filter((i) => i.type === "error").length === 0,
    issues,
  };
}

/**
 * Validate heading structure
 * - Only one # (title)
 * - ## for major headings
 * - ### for minor headings
 * - No #### or deeper (should use bold + numbers instead)
 */
function validateHeadings(lines: string[], issues: ValidationIssue[]) {
  let h1Count = 0;

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    // Count H1 (title)
    if (trimmed.startsWith("# ") && !trimmed.startsWith("## ")) {
      h1Count++;
      if (h1Count > 1) {
        issues.push({
          type: "error",
          message: "タイトル（#）は1つのみにしてください。",
          line: index + 1,
        });
      }
    }

    // Check for excessive heading depth
    if (trimmed.startsWith("#### ")) {
      issues.push({
        type: "warning",
        message:
          "####以下の見出しは使用せず、太字と番号（例: **(1) 項目名**）を使用してください。",
        line: index + 1,
      });
    }
  });

  if (h1Count === 0) {
    issues.push({
      type: "warning",
      message: "タイトル（#）を追加することを推奨します。",
    });
  }
}

/**
 * Validate sentence ending with 句点 (。)
 */
function validateSentenceEnding(lines: string[], issues: ValidationIssue[]) {
  const sentenceEndPattern = /[。！？]$/;
  const isHeading = /^#+\s/;
  const isListItem = /^[\s-*+]\s/;
  const isCodeBlock = /^```/;
  const isEmptyOrWhitespace = /^\s*$/;

  let inCodeBlock = false;

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    // Track code blocks
    if (isCodeBlock.test(trimmed)) {
      inCodeBlock = !inCodeBlock;
      return;
    }

    // Skip certain lines
    if (
      inCodeBlock ||
      isEmptyOrWhitespace.test(trimmed) ||
      isHeading.test(trimmed) ||
      isListItem.test(trimmed)
    ) {
      return;
    }

    // Check if line looks like a sentence but doesn't end with 句点
    if (trimmed.length > 10 && !sentenceEndPattern.test(trimmed)) {
      issues.push({
        type: "info",
        message: "文末に句点（。）がありません。",
        line: index + 1,
      });
    }
  });
}

/**
 * Validate tables use LaTeX array format
 */
function validateTables(markdown: string, issues: ValidationIssue[]) {
  // Check for markdown tables (should use LaTeX instead)
  const markdownTablePattern = /\|.*\|.*\|/;
  const lines = markdown.split("\n");

  lines.forEach((line, index) => {
    if (markdownTablePattern.test(line)) {
      issues.push({
        type: "warning",
        message:
          "Markdown形式の表が検出されました。LaTeX array形式の使用を推奨します。",
        line: index + 1,
      });
    }
  });

  // Check for LaTeX tables with unescaped underscores
  const latexTablePattern = /\$\$[\s\S]*?\\begin{array}[\s\S]*?\\end{array}[\s\S]*?\$\$/g;
  const tables = markdown.match(latexTablePattern) || [];

  tables.forEach((table) => {
    if (table.includes("_") && !table.includes("\\_")) {
      issues.push({
        type: "error",
        message:
          "LaTeX表内のアンダースコアはエスケープしてください（_ → \\_）。",
      });
    }
  });
}

/**
 * Validate diagram frequency (recommended: 1 per 1000 characters)
 */
function validateDiagramFrequency(markdown: string, issues: ValidationIssue[]) {
  const mermaidBlocks = (markdown.match(/```mermaid/g) || []).length;
  const svgBlocks = (markdown.match(/<svg/g) || []).length;
  const totalDiagrams = mermaidBlocks + svgBlocks;

  const charCount = markdown.length;
  const recommendedDiagrams = Math.floor(charCount / 1000);

  if (charCount > 1000 && totalDiagrams < recommendedDiagrams) {
    issues.push({
      type: "info",
      message: `図解を追加することを推奨します（現在: ${totalDiagrams}、推奨: ${recommendedDiagrams}以上）。`,
    });
  }
}

/**
 * Get validation summary text
 */
export function getValidationSummary(result: ValidationResult): string {
  const errorCount = result.issues.filter((i) => i.type === "error").length;
  const warningCount = result.issues.filter((i) => i.type === "warning").length;
  const infoCount = result.issues.filter((i) => i.type === "info").length;

  if (result.isValid && result.issues.length === 0) {
    return "✓ 問題なし";
  }

  const parts: string[] = [];
  if (errorCount > 0) parts.push(`エラー: ${errorCount}`);
  if (warningCount > 0) parts.push(`警告: ${warningCount}`);
  if (infoCount > 0) parts.push(`情報: ${infoCount}`);

  return parts.join(", ");
}
