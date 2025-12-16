import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, LogIn } from 'lucide-react';

export function Landing() {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate('/project-details', { state: { searchTerm: query.trim() } });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center p-4">
      <div className="max-w-3xl w-full">
        <div className="flex justify-end mb-6">
          <Link
            to="/auth"
            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors min-h-[48px]"
          >
            <LogIn className="w-5 h-5" />
            Sign In
          </Link>
        </div>
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <img 
              src="/ktisk-logo.png" 
              alt="Ktisk Logo" 
              className="h-20 w-auto object-contain"
            />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-blue-600 mb-4">
            Ktisk: Build it Yourself
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            Your DIY Home Improvement Companion
          </p>
          <p className="text-lg text-gray-500 mb-8">
            Save money. Learn skills. Build confidence.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mb-8">
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <label htmlFor="search" className="block text-lg font-medium text-gray-700 mb-4">
              What do you want to build or fix?
            </label>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="search"
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g., Fix a leaky faucet, Install a ceiling fan, Build a deck..."
                  className="w-full pl-12 pr-4 py-4 text-lg border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={!query.trim()}
                className="px-8 py-4 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors min-h-[56px]"
              >
                Get Started
              </button>
            </div>
          </div>
        </form>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="text-3xl font-bold text-emerald-600 mb-2">Save Money</div>
            <p className="text-gray-600">Cut costs by doing it yourself</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="text-3xl font-bold text-emerald-600 mb-2">Learn Skills</div>
            <p className="text-gray-600">Gain valuable home improvement knowledge</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="text-3xl font-bold text-emerald-600 mb-2">Step-by-Step</div>
            <p className="text-gray-600">Clear instructions for every project</p>
          </div>
        </div>
      </div>
    </div>
  );
}
