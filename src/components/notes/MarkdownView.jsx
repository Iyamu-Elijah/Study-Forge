import ReactMarkdown from 'react-markdown';

const COMPONENTS = {
  h1: ({ children }) => <h2 className="mt-4 font-heading text-lg font-semibold">{children}</h2>,
  h2: ({ children }) => <h3 className="mt-4 font-heading text-base font-semibold">{children}</h3>,
  h3: ({ children }) => <h4 className="mt-3 font-heading text-sm font-semibold">{children}</h4>,
  p: ({ children }) => <p className="text-sm leading-relaxed">{children}</p>,
  ul: ({ children }) => <ul className="ml-5 list-disc space-y-1 text-sm">{children}</ul>,
  ol: ({ children }) => <ol className="ml-5 list-decimal space-y-1 text-sm">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noreferrer" className="text-primary underline">
      {children}
    </a>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-primary/40 pl-3 text-sm italic text-muted-foreground">
      {children}
    </blockquote>
  ),
  pre: ({ children }) => (
    <pre className="overflow-x-auto rounded-lg bg-muted p-3 text-xs">{children}</pre>
  ),
  code: ({ children }) => (
    <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">{children}</code>
  ),
  hr: () => <hr className="border-border" />,
};

export default function MarkdownView({ content }) {
  if (!content?.trim()) {
    return <p className="text-sm italic text-muted-foreground">Nothing written yet.</p>;
  }

  return (
    <div className="space-y-2">
      <ReactMarkdown components={COMPONENTS}>{content}</ReactMarkdown>
    </div>
  );
}