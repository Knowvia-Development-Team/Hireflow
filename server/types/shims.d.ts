declare module 'pdf-parse' {
  interface PdfParseResult {
    text: string;
  }
  function pdfParse(data: Buffer): Promise<PdfParseResult>;
  export default pdfParse;
}

declare module 'mammoth' {
  interface MammothResult {
    value: string;
  }
  function extractRawText(input: { path: string }): Promise<MammothResult>;
  export { extractRawText };
  const mammoth: { extractRawText: typeof extractRawText };
  export default mammoth;
}
