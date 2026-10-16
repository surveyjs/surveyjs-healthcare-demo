/** The part of SurveyPDF the preview needs. */
export interface PdfDocument {
  raw(type: 'bloburl'): Promise<string>;
  save(fileName: string): Promise<unknown>;
}

/**
 * Shows a generated PDF in the browser's PDF viewer, where it can be printed or saved.
 * `target` is a tab opened synchronously in the click handler (popup blockers reject
 * tabs opened after an await); when the tab was blocked, the PDF is downloaded instead.
 */
export async function openPdfPreview(pdf: PdfDocument, target: Window | null, fileName: string): Promise<void> {
  if (!target) {
    await pdf.save(fileName);
    return;
  }
  try {
    target.location.href = await pdf.raw('bloburl');
  } catch (error) {
    target.close();
    throw error;
  }
}
