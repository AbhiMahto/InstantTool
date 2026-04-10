import { Link } from 'react-router-dom';
import { FileText } from 'lucide-react';
import PrivacyBadge from './PrivacyBadge';

export default function Header() {
  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-lg sticky top-0 z-50">
      <div className="container mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between gap-2">
        <Link to="/" className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary flex items-center justify-center">
            <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
          </div>
          <span className="text-lg sm:text-xl font-bold text-foreground">InstantTools</span>
        </Link>
        <PrivacyBadge />
      </div>
    </header>
  );
}
