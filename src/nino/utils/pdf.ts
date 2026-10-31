/** Extrai o texto de um PDF no próprio celular (nada é enviado antes de você mandar a mensagem). */
export interface ExtractedDoc {
  name: string;
  text: string;
  pages: number;
  truncated: boolean;
}

const MAX_CHARS = 30000;
const MAX_PAGES = 60;

export async function extractDocument(file: File): Promise<ExtractedDoc> {
  const name = file.name || "documento";
  const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(name);
  if (!isPdf) {
    const raw = (await file.text()).replace(/\r\n/g, "\n").trim();
    return { name, text: raw.slice(0, MAX_CHARS), pages: 1, truncated: raw.length > MAX_CHARS };
  }
  // pdf.js só é carregado quando alguém envia um PDF (não pesa na abertura do app). Versão "legacy" = WebViews antigos.
  // @ts-ignore -- tipos do build legacy não são publicados
  const pdfjs: any = await import("pdfjs-dist/legacy/build/pdf.mjs");
  // @ts-ignore -- "?url" é resolvido pelo Vite
  const worker: any = await import("pdfjs-dist/legacy/build/pdf.worker.min.mjs?url");
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
  const data = new Uint8Array(await file.arrayBuffer());
  const doc = await pdfjs.getDocument({ data }).promise;
  const total: number = doc.numPages;
  const last = Math.min(total, MAX_PAGES);
  let out = "";
  for (let i = 1; i <= last && out.length < MAX_CHARS; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    let line = "";
    let text = "";
    for (const item of content.items as Array<{ str?: string; hasEOL?: boolean }>) {
      line += item.str ?? "";
      if (item.hasEOL) {
        text += line + "\n";
        line = "";
      }
    }
    text += line;
    out += text.trim() + "\n\n";
  }
  await doc.destroy();
  out = out.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  return { name, text: out.slice(0, MAX_CHARS), pages: total, truncated: out.length > MAX_CHARS || total > last };
}
