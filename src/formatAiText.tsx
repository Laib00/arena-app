import type { ReactNode } from "react";

/**
 * Render light Markdown emphasis in AI text blocks.
 * **word** → bold, *word* → italic. Leaves the rest as plain text.
 */
export function formatAiText(text: string | null | undefined): ReactNode {
  if (text == null || text === "") return null;

  const nodes: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = re.exec(text)) !== null) {
    if (match.index > last) {
      nodes.push(text.slice(last, match.index));
    }
    const token = match[0];
    if (token.startsWith("**") && token.endsWith("**") && token.length >= 4) {
      nodes.push(<strong key={key++}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith("*") && token.endsWith("*") && token.length >= 2) {
      nodes.push(<em key={key++}>{token.slice(1, -1)}</em>);
    } else {
      nodes.push(token);
    }
    last = match.index + token.length;
  }

  if (last < text.length) nodes.push(text.slice(last));
  return <>{nodes}</>;
}
