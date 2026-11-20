import { remark } from 'remark';
import remarkGfm from 'remark-gfm';
import remarkHtml from 'remark-html';

/**
 * Renders Markdown to sanitized HTML (GFM on). Sanitization drops raw HTML, including comments,
 * so `<!-- TODO -->` notes can never reach a page. Generic: journey entries reuse it.
 */
export async function renderMarkdown(source: string): Promise<string> {
  const file = await remark().use(remarkGfm).use(remarkHtml, { sanitize: true }).process(source);
  return String(file);
}
