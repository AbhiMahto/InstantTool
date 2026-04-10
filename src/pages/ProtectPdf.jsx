import { Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import ToolLayout from '@/components/ToolLayout';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const ProtectPdf = () => {
  return (
    <ToolLayout
      title="Protect PDF"
      description="Add password encryption to your PDF"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-12 space-y-6"
      >
        <div className="w-24 h-24 rounded-3xl bg-red-500/10 flex items-center justify-center">
          <Lock className="w-12 h-12 text-red-500" />
        </div>
        
        <div className="text-center space-y-2 max-w-md">
          <h2 className="text-2xl font-bold text-foreground">Coming Soon</h2>
          <p className="text-muted-foreground">
            PDF password protection is being developed. This feature will allow you to 
            encrypt your PDFs with a password locally, ensuring your documents stay secure.
          </p>
        </div>

        <Button variant="outline" asChild>
          <Link to="/">Back to All Tools</Link>
        </Button>
      </motion.div>
    </ToolLayout>
  );
};

export default ProtectPdf;
