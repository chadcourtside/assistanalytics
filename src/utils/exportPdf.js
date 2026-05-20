import html2pdf from 'html2pdf.js';

export function exportPDF(elementId, filename, landscape = false) {
  const element = document.getElementById(elementId);
  const opt = {
    margin: 0.3,
    filename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: {
      unit: 'in',
      format: 'letter',
      orientation: landscape ? 'landscape' : 'portrait',
    },
  };
  html2pdf().set(opt).from(element).save();
}
