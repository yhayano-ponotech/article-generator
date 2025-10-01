/**
 * Export utilities for Markdown and PDF
 */

/**
 * Download markdown content as .md file
 */
export function downloadMarkdown(content: string, filename: string = "article.md"): void {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate filename from title
 */
export function generateFilename(title: string, extension: string): string {
  const sanitized = title
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .toLowerCase();
  const timestamp = new Date().toISOString().split("T")[0];
  return `${sanitized}-${timestamp}.${extension}`;
}
