import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth, AuthProvider } from './contexts/AuthContext';
import { Auth } from './components/Auth';
import { Landing } from './components/Landing';
import { ProjectCard } from './components/ProjectCard';
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
        path="/project/:id"
        element={<Layout><ProjectDetails /></Layout>}
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
