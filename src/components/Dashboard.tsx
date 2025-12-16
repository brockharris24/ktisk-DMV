import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Clock, CheckCircle2, Wrench, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Project } from '../types/project';

interface DashboardProps {
  onNewProject: () => void;
  onSelectProject: (projectId: string) => void;
}

interface SavedProject {
  id: string;
  project_title: string;
  status: string;
  difficulty: string;
  time_estimate: string;
  professional_cost: number;
  diy_cost: number;
  steps_json: unknown;
  tools_json: unknown;
  completed_steps: unknown;
  owned_items: unknown;
  created_at: string;
}

export function Dashboard({ onNewProject }: DashboardProps) {
  const { user, signOut } = useAuth();
  const [projects, setProjects] = useState<SavedProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (projectId: string) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;

    try {
      const { error } = await supabase.from('projects').delete().eq('id', projectId);
      if (error) throw error;
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  };

  const inProgressProjects = projects.filter((p) => p.status === 'in_progress');
  const completedProjects = projects.filter((p) => p.status === 'completed');

  const difficultyColors = {
    easy: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    hard: 'bg-red-100 text-red-800',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl text-lg"
          >
            <Plus className="w-6 h-6" />
            Create New Project
          </Link>
        </div>
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-600 p-3 rounded-xl">
              <Wrench className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Projects</h1>
              <p className="text-gray-600">{user?.email}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={signOut}
              className="flex items-center gap-2 px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-300 transition-colors min-h-[48px]"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-600">Loading projects...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <div className="inline-block bg-emerald-100 p-6 rounded-full mb-6">
              <Wrench className="w-12 h-12 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              No Projects Yet
            </h2>
            <p className="text-gray-600 mb-6">
              Start your first DIY project and save money today!
            </p>
            <button
              onClick={onNewProject}
              className="inline-flex items-center gap-2 px-8 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors min-h-[48px]"
            >
              <Plus className="w-5 h-5" />
              Create Your First Project
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {inProgressProjects.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Clock className="w-6 h-6 text-emerald-600" />
                  In Progress ({inProgressProjects.length})
                </h2>
                <div className="flex flex-col gap-4">
                  {inProgressProjects.map((project) => {
                    const steps = (project.steps_json as Project['steps']) || [];
                    const completedSteps = (project.completed_steps as number[]) || [];
                    const progress = steps.length > 0 ? (completedSteps.length / steps.length) * 100 : 0;

                    return (
                      <div key={project.id} className="relative">
                        <Link
                          to={`/project/${project.id}`}
                          className="block bg-white rounded-xl p-6 shadow-sm border-2 border-gray-200 hover:border-emerald-300 hover:shadow-md transition-all"
                        >
                          <div className="flex items-start justify-between mb-3 pr-10">
                            <h3 className="font-bold text-gray-900 text-lg flex-1">
                              {project.project_title}
                            </h3>
                          </div>
                          <div className="flex items-center gap-2 mb-4">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                difficultyColors[project.difficulty as keyof typeof difficultyColors]
                              }`}
                            >
                              {project.difficulty}
                            </span>
                            <span className="text-sm text-gray-600">{project.time_estimate}</span>
                          </div>
                          <div className="mb-2">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-gray-700">Progress</span>
                              <span className="text-sm font-bold text-emerald-600">
                                {completedSteps.length}/{steps.length}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-emerald-600 h-full rounded-full transition-all"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                          <div className="mt-4 pt-4 border-t border-gray-100">
                            <div className="text-sm text-gray-600">
                              Savings: <span className="font-semibold text-emerald-600">
                                ${project.professional_cost - project.diy_cost}
                              </span>
                            </div>
                          </div>
                        </Link>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            void handleDelete(project.id);
                          }}
                          type="button"
                          className="absolute top-4 right-4 z-50 bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded-lg shadow-lg"
                        >
                          DELETE
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {completedProjects.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                  Completed ({completedProjects.length})
                </h2>
                <div className="flex flex-col gap-4">
                  {completedProjects.map((project) => (
                    <div key={project.id} className="relative">
                      <Link
                        to={`/project/${project.id}`}
                        className="block bg-white rounded-xl p-6 shadow-sm border-2 border-emerald-200 hover:border-emerald-300 hover:shadow-md transition-all"
                      >
                        <div className="flex items-start justify-between mb-3 pr-10">
                          <h3 className="font-bold text-gray-900 text-lg flex-1">
                            {project.project_title}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2 mb-4">
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                          <span className="text-sm font-medium text-emerald-600">Completed</span>
                        </div>
                        <div className="text-sm text-gray-600">
                          You saved: <span className="font-semibold text-emerald-600">
                            ${project.professional_cost - project.diy_cost}
                          </span>
                        </div>
                      </Link>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          void handleDelete(project.id);
                        }}
                        type="button"
                        className="absolute top-4 right-4 z-50 bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded-lg shadow-lg"
                      >
                        DELETE
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
