/**
 * PDF Export Utilities for Performance Reports
 * Uses jsPDF and html2canvas to convert React components to PDF
 */

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface PDFExportOptions {
  filename?: string;
  quality?: number;
  format?: 'a4' | 'letter';
  orientation?: 'portrait' | 'landscape';
}

/**
 * Export HTML element to PDF
 * @param elementId - ID of the HTML element to export
 * @param options - PDF export options
 */
export async function exportToPDF(
  elementId: string,
  options: PDFExportOptions = {}
): Promise<void> {
  const {
    filename = 'performans-raporu.pdf',
    quality = 0.95,
    format = 'a4',
    orientation = 'portrait',
  } = options;

  try {
    // Get the element
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Element with ID "${elementId}" not found`);
    }

    // Show loading state
    const loadingEl = document.createElement('div');
    loadingEl.innerHTML = `
      <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                  background: rgba(0,0,0,0.5); display: flex; align-items: center;
                  justify-content: center; z-index: 9999;">
        <div style="background: white; padding: 24px; border-radius: 12px;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.2);">
          <div style="text-align: center;">
            <div style="width: 48px; height: 48px; border: 4px solid #e5e7eb;
                        border-top-color: #6366f1; border-radius: 50%;
                        animation: spin 1s linear infinite; margin: 0 auto 16px;"></div>
            <p style="color: #374151; font-weight: 600; margin: 0;">PDF oluşturuluyor...</p>
            <p style="color: #6b7280; font-size: 14px; margin-top: 8px;">Lütfen bekleyin</p>
          </div>
        </div>
      </div>
      <style>
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      </style>
    `;
    document.body.appendChild(loadingEl);

    // Wait a bit for any animations to complete
    await new Promise(resolve => setTimeout(resolve, 100));

    // Convert to canvas
    const canvas = await html2canvas(element, {
      scale: 2, // Higher quality
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
    });

    // Calculate PDF dimensions
    const imgWidth = format === 'a4' ? 210 : 216; // mm (A4 or Letter)
    const pageHeight = format === 'a4' ? 297 : 279; // mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;

    // Create PDF
    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format,
    });

    let position = 0;

    // Add image to PDF (handle multiple pages if needed)
    const imgData = canvas.toDataURL('image/jpeg', quality);
    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // Add additional pages if content is taller than one page
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // Add metadata
    pdf.setProperties({
      title: filename.replace('.pdf', ''),
      subject: 'Öğrenci Performans Raporu',
      author: 'Başarı Yolu',
      creator: 'Başarı Yolu Platform',
    });

    // Save PDF
    pdf.save(filename);

    // Remove loading
    document.body.removeChild(loadingEl);
  } catch (error) {
    console.error('PDF export error:', error);
    // Remove loading if it exists
    const loadingEl = document.querySelector('[style*="position: fixed"]');
    if (loadingEl) {
      document.body.removeChild(loadingEl);
    }
    throw error;
  }
}

/**
 * Export student performance card to PDF
 */
export async function exportPerformanceCardToPDF(
  studentName: string,
  examDate?: string
): Promise<void> {
  const date = examDate ? new Date(examDate).toLocaleDateString('tr-TR') : new Date().toLocaleDateString('tr-TR');
  const filename = `${studentName.replace(/\s+/g, '_')}_Performans_Raporu_${date.replace(/\./g, '-')}.pdf`;

  await exportToPDF('performance-card-export', {
    filename,
    quality: 0.95,
    format: 'a4',
    orientation: 'portrait',
  });
}

/**
 * Export class performance report to PDF
 */
export async function exportClassPerformanceToPDF(
  className?: string
): Promise<void> {
  const date = new Date().toLocaleDateString('tr-TR');
  const filename = className
    ? `${className}_Sinif_Raporu_${date.replace(/\./g, '-')}.pdf`
    : `Sinif_Performans_Raporu_${date.replace(/\./g, '-')}.pdf`;

  await exportToPDF('class-performance-export', {
    filename,
    quality: 0.95,
    format: 'a4',
    orientation: 'landscape', // Landscape for class reports (wider)
  });
}
