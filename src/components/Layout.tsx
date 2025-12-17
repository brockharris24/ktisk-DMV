import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, Search } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <div>
      <header className="bg-white border-b shadow-sm sticky top-0 z-50">
        <nav className="max-w-7xl mx-auto p-4 flex items-center justify-between relative">
          <Link to="/" className="font-bold text-xl text-gray-900 hover:text-emerald-600 transition-colors">
            ktisk
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex md:!flex items-center gap-4">
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

          {/* Mobile menu button */}
          <button
            type="button"
            aria-label="Open menu"
            aria-expanded={isMenuOpen}
            onClick={() => setIsMenuOpen((v) => !v)}
            className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-emerald-600 hover:bg-gray-100 transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Mobile menu */}
          {isMenuOpen && (
            <div className="md:hidden absolute right-4 top-full mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-50">
              <Link
                to="/"
                onClick={closeMenu}
                className="block px-4 py-3 text-gray-700 hover:bg-gray-50 font-semibold"
              >
                Home
              </Link>
              <Link
                to="/about"
                onClick={closeMenu}
                className="block px-4 py-3 text-gray-700 hover:bg-gray-50 font-semibold"
              >
                About
              </Link>
              <Link
                to="/dashboard"
                onClick={closeMenu}
                className="block px-4 py-3 text-gray-700 hover:bg-gray-50 font-semibold"
              >
                My Profile
              </Link>
              <button
                type="button"
                onClick={() => {
                  closeMenu();
                  navigate('/');
                }}
                className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-50 font-semibold inline-flex items-center gap-2"
              >
                <Search className="w-5 h-5" />
                Search
              </button>
            </div>
          )}
        </nav>
      </header>
      <main>{children}</main>
    </div>
  );
}

