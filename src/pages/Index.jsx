import { motion } from 'framer-motion';
import {
  Merge, Scissors, FileImage, Image, RotateCw, FileOutput,
  Trash2, Droplets, Minimize2, Wand2, Lock, Unlock, FileEdit
} from 'lucide-react';
import Header from '@/components/Header';
import ToolCard from '@/components/ToolCard';

const tools = [
  { icon: Wand2, title: 'Passport Photo AI', description: 'Create passport photos in seconds. Automatic cropping & background removal.', to: '/passport-photo', color: 'convert', featured: true },
  { icon: Merge, title: 'Merge PDF', description: 'Combine multiple PDFs into one', to: '/merge', color: 'organize' },
  { icon: Scissors, title: 'Split PDF', description: 'Separate one PDF into multiple', to: '/split', color: 'organize' },
  { icon: Minimize2, title: 'Compress PDF', description: 'Reduce PDF file size', to: '/compress', color: 'optimize' },
  { icon: FileImage, title: 'PDF to Images', description: 'Convert PDF pages to images', to: '/pdf-to-images', color: 'convert' },
  { icon: Image, title: 'Images to PDF', description: 'Create PDF from images', to: '/images-to-pdf', color: 'convert' },
  { icon: RotateCw, title: 'Rotate PDF', description: 'Rotate PDF pages', to: '/rotate', color: 'edit' },
  { icon: FileOutput, title: 'Extract Pages', description: 'Extract specific pages', to: '/extract', color: 'organize' },
  { icon: Trash2, title: 'Remove Pages', description: 'Delete pages from PDF', to: '/remove-pages', color: 'edit' },
  { icon: Droplets, title: 'Watermark', description: 'Add watermark to PDF', to: '/watermark', color: 'edit' },
  { icon: Lock, title: 'Protect PDF', description: 'Add password and encrypt PDF', to: '/protect', color: 'security' },
  { icon: Unlock, title: 'Unlock PDF', description: 'Remove password and security', to: '/unlock', color: 'security' },
  { icon: FileEdit, title: 'Edit Metadata', description: 'Modify title, author and keywords', to: '/metadata', color: 'edit' },
];

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-black mb-6 tracking-tight leading-tight">
            <span className="text-gradient-primary">Your Ultimate Workspace for</span><br />
            <span className="text-foreground">AI Photos & Fast PDF Tools</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
            Professional passport photos in seconds using AI. Plus, all the PDF tools you need—running 100% in your browser.
            <strong className="text-foreground block mt-2">No uploads. No servers. 100% Private.</strong>
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/30">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm text-green-400">Works offline after first load</span>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tools.map((tool, index) => (
            <motion.div
              key={tool.to}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <ToolCard {...tool} />
            </motion.div>
          ))}
        </div>
      </main>

      <footer className="py-4 border-t border-border mt-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-center gap-4">
            <p className="text-sm text-muted-foreground">
              © 2025 InstantTools. All processing happens locally.
            </p>
            <p className="text-sm text-muted-foreground">
              Made with ❤️    </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
