import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation, useParams } from 'react-router-dom';
import { useAuth, AuthProvider } from './contexts/AuthContext';
import { Auth } from './components/Auth';
import { Landing } from './components/Landing';
import { ProjectCard } from './components/ProjectCard';
import { Guide } from './components/Guide';
import { Dashboard } from './components/Dashboard';
import { ProjectDetails } from './components/ProjectDetails';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { About } from './components/About';
import { Search } from './components/Search';
import { supabase } from './lib/supabase';
import type { Project } from './types/project';


function ProjectPreviewPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const project = location.state?.project as Project | undefined;

  if (!project) {
    return <Navigate to="/" replace />;
  }

  const saveAndStartProject = async () => {
    if (!project || !user) return;

    try {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          user_id: user.id,
          project_title: project.project_title,
          is_public: project.is_public ?? false,
          status: 'in_progress',
          difficulty: project.difficulty,
          time_estimate: project.time_estimate,
          professional_cost: project.professional_cost,
          diy_cost: project.diy_cost,
          steps_json: project.steps,
          tools_json: project.tools,
          completed_steps: [],
          owned_items: [],
        } as any)
        .select()
        .single();

      if (error) throw error;

      navigate(`/project/${(data as { id: string }).id}`);
    } catch (err) {
      console.error('Error saving project:', err);
      alert(err instanceof Error ? err.message : 'Failed to save project');
    }
  };

  return (
    <ProjectCard
      project={project}
      onStartProject={saveAndStartProject}
    />
  );
}

function ProjectGuidePage() {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProject = async () => {
    if (!projectId) {
      setError('Project ID is required');
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Project not found');

      setProject({
        id: data.id,
        user_id: data.user_id,
        project_title: data.project_title,
        is_public: (data as any).is_public ?? false,
        difficulty: data.difficulty as 'easy' | 'medium' | 'hard',
        time_estimate: data.time_estimate,
        professional_cost: data.professional_cost,
        diy_cost: data.diy_cost,
        steps: data.steps_json as unknown as Project['steps'],
        tools: data.tools_json as unknown as Project['tools'],
        completed_steps: data.completed_steps as unknown as number[],
        owned_items: data.owned_items as unknown as number[],
        status: data.status,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProject();
  }, [projectId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="text-red-600 text-5xl mb-4">⚠</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Something went wrong</h2>
          <p className="text-gray-600 mb-6">{error || 'Project not found'}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <Guide
      project={project}
      onBack={() => navigate('/dashboard')}
      onGoHome={() => navigate('/')}
    />
  );
}

function DashboardPage() {
  const navigate = useNavigate();

  const loadProject = async (projectId: string) => {
    navigate(`/project/${projectId}`);
  };

  return (
    <Dashboard
      onNewProject={() => navigate('/')}
      onSelectProject={loadProject}
    />
  );
}

function AppContent() {
  return (
    <Routes>
      <Route path="/" element={<Layout><Landing /></Layout>} />
      <Route path="/auth" element={<Layout><Auth /></Layout>} />
      <Route path="/project-details" element={<Layout><ProjectDetails /></Layout>} />
      <Route path="/about" element={<Layout><About /></Layout>} />
      <Route path="/search" element={<Layout><Search /></Layout>} />
      <Route
        path="/project/preview"
        element={
          <ProtectedRoute>
            <Layout><ProjectPreviewPage /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/project/:projectId"
        element={
          <ProtectedRoute>
            <Layout><ProjectGuidePage /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Layout><DashboardPage /></Layout>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
