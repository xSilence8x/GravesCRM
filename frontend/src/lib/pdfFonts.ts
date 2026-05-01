import type { jsPDF } from "jspdf";

const fontToBase64 = async (url: string) => {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Nepodařilo se načíst font: ${url}`);
  }

  const buffer = await response.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary);
};

export const registerPdfFonts = async (doc: jsPDF) => {
  const regular = await fontToBase64("/fonts/OpenSans-Regular.ttf");
  const bold = await fontToBase64("/fonts/OpenSans-Bold.ttf");

  doc.addFileToVFS("OpenSans-Regular.ttf", regular);
  doc.addFont("OpenSans-Regular.ttf", "OpenSans", "normal");

  doc.addFileToVFS("OpenSans-Bold.ttf", bold);
  doc.addFont("OpenSans-Bold.ttf", "OpenSans", "bold");

  doc.setFont("OpenSans", "normal");
};