import { Shield, Lock } from 'lucide-react';

export default function PrivacyBadge() {
  return (
    <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full bg-green-500/10 border border-green-500/30 pulse-glow">
      <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-400 flex-shrink-0" />
      <span className="text-xs sm:text-sm font-medium text-green-400 whitespace-nowrap">
        <span className="hidden xs:inline">100% </span>Private<span className="hidden sm:inline"> & Offline</span>
      </span>
      <Lock className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-green-400 flex-shrink-0" />
    </div>
  );
}
