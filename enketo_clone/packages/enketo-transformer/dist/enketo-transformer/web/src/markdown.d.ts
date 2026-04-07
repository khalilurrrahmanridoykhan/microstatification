/**
 * @package
 *
 * Transforms XForm label and hint textnode content with a subset of Markdown into HTML
 *
 * Supported:
 * - `_`, `__`, `*`, `**`, `[]()`, `#`, `##`, `###`, `####`, `#####`,
 * - span tags and html-encoded span tags,
 * - single-level unordered markdown lists and single-level ordered markdown lists
 * - newline characters
 *
 * Also HTML encodes any unsupported HTML tags for safe use inside web-based clients
 */
export declare const markdownToHTML: (text: string) => string;
