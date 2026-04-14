import path from 'node:path';
import { readFile } from 'node:fs/promises';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

export interface CvTextResult {
  text: string;
  warnings: string[];
}

function normalizeText(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

export async function extractCvText(filePath: string, originalName: string): Promise<CvTextResult> {
  const ext = path.extname(originalName).toLowerCase();
  const warnings: string[] = [];

  try {
    if (ext === '.pdf') {
      const buffer = await readFile(filePath);
      const parsed = await pdfParse(buffer);
      return { text: normalizeText(parsed.text || ''), warnings };
    }

    if (ext === '.docx') {
      const result = await mammoth.extractRawText({ path: filePath });
      return { text: normalizeText(result.value || ''), warnings };
    }

    if (ext === '.doc') {
      warnings.push('Legacy .doc format is not fully supported. Please upload PDF or DOCX for best results.');
      return { text: '', warnings };
    }

    warnings.push('Unsupported file format for text extraction.');
    return { text: '', warnings };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    warnings.push(`Failed to extract text: ${msg}`);
    return { text: '', warnings };
  }
}
