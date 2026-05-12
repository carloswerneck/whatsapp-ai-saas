export function chunkText(
  text: string,
  opts: { chunkSize: number; overlap: number } = {
    chunkSize: 500,
    overlap: 100,
  }
): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + opts.chunkSize, text.length);
    let boundary = end;

    if (end < text.length) {
      const lastPeriod = text.lastIndexOf(".", end);
      const lastNewline = text.lastIndexOf("\n", end);
      const lastBoundary = Math.max(lastPeriod, lastNewline);
      if (lastBoundary > start + opts.chunkSize * 0.5) {
        boundary = lastBoundary + 1;
      }
    }

    const chunk = text.slice(start, boundary).trim();
    if (chunk.length > 0) {
      chunks.push(chunk);
    }

    start = boundary > start ? boundary : start + opts.chunkSize;
  }

  return chunks;
}