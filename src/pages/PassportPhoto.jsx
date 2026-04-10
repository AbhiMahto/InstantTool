import React, { useState, useRef, useEffect, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UploadCloud, CheckCircle, Download, Printer, Settings2,
  Sparkles, Wand2, ArrowRight, LayoutGrid, X, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import ToolLayout from '@/components/ToolLayout';

const bgColors = [
  { name: 'White', value: '#ffffff' },
  { name: 'Light Blue', value: '#e0f2fe' },
  { name: 'Blue', value: '#2563eb' },
  { name: 'Grey', value: '#f3f4f6' },
  { name: 'Dark', value: '#111827' },
  { name: 'Yellow', value: '#fbf348' },
  { name: 'Red', value: '#dc2626' },
];

export default function PassportPhoto() {
  const [file, setFile] = useState(null);
  const [processedImage, setProcessedImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [step, setStep] = useState(1);
  const [bgColor, setBgColor] = useState(bgColors[0].value);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const [enhancements, setEnhancements] = useState({
    brightness: 100,
    contrast: 100,
    smooth: 0,
  });

  const [cropBox, setCropBox] = useState(null);
  const { toast } = useToast();
  const canvasRef = useRef(null);

  const handleFileUpload = async (e) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    if (!uploadedFile.type.startsWith('image/')) {
      toast({ title: 'Invalid File', description: 'Please upload an image file (PNG, JPG).', variant: 'destructive' });
      return;
    }

    setFile(uploadedFile);
    processImage(uploadedFile);
  };

  const processImage = async (uploadedFile) => {
    setIsProcessing(true);
    setStep(2);
    setCropBox(null);
    setEnhancements({ brightness: 100, contrast: 100, smooth: 0 });
    setProcessingStatus('AI Processing...');

    try {
      const formData = new FormData();
      formData.append('image_file', uploadedFile);

      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_URL}/api/process-passport`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Server error');
      }

      const { bgRemovedUrl, aiData } = await response.json();

      if (aiData) {
        setCropBox(aiData.boundingBox);
        setEnhancements({
          brightness: aiData.brightness || 100,
          contrast: aiData.contrast || 100,
          smooth: aiData.smooth || 0,
        });
      }

      setProcessedImage(bgRemovedUrl);
      toast({ title: 'Success', description: 'AI processing complete!' });
    } catch (error) {
      console.error(error);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      setStep(1);
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };

  const handleAIEnhancement = async () => {
    if (!canvasRef.current) return;

    setIsEnhancing(true);
    try {
      // 1. Convert canvas to blob
      const blob = await new Promise(resolve => canvasRef.current.toBlob(resolve, 'image/png'));
      const formData = new FormData();
      formData.append('image_file', blob, 'cropped.png');

      // 2. Send to OpenAI for expert enhancement analysis
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_URL}/api/enhance-passport`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('AI Enhancement failed');

      const data = await response.json();

      // 3. Apply new recommendations
      setEnhancements({
        brightness: data.brightness || enhancements.brightness,
        contrast: data.contrast || enhancements.contrast,
        smooth: data.smooth || enhancements.smooth,
      });

      toast({
        title: 'Perfected!',
        description: 'OpenAI has optimized your photo for studio-quality lighting.'
      });
    } catch (error) {
      toast({ title: 'AI Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsEnhancing(false);
    }
  };

  useEffect(() => {
    if (processedImage && canvasRef.current && step === 2 && !isProcessing) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        canvas.width = 400;
        canvas.height = 514;

        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const blurAmount = enhancements.smooth > 0 ? `${enhancements.smooth}px` : '0px';
        ctx.filter = `brightness(${enhancements.brightness}%) contrast(${enhancements.contrast}%) blur(${blurAmount})`;

        let sx = 0, sy = 0, sWidth = img.width, sHeight = img.height;

        if (cropBox) {
          const boxW = (cropBox.xmax - cropBox.xmin) * img.width;
          const boxH = (cropBox.ymax - cropBox.ymin) * img.height;
          const centerX = cropBox.xmin * img.width + boxW / 2;
          const centerY = cropBox.ymin * img.height + boxH / 2;

          let targetW = boxW * 1.8;
          let targetH = targetW * (514 / 400);

          sx = centerX - targetW / 2;
          sy = centerY - targetH / 2.5;
          sWidth = targetW;
          sHeight = targetH;
        } else if (croppedAreaPixels) {
          sx = croppedAreaPixels.x;
          sy = croppedAreaPixels.y;
          sWidth = croppedAreaPixels.width;
          sHeight = croppedAreaPixels.height;
        } else {
          const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
          sWidth = canvas.width / scale;
          sHeight = canvas.height / scale;
          sx = (img.width - sWidth) / 2;
          sy = (img.height - sHeight) / 2;
        }

        ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, canvas.width, canvas.height);
      };
      img.onerror = (err) => {
        console.error("Failed to load processed image onto canvas", err);
      };
      img.src = processedImage;
    }
  }, [processedImage, bgColor, enhancements, step, cropBox, isProcessing, croppedAreaPixels]);

  return (
    <ToolLayout
      title="Passport Photo AI"
      description="Professional passport photos in seconds. Automatic cropping & background removal."
    >
      <div className="max-w-6xl mx-auto">
        {step === 1 && (
          <Card className="p-12 border-2 border-dashed border-border hover:border-primary/50 transition-colors bg-card/50 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-6">
              <UploadCloud className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Upload Portrait</h2>
            <p className="text-muted-foreground mb-8 max-w-sm">
              Upload a clear face photo. Our AI will handle the rest.
            </p>
            <div className="relative">
              <input
                type="file"
                onChange={handleFileUpload}
                accept="image/png, image/jpeg"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Button size="lg" className="rounded-full px-8">
                Select Photo
              </Button>
            </div>
            <p className="mt-6 text-xs text-muted-foreground">PNG, JPG up to 10MB</p>
          </Card>
        )}

        {step >= 2 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Sidebar Controls */}
            <div className="lg:col-span-4 space-y-6">
              <Card className="p-6 space-y-6">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                    <LayoutGrid className="w-4 h-4" /> Background
                  </h3>
                  <div className="flex flex-wrap gap-2 items-center">
                    {bgColors.map(color => (
                       <button
                        key={color.name}
                        onClick={() => setBgColor(color.value)}
                        className={`w-10 h-10 rounded-full border-2 transition-all ${bgColor === color.value ? 'border-primary ring-2 ring-primary/20 scale-110' : 'border-background hover:scale-105'}`}
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                      />
                    ))}
                    <div 
                      className={`relative w-10 h-10 rounded-full border-2 overflow-hidden transition-all flex items-center justify-center ${!bgColors.some(c => c.value === bgColor) ? 'border-primary ring-2 ring-primary/20 scale-110' : 'border-background hover:scale-105'}`}
                      title="Custom Color"
                    >
                      <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' color='%23ffffff'%3E%3Cpath d='m22 2-7 20-4-9-9-4Z'/%3E%3Cpath d='M22 2 11 13'/%3E%3C/svg%3E" alt="picker" className="w-5 h-5 opacity-0 absolute pointer-events-none z-10" />
                      <input 
                        type="color" 
                        value={bgColors.some(c => c.value === bgColor) ? '#ff00ff' : bgColor}
                        onChange={(e) => setBgColor(e.target.value)}
                        className="absolute -inset-2 w-14 h-14 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <Settings2 className="w-4 h-4" /> Enhancements
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-[10px] h-7 gap-1 bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 rounded-full font-bold border border-amber-500/20"
                      onClick={handleAIEnhancement}
                      disabled={isEnhancing}
                    >
                      {isEnhancing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                      AI PERFECT
                    </Button>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between text-sm">
                      <span>Brightness</span>
                      <span className="font-bold">{enhancements.brightness}%</span>
                    </div>
                    <Slider
                      value={[enhancements.brightness]}
                      min={50} max={150} step={1}
                      onValueChange={(val) => setEnhancements({ ...enhancements, brightness: val[0] })}
                    />
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between text-sm">
                      <span>Contrast</span>
                      <span className="font-bold">{enhancements.contrast}%</span>
                    </div>
                    <Slider
                      value={[enhancements.contrast]}
                      min={50} max={150} step={1}
                      onValueChange={(val) => setEnhancements({ ...enhancements, contrast: val[0] })}
                    />
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between text-sm">
                      <span>Smoothness</span>
                      <span className="font-bold">{enhancements.smooth}px</span>
                    </div>
                    <Slider
                      value={[enhancements.smooth]}
                      min={0} max={10} step={1}
                      onValueChange={(val) => setEnhancements({ ...enhancements, smooth: val[0] })}
                    />
                  </div>
                </div>
              </Card>

              <div className="flex flex-col gap-3">
                <Button
                  onClick={() => setStep(3)}
                  className="w-full py-6 text-lg font-bold"
                  disabled={isProcessing}
                >
                  Generate Print Sheet <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Button variant="outline" onClick={() => { setStep(1); setFile(null); }} className="w-full">
                  Change Photo
                </Button>
              </div>
            </div>

            {/* Preview Area */}
            <div className="lg:col-span-8">
              <Card className="overflow-hidden bg-muted/30 min-h-[500px] flex items-center justify-center relative">
                <AnimatePresence mode="wait">
                  {isProcessing ? (
                    <motion.div
                      key="loader"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="flex flex-col items-center gap-4 py-20"
                    >
                      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                      <p className="font-bold text-lg">{processingStatus}</p>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="canvas"
                      initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                      className="relative p-4 md:p-8 w-full flex justify-center"
                    >
                      <div
                        className="relative w-full max-w-[400px] aspect-[400/514] overflow-hidden rounded-lg shadow-2xl"
                        style={{ backgroundColor: bgColor }}
                      >
                        <Cropper
                          image={processedImage}
                          crop={crop}
                          zoom={zoom}
                          aspect={400 / 514}
                          onCropChange={setCrop}
                          onZoomChange={setZoom}
                          onCropComplete={(croppedArea, croppedAreaPixels) => setCroppedAreaPixels(croppedAreaPixels)}
                          style={{
                            containerStyle: { backgroundColor: 'transparent' },
                            mediaStyle: {
                              filter: `brightness(${enhancements.brightness}%) contrast(${enhancements.contrast}%) blur(${enhancements.smooth > 0 ? enhancements.smooth + 'px' : '0px'})`
                            }
                          }}
                        />
                      </div>
                      <canvas ref={canvasRef} className="hidden" />
                      <div className="absolute top-10 right-10 flex gap-2 pointer-events-none z-10">
                        <div className="bg-primary/90 text-primary-foreground text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider shadow-lg">
                          Drag & Zoom to Crop
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </div>
          </div>
        )}

        {/* Print Overlay */}
        <AnimatePresence>
          {step === 3 && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-md overflow-y-auto pt-20"
            >
              <div className="container mx-auto px-4 pb-20">
                <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
                  <div>
                    <h2 className="text-3xl font-bold">Print Sheet Preview</h2>
                    <p className="text-muted-foreground text-sm font-medium">Standard 4x6" Sheet Layout (8 Copies)</p>
                  </div>
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setStep(2)}>Back to Edit</Button>
                    <Button className="font-bold gap-2">
                      <Download className="w-4 h-4" /> Download
                    </Button>
                    <Button variant="glow" className="font-bold gap-2">
                      <Printer className="w-4 h-4" /> Print
                    </Button>
                  </div>
                </div>

                <div className="flex justify-center">
                  <div className="bg-white p-6 shadow-2xl rounded-sm border" style={{ width: '800px', height: '533px' }}>
                    <div className="w-full h-full border border-slate-100 grid grid-cols-4 grid-rows-2 gap-2 bg-slate-50 p-2">
                      {[...Array(8)].map((_, i) => (
                        <img
                          key={i}
                          src={canvasRef.current?.toDataURL()}
                          alt="copy"
                          className="w-full h-full object-cover shadow-sm border border-slate-200"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ToolLayout>
  );
}
