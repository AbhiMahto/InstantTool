import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

// Use local worker from pdfjs-dist package
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export const generateId = () => Math.random().toString(36).substring(2, 15);

export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const readFileAsArrayBuffer = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
};

export const getPdfPageCount = async (file) => {
  const arrayBuffer = await readFileAsArrayBuffer(file);
  const pdf = await PDFDocument.load(arrayBuffer);
  return pdf.getPageCount();
};

export const getPdfInfo = async (file) => {
  const pageCount = await getPdfPageCount(file);
  return {
    file,
    name: file.name,
    pageCount,
    size: file.size,
    id: generateId(),
  };
};

// Generate page previews for all pages
export const getPageThumbnails = async (file, scale = 1.0) => {
  const arrayBuffer = await readFileAsArrayBuffer(file);
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const previews = [];
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    
    await page.render({ canvasContext: context, viewport }).promise;
    previews.push(canvas.toDataURL('image/png'));
  }
  
  return previews;
};

export const mergePdfs = async (files, onProgress) => {
  const mergedPdf = await PDFDocument.create();
  for (let i = 0; i < files.length; i++) {
    onProgress?.({ current: i + 1, total: files.length, message: `Processing ${files[i].name}...` });
    const arrayBuffer = await readFileAsArrayBuffer(files[i]);
    const pdf = await PDFDocument.load(arrayBuffer);
    const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    pages.forEach(page => mergedPdf.addPage(page));
  }
  return mergedPdf.save();
};

export const splitPdf = async (file, ranges, onProgress) => {
  const arrayBuffer = await readFileAsArrayBuffer(file);
  const sourcePdf = await PDFDocument.load(arrayBuffer);
  const results = [];
  
  for (let i = 0; i < ranges.length; i++) {
    const range = ranges[i];
    onProgress?.({ current: i + 1, total: ranges.length, message: `Creating split ${i + 1}...` });
    const newPdf = await PDFDocument.create();
    const pageIndices = [];
    for (let p = range.start - 1; p < range.end; p++) {
      if (p >= 0 && p < sourcePdf.getPageCount()) pageIndices.push(p);
    }
    const pages = await newPdf.copyPages(sourcePdf, pageIndices);
    pages.forEach(page => newPdf.addPage(page));
    const baseName = file.name.replace('.pdf', '');
    results.push({ name: `${baseName}_pages_${range.start}-${range.end}.pdf`, data: await newPdf.save() });
  }
  return results;
};

export const splitPdfToPages = async (file, onProgress) => {
  const arrayBuffer = await readFileAsArrayBuffer(file);
  const sourcePdf = await PDFDocument.load(arrayBuffer);
  const pageCount = sourcePdf.getPageCount();
  const results = [];
  
  for (let i = 0; i < pageCount; i++) {
    onProgress?.({ current: i + 1, total: pageCount, message: `Extracting page ${i + 1}...` });
    const newPdf = await PDFDocument.create();
    const [page] = await newPdf.copyPages(sourcePdf, [i]);
    newPdf.addPage(page);
    const baseName = file.name.replace('.pdf', '');
    results.push({ name: `${baseName}_page_${i + 1}.pdf`, data: await newPdf.save() });
  }
  return results;
};

export const pdfToImages = async (file, format = 'png', quality = 1.5, onProgress) => {
  const arrayBuffer = await readFileAsArrayBuffer(file);
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const numPages = pdf.numPages;
  const results = [];
  
  for (let i = 1; i <= numPages; i++) {
    onProgress?.({ current: i, total: numPages, message: `Converting page ${i}...` });
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: quality });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    await page.render({ canvasContext: context, viewport }).promise;
    const blob = await new Promise((resolve) => {
      canvas.toBlob((b) => resolve(b), `image/${format}`, format === 'jpeg' ? 0.92 : undefined);
    });
    const baseName = file.name.replace('.pdf', '');
    results.push({ name: `${baseName}_page_${i}.${format}`, data: blob });
  }
  return results;
};

export const imagesToPdf = async (files, onProgress) => {
  const pdfDoc = await PDFDocument.create();
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    onProgress?.({ current: i + 1, total: files.length, message: `Adding ${file.name}...` });
    const arrayBuffer = await readFileAsArrayBuffer(file);
    let image;
    if (file.type === 'image/png') {
      image = await pdfDoc.embedPng(arrayBuffer);
    } else if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
      image = await pdfDoc.embedJpg(arrayBuffer);
    } else {
      const img = await createImageBitmap(file);
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const pngData = await new Promise((resolve) => {
        canvas.toBlob((blob) => blob.arrayBuffer().then(resolve), 'image/png');
      });
      image = await pdfDoc.embedPng(pngData);
    }
    const page = pdfDoc.addPage([image.width, image.height]);
    page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
  }
  return pdfDoc.save();
};

export const rotatePdf = async (file, rotations, onProgress) => {
  const arrayBuffer = await readFileAsArrayBuffer(file);
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  onProgress?.({ current: 1, total: 1, message: 'Applying rotations...' });
  rotations.forEach(({ pageIndex, degrees: deg }) => {
    const page = pdfDoc.getPage(pageIndex);
    const currentRotation = page.getRotation().angle;
    page.setRotation(degrees(currentRotation + deg));
  });
  return pdfDoc.save();
};

export const removePages = async (file, pagesToRemove, onProgress) => {
  const arrayBuffer = await readFileAsArrayBuffer(file);
  const sourcePdf = await PDFDocument.load(arrayBuffer);
  const newPdf = await PDFDocument.create();
  const pageCount = sourcePdf.getPageCount();
  const pagesToKeep = [];
  for (let i = 0; i < pageCount; i++) {
    if (!pagesToRemove.includes(i + 1)) pagesToKeep.push(i);
  }
  onProgress?.({ current: 1, total: 1, message: 'Removing pages...' });
  const pages = await newPdf.copyPages(sourcePdf, pagesToKeep);
  pages.forEach(page => newPdf.addPage(page));
  return newPdf.save();
};

export const addWatermark = async (file, watermarkText, options = {}, onProgress) => {
  const { fontSize = 50, opacity = 0.3, rotation = -45, color = { r: 0.5, g: 0.5, b: 0.5 } } = options;
  const arrayBuffer = await readFileAsArrayBuffer(file);
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  const pages = pdfDoc.getPages();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  
  for (let i = 0; i < pages.length; i++) {
    onProgress?.({ current: i + 1, total: pages.length, message: `Adding watermark to page ${i + 1}...` });
    const page = pages[i];
    const { width, height } = page.getSize();
    const textWidth = font.widthOfTextAtSize(watermarkText, fontSize);
    page.drawText(watermarkText, {
      x: (width - textWidth) / 2,
      y: height / 2,
      size: fontSize,
      font,
      color: rgb(color.r, color.g, color.b),
      opacity,
      rotate: degrees(rotation),
    });
  }
  return pdfDoc.save();
};

export const compressPdf = async (file, level = 'medium', onProgress) => {
  onProgress?.({ current: 1, total: 2, message: 'Loading PDF...' });
  const arrayBuffer = await readFileAsArrayBuffer(file);
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  onProgress?.({ current: 2, total: 2, message: 'Compressing...' });
  
  // Compression options based on level
  const options = {
    low: { useObjectStreams: false, addDefaultPage: false },
    medium: { useObjectStreams: true, addDefaultPage: false },
    high: { useObjectStreams: true, addDefaultPage: false, objectsPerTick: 50 },
  };
  
  return pdfDoc.save(options[level] || options.medium);
};

export const extractPages = async (file, pageNumbers, onProgress) => {
  const arrayBuffer = await readFileAsArrayBuffer(file);
  const sourcePdf = await PDFDocument.load(arrayBuffer);
  const newPdf = await PDFDocument.create();
  onProgress?.({ current: 1, total: 1, message: 'Extracting pages...' });
  const validIndices = pageNumbers.map(n => n - 1).filter(i => i >= 0 && i < sourcePdf.getPageCount());
  const pages = await newPdf.copyPages(sourcePdf, validIndices);
  pages.forEach(page => newPdf.addPage(page));
  return newPdf.save();
};

export const downloadFile = (data, filename) => {
  const blob = data instanceof Blob ? data : new Blob([data.buffer], { type: 'application/pdf' });
  saveAs(blob, filename);
};

export const downloadAsZip = async (files, zipName, onProgress) => {
  const zip = new JSZip();
  for (let i = 0; i < files.length; i++) {
    onProgress?.({ current: i + 1, total: files.length, message: `Adding ${files[i].name} to archive...` });
    zip.file(files[i].name, files[i].data);
  }
  const content = await zip.generateAsync({ type: 'blob' });
  saveAs(content, zipName);
};
