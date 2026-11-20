import { remark } from 'remark';
import remarkGfm from 'remark-gfm';
import remarkHtml from 'remark-html';

type MdNode = { type: string; depth?: number; children?: MdNode[] };

/** Pushes every heading down `offset` levels (capped at h6). */
const shiftHeadings = (offset: number) => () => (tree: MdNode) => {
  const walk = (node: MdNode) => {
    if (node.type === 'heading' && node.depth) node.depth = Math.min(6, node.depth + offset);
    node.children?.forEach(walk);
  };
  walk(tree);
};

export type MarkdownOptions = {
  /**
   * Demotes headings, so notes that sit under a page's own `<h2>` (journey entries) can use
   * `#` without adding a second `<h1>` to the page.
   */
  headingOffset?: number;
};

/**
 * Renders Markdown to sanitized HTML (GFM on). Sanitization drops raw HTML, including comments,
 * so `<!-- TODO -->` notes can never reach a page. Generic: journey entries reuse it.
 */
export async function renderMarkdown(
  source: string,
  { headingOffset = 0 }: MarkdownOptions = {},
): Promise<string> {
  const file = await remark()
    .use(remarkGfm)
    .use(shiftHeadings(headingOffset))
    .use(remarkHtml, { sanitize: true })
    .process(source);
  // `pre` blocks scroll sideways inside themselves (see `.prose-term pre`), so keyboard users need
  // to be able to focus them. Raw HTML is sanitized away above, so this only touches our own tags.
  return String(file).replace(
    /<pre>/g,
    '<pre tabindex="0" role="region" aria-label="code, scrolls sideways" data-scroll-x>',
  );
}
