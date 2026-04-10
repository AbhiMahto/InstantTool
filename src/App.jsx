import { Routes, Route } from 'react-router-dom';
import { Toaster } from './components/ui/toaster';
import Index from './pages/Index';
import MergePdf from './pages/MergePdf';
import SplitPdf from './pages/SplitPdf';
import CompressPdf from './pages/CompressPdf';
import PdfToImages from './pages/PdfToImages';
import ImagesToPdf from './pages/ImagesToPdf';
import RotatePdf from './pages/RotatePdf';
import ExtractPages from './pages/ExtractPages';
import RemovePages from './pages/RemovePages';
import WatermarkPdf from './pages/WatermarkPdf';
import MetadataEditor from './pages/MetadataEditor';
import ProtectPdf from './pages/ProtectPdf';
import UnlockPdf from './pages/UnlockPdf';
import PassportPhoto from './pages/PassportPhoto';
import NotFound from './pages/NotFound';

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/merge" element={<MergePdf />} />
        <Route path="/split" element={<SplitPdf />} />
        <Route path="/compress" element={<CompressPdf />} />
        <Route path="/pdf-to-images" element={<PdfToImages />} />
        <Route path="/images-to-pdf" element={<ImagesToPdf />} />
        <Route path="/rotate" element={<RotatePdf />} />
        <Route path="/extract" element={<ExtractPages />} />
        <Route path="/remove-pages" element={<RemovePages />} />
        <Route path="/watermark" element={<WatermarkPdf />} />
        <Route path="/metadata" element={<MetadataEditor />} />
        <Route path="/protect" element={<ProtectPdf />} />
        <Route path="/unlock" element={<UnlockPdf />} />
        <Route path="/passport-photo" element={<PassportPhoto />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
    </>
  );
}

export default App;
