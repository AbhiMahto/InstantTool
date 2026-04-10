import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Header from './Header';
import { Button } from './ui/button';

export default function ToolLayout({ children, title, description }) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Link to="/">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Tools
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-foreground mb-2">{title}</h1>
          <p className="text-muted-foreground">{description}</p>
        </div>
        {children}
      </main>
    </div>
  );
}
