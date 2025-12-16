import { Link, useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();

  return (
    <div>
      <header className="bg-white border-b shadow-sm sticky top-0 z-50">
        <nav className="max-w-7xl mx-auto p-4 flex items-center justify-between">
          <Link to="/" className="font-bold text-xl text-gray-900 hover:text-emerald-600 transition-colors">
            ktisk
          </Link>

          <div className="flex items-center gap-4">
            <Link to="/" className="text-gray-700 hover:text-emerald-600 font-semibold transition-colors">
              Home
            </Link>
            <Link to="/about" className="text-gray-700 hover:text-emerald-600 font-semibold transition-colors">
              About
            </Link>
            <Link to="/dashboard" className="text-gray-700 hover:text-emerald-600 font-semibold transition-colors">
              My Profile
            </Link>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-2 text-gray-700 hover:text-emerald-600 font-semibold transition-colors"
            >
              <Search className="w-5 h-5" />
              Search
            </button>
          </div>
        </nav>
      </header>
      <main>{children}</main>
    </div>
  );
}

