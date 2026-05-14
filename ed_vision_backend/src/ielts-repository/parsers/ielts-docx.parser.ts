/**
 * DOCX Parser — wraps mammoth to extract raw text from .docx files.
 */
import * as mammoth from 'mammoth';

export async function extractTextFromDocx(
  buffer: Buffer,
): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}
