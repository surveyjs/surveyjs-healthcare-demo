import { describe, it, expect, vi } from 'vitest';
import { openPdfPreview } from '../../src/utils/prescriptionPdf';

function fakePdf({ fail = false } = {}) {
  return {
    raw: vi.fn(async () => {
      if (fail) throw new Error('generation failed');
      return 'blob:x';
    }),
    save: vi.fn(async () => undefined),
  };
}

const fakeTab = () => ({ location: { href: '' }, close: vi.fn() }) as unknown as Window;

describe('openPdfPreview', () => {
  it('navigates the opened tab to the PDF blob url', async () => {
    const pdf = fakePdf();
    const tab = fakeTab();
    await openPdfPreview(pdf, tab, 'a.pdf');
    expect(pdf.raw).toHaveBeenCalledWith('bloburl');
    expect(tab.location.href).toBe('blob:x');
    expect(pdf.save).not.toHaveBeenCalled();
  });

  it('falls back to a download when the tab was blocked', async () => {
    const pdf = fakePdf();
    await openPdfPreview(pdf, null, 'a.pdf');
    expect(pdf.save).toHaveBeenCalledWith('a.pdf');
  });

  it('closes the tab when generation fails', async () => {
    const tab = fakeTab();
    await expect(openPdfPreview(fakePdf({ fail: true }), tab, 'a.pdf')).rejects.toThrow('generation failed');
    expect(tab.close).toHaveBeenCalled();
  });
});
