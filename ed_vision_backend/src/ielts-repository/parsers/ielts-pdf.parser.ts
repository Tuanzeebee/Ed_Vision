/**
 * PDF Parser — wraps pdf-parse to extract raw text from .pdf files.
 */

// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdfParse = require('pdf-parse');

export async function extractTextFromPdf(
  buffer: Buffer,
): Promise<string> {
  const data = await pdfParse(buffer);
  return data.text;
}
