/** PDF'ten metni tarayıcıda çıkarır; dosya sunucuya gönderilmez. */
export async function pdfToText(file: File): Promise<string> {
  const pdfjs = await import('pdfjs-dist');
  const worker = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
  const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  const pages: string[] = [];
  for (let i = 1; i <= Math.min(doc.numPages, 6); i++) {
    const page = await doc.getPage(i);
    const tc = await page.getTextContent();
    pages.push(tc.items.map((it) => ('str' in it ? it.str : '')).join(' '));
  }
  return pages.join('\n').replace(/[ \t]+/g, ' ').trim();
}

