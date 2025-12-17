import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search as SearchIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface SearchResultProject {
  id: string;
  project_title: string;
  status: string;
  difficulty: string;
  time_estimate: string;
  professional_cost: number;
  diy_cost: number;
  is_public?: boolean;
  user_id?: string;
}

export function Search() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<SearchResultProject[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const runSearch = async () => {
    const term = searchTerm.trim();
    if (!term) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    try {
      console.log('Searching as:', user ? 'User' : 'Guest');

      // Note: Using 'title' here per requested behavior. The UI renders either `project_title` or `title`.
      const query = !user
        ? supabase
            .from('projects')
            .select('*')
            .ilike('project_title', `%${term}%`)
            .eq('is_public', true)
            .order('created_at', { ascending: false })
        : supabase
            .from('projects')
            .select('*')
            .ilike('project_title', `%${term}%`)
            .or(`is_public.eq.true,user_id.eq.${user.id}`)
            .order('created_at', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;
      setResults((data || []) as SearchResultProject[]);
    } catch (err) {
      console.error('Search error:', err);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const difficultyColors: Record<string, string> = {
    easy: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    hard: 'bg-red-100 text-red-800',
  };

  return (
    <div className="min-h-[calc(100vh-72px)] bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Search Projects</h1>
          <p className="text-gray-600">Find projects by title</p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void runSearch();
          }}
          className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 mb-8"
        >
          <label htmlFor="project-search" className="block text-sm font-semibold text-gray-700 mb-3">
            Search your projects
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="project-search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Type a project title..."
                className="w-full pl-12 pr-4 py-4 text-lg border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={isSearching || !searchTerm.trim()}
              className="px-8 py-4 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors min-h-[56px]"
            >
              {isSearching ? 'Searching…' : 'Search'}
            </button>
          </div>
        </form>

        {results.length === 0 ? (
          <div className="text-center py-10 text-gray-600">
            {isSearching ? 'Searching…' : 'No results yet. Try searching for a project title.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {results.map((project) => {
              const savings = project.professional_cost - project.diy_cost;
              const difficultyClass = difficultyColors[project.difficulty] || 'bg-gray-100 text-gray-700';

              return (
                <Link
                  key={project.id}
                  to={`/project/${project.id}`}
                  className="block bg-white rounded-xl p-6 shadow-sm border-2 border-gray-200 hover:border-emerald-300 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-bold text-gray-900 text-lg">{project.project_title}</h3>
                    <span className="text-xs font-semibold text-gray-500 capitalize">{project.status}</span>
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${difficultyClass}`}>
                      {project.difficulty}
                    </span>
                    <span className="text-sm text-gray-600">{project.time_estimate}</span>
                  </div>

                  <div className="pt-4 border-t border-gray-100">
                    <div className="text-sm text-gray-600">
                      Savings:{' '}
                      <span className="font-semibold text-emerald-600">
                        ${savings}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}


