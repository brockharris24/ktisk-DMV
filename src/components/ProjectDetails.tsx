import { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { CheckCircle2, Circle, Wrench, TrendingDown, Save, Sparkles } from 'lucide-react';
import OpenAI from 'openai';
import { supabaseClient } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';

interface ProjectData {
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  savings: {
    pro: number;
    diy: number;
  };
  tools_list: string[];
  steps_list: string[];
}

export function ProjectDetails() {
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const searchTerm = (location.state as { searchTerm?: string })?.searchTerm;
  const { user: authUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [project, setProject] = useState<ProjectData | null>(null);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [ownedTools, setOwnedTools] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const [isDifficultyLoading, setIsDifficultyLoading] = useState(false);
  const [isGeneratingSteps, setIsGeneratingSteps] = useState(false);
  const [projectOwnerId, setProjectOwnerId] = useState<string | null>(null);
  const [isProjectPublic, setIsProjectPublic] = useState<boolean>(false);

  const isViewingSavedProject = Boolean(id);
  const isOwner = Boolean(isViewingSavedProject && authUser?.id && projectOwnerId === authUser.id);
  const isGuestViewer = Boolean(isViewingSavedProject && !isOwner);
  const canEdit = !isViewingSavedProject || isOwner;
  const canSave = Boolean(authUser?.id && canEdit);
  const canDelete = Boolean(isViewingSavedProject && isOwner);

  const generateSteps = async (title: string): Promise<string[]> => {
    // Mock mode: simulate a 2s API call, then return a hardcoded list.
    await new Promise<void>((resolve) => setTimeout(resolve, 2000));

    return [
      `Step 1: Gather materials for ${title}`,
      'Step 2: Measure the area and mark reference points',
      'Step 3: Prepare the workspace and tools',
      `Step 4: Complete the main build/repair steps for ${title}`,
      'Step 5: Test, clean up, and review safety checks',
    ];
  };

  const createOpenAIClient = () => {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key not found in environment variables');
    }

    return new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true,
    });
  };

  const evaluateDifficulty = async (title: string): Promise<ProjectData['difficulty']> => {
    const res = await fetch('/api/evaluate-difficulty', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    });

    if (!res.ok) {
      throw new Error(`Difficulty API failed (${res.status})`);
    }

    const data = (await res.json()) as { difficulty?: string };
    const d = (data.difficulty ?? '').toString().trim().toLowerCase();

    if (d === 'easy' || d === 'medium' || d === 'hard') return d;
    return 'medium';
  };

  useEffect(() => {
    const normalizeSteps = (stepsJson: any): string[] => {
      if (!Array.isArray(stepsJson)) return [];
      return stepsJson
        .map((s) => {
          if (typeof s === 'string') return s;
          if (s && typeof s === 'object' && typeof s.instruction === 'string') return s.instruction;
          return null;
        })
        .filter(Boolean) as string[];
    };

    const normalizeTools = (toolsJson: any): string[] => {
      if (!Array.isArray(toolsJson)) return [];
      return toolsJson
        .map((t) => {
          if (typeof t === 'string') return t;
          if (t && typeof t === 'object' && typeof t.name === 'string') return t.name;
          return null;
        })
        .filter(Boolean) as string[];
    };

    const loadSavedProject = async (id: string) => {
      setLoading(true);
      setError(null);

      try {
        const { data, error } = await supabaseClient
          .from('projects')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (error) throw error;
        if (!data) throw new Error('Project not found');

        const ownerId = (data as any).user_id ?? null;
        const isPublic = Boolean((data as any).is_public);

        setProjectOwnerId(ownerId);
        setIsProjectPublic(isPublic);

        const viewerId = authUser?.id ?? null;
        const owner = Boolean(viewerId && ownerId && viewerId === ownerId);

        if (!owner && !isPublic) {
          throw new Error('This project is private.');
        }

        setCompletedSteps((data as any).completed_steps ?? []);
        setOwnedTools((data as any).owned_items ?? []);

        setProject({
          title: (data as any).project_title ?? 'Untitled Project',
          difficulty: ((data as any).difficulty ?? 'medium') as ProjectData['difficulty'],
          savings: {
            pro: Number((data as any).professional_cost ?? 0),
            diy: Number((data as any).diy_cost ?? 0),
          },
          tools_list: normalizeTools((data as any).tools_json),
          steps_list: normalizeSteps((data as any).steps_json),
        });
      } catch (err) {
        console.error('Error loading project:', err);
        setError(err instanceof Error ? err.message : 'Failed to load project');
      } finally {
        setLoading(false);
      }
    };

    const generateProject = async (term: string) => {
      setLoading(true);
      setError(null);
      setProjectOwnerId(null);
      setIsProjectPublic(false);

      try {
        const openai = createOpenAIClient();

        // Start difficulty classification in parallel so we can show the plan ASAP.
        setIsDifficultyLoading(true);
        const difficultyPromise = evaluateDifficulty(term).finally(() => {
          setIsDifficultyLoading(false);
        });

        const prompt = `Create a detailed DIY project plan for: "${term}"

Return a JSON object with the following structure:
{
  "title": "Project title",
  "difficulty": "easy" or "medium" or "hard",
  "savings": {
    "pro": professional_cost_as_number,
    "diy": diy_cost_as_number
  },
  "tools_list": ["tool1", "tool2", "tool3"],
  "steps_list": ["step 1 instruction", "step 2 instruction", ...]
}

Make sure the response is valid JSON only, no markdown formatting.`;

        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful DIY home improvement assistant. Always return valid JSON only, no markdown code blocks.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 2000,
        });

        const content = completion.choices[0]?.message?.content;
        if (!content) {
          throw new Error('No response from OpenAI');
        }

        // Clean the response - remove markdown code blocks if present
        let cleanedContent = content.trim();
        if (cleanedContent.startsWith('```json')) {
          cleanedContent = cleanedContent.replace(/^```json\n?/, '').replace(/\n?```$/, '');
        } else if (cleanedContent.startsWith('```')) {
          cleanedContent = cleanedContent.replace(/^```\n?/, '').replace(/\n?```$/, '');
        }

        const projectData: ProjectData = JSON.parse(cleanedContent);
        setProject(projectData);

        // If classifier resolves later, update difficulty in state.
        difficultyPromise
          .then((difficulty) => setProject((prev) => (prev ? { ...prev, difficulty } : prev)))
          .catch((difficultyErr) => console.error('Error evaluating difficulty:', difficultyErr));
      } catch (err) {
        console.error('Error generating project:', err);
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to generate project plan. Please try again.'
        );
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      void loadSavedProject(id);
      return;
    }

    if (!searchTerm) {
      setError('No search term provided');
      setLoading(false);
      return;
    }

    void generateProject(searchTerm);
  }, [projectId, searchTerm, authUser?.id]);

  const toggleStep = (stepId: number) => {
    if (!canEdit) return;
    setCompletedSteps((prev) =>
      prev.includes(stepId) ? prev.filter((id) => id !== stepId) : [...prev, stepId]
    );
  };

  const toggleTool = (toolId: number) => {
    if (!canEdit) return;
    setOwnedTools((prev) =>
      prev.includes(toolId) ? prev.filter((id) => id !== toolId) : [...prev, toolId]
    );
  };

  const handleSaveProject = async () => {
    if (!project) return;
    if (!canSave) return;

    setSaving(true);
    try {
      // Always classify difficulty on save (per requirements) before writing to Supabase.
      setIsDifficultyLoading(true);
      const difficulty = await evaluateDifficulty(project.title);
      setProject((prev) => (prev ? { ...prev, difficulty } : prev));

      // Get current user if authenticated
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (!user) {
        alert('Please sign in to save projects.');
        return;
      }

      // Transform the project data to match the database schema
      const steps = project.steps_list.map((instruction, index) => ({
        id: index + 1,
        instruction: instruction,
      }));

      const tools = project.tools_list.map((name, index) => ({
        id: index + 1,
        name: name,
        price: 0, // Default price since we don't have it from AI
        category: 'tool' as const,
        amazon_search: name,
      }));

      const projectData: Record<string, unknown> = {
        project_title: project.title,
        difficulty,
        professional_cost: project.savings.pro,
        diy_cost: project.savings.diy,
        steps_json: steps,
        tools_json: tools,
        completed_steps: completedSteps,
        owned_items: ownedTools,
        status: 'in_progress',
      };

      // Owner is always the current user for saves/updates from this page.
      projectData.user_id = user.id;

      console.log('Attempting to save:', projectData);

      try {
        const db = supabaseClient.from('projects');
        const { error } = id
          ? await db.update(projectData).eq('id', id).eq('user_id', user.id)
          : await db.insert(projectData);

        if (error) throw error;

        alert(id ? 'Project Updated!' : 'Project Saved!');
        if (!id) {
          navigate('/dashboard');
        }
      } catch (insertError) {
        console.error('Error saving project:', insertError);
        const errorMessage = insertError instanceof Error ? insertError.message : 'Failed to save project';
        alert(errorMessage);
        throw insertError; // Re-throw to be caught by outer catch if needed
      }
    } catch (err) {
      console.error('Error in saveProject function:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to save project';
      alert(errorMessage);
    } finally {
      setIsDifficultyLoading(false);
      setSaving(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!id) return;
    if (!canDelete) return;
    if (!window.confirm('Delete this project? This cannot be undone.')) return;

    try {
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (!user) {
        alert('Please sign in to delete projects.');
        return;
      }

      const { error } = await supabaseClient
        .from('projects')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      alert('Project Deleted.');
      navigate('/dashboard');
    } catch (err) {
      console.error('Error deleting project:', err);
      alert(err instanceof Error ? err.message : 'Failed to delete project');
    }
  };

  const difficultyColors = {
    easy: 'bg-green-100 text-green-800 border-green-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    hard: 'bg-red-100 text-red-800 border-red-200',
  };

  const difficultyPercentages = {
    easy: 33,
    medium: 50,
    hard: 67,
  };

  const difficultyLabels = {
    easy: 'Easy',
    medium: 'Medium',
    hard: 'Hard',
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="inline-block w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {id ? 'Loading Project...' : 'Generating Plan...'}
          </h2>
          <p className="text-gray-600">
            {id ? 'Fetching project details' : `Creating your DIY project plan for "${searchTerm}"`}
          </p>
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
          <p className="text-gray-600 mb-6">{error || 'Failed to load project'}</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors"
          >
            Go Back Home
          </button>
        </div>
      </div>
    );
  }

  const savings = project.savings.pro - project.savings.diy;
  const savingsPercent = Math.round((savings / project.savings.pro) * 100);
  const progress = project.steps_list.length > 0 ? (completedSteps.length / project.steps_list.length) * 100 : 0;
  const difficultyPercentage = difficultyPercentages[project.difficulty];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-emerald-600 p-3 rounded-xl">
              <Wrench className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {project.title}
          </h1>
          <div className="flex items-center justify-center gap-3 mb-6">
            <span
              className={`px-4 py-2 rounded-full text-sm font-semibold border-2 ${
                difficultyColors[project.difficulty]
              }`}
            >
              {difficultyLabels[project.difficulty]} Difficulty
            </span>
            {isViewingSavedProject && (
              <span className="text-sm font-semibold text-gray-500">
                {isProjectPublic ? 'Public' : 'Private'}
              </span>
            )}
          </div>
          {canSave && (
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={handleSaveProject}
                disabled={saving}
                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors min-h-[48px]"
              >
                <Save className="w-5 h-5" />
                {saving ? 'Saving...' : projectId ? 'Update Project' : 'Save Project'}
              </button>
              {canDelete && (
                <button
                  onClick={handleDeleteProject}
                  type="button"
                  className="px-6 py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-colors min-h-[48px]"
                >
                  Delete
                </button>
              )}
            </div>
          )}
        </div>

        {/* Difficulty Meter */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Difficulty Meter</h2>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Easy</span>
                <span className="text-sm font-medium text-gray-700">Hard</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                {isDifficultyLoading ? (
                  <div className="h-full w-1/3 bg-gray-300 animate-pulse rounded-full" />
                ) : (
                  <div
                    className={`h-full transition-all duration-300 rounded-full ${
                      project.difficulty === 'easy'
                        ? 'bg-green-500'
                        : project.difficulty === 'medium'
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${difficultyPercentage}%` }}
                  />
                )}
              </div>
            </div>
            {isDifficultyLoading ? (
              <div className="flex items-center gap-3">
                <div className="inline-block w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                <div className="text-sm font-semibold text-gray-600">Determining…</div>
              </div>
            ) : (
              <div
                className={`text-2xl font-bold ${
                  project.difficulty === 'easy'
                    ? 'text-green-600'
                    : project.difficulty === 'medium'
                    ? 'text-yellow-600'
                    : 'text-red-600'
                }`}
              >
                {difficultyLabels[project.difficulty]}
              </div>
            )}
          </div>
        </div>

        {/* Savings Card */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <TrendingDown className="w-6 h-6 text-emerald-600" />
            <h2 className="text-xl font-bold text-gray-900">Savings Card</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl p-5 border-2 border-gray-200">
              <div className="text-sm font-medium text-gray-600 mb-2">Professional Cost</div>
              <div className="text-3xl font-bold text-red-600">${project.savings.pro}</div>
            </div>
            <div className="bg-emerald-50 rounded-xl p-5 border-2 border-emerald-200">
              <div className="text-sm font-medium text-emerald-700 mb-2">DIY Cost</div>
              <div className="text-3xl font-bold text-emerald-900">${project.savings.diy}</div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-gray-700">You Save</span>
              <span className="text-4xl font-bold text-emerald-600">${savings}</span>
            </div>
            <div className="text-sm text-emerald-700 font-medium mt-1">
              {savingsPercent}% less than hiring a professional
            </div>
          </div>
        </div>

        {/* Tools Checklist */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Required Tools</h2>
          <div className="space-y-3">
            {project.tools_list.map((tool, index) => {
              const toolId = index + 1;
              const isOwned = ownedTools.includes(toolId);
              return (
                <div
                  key={toolId}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                    isOwned
                      ? 'bg-emerald-50 border-emerald-200'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <button
                    onClick={() => toggleTool(toolId)}
                    disabled={!canEdit}
                    className="flex-shrink-0"
                  >
                    {isOwned ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                    ) : (
                      <Circle className="w-6 h-6 text-gray-300 hover:text-emerald-600 transition-colors" />
                    )}
                  </button>
                  <span
                    className={`flex-1 font-medium ${
                      isOwned ? 'text-emerald-800 line-through' : 'text-gray-900'
                    }`}
                  >
                    {tool}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step-by-Step Instructions */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Step-by-Step Instructions</h2>
            <div className="flex items-center gap-3">
              {canEdit && (
                <button
                  type="button"
                  onClick={async () => {
                    if (!project.title?.trim()) {
                      alert('Please name the project first.');
                      return;
                    }

                    setIsGeneratingSteps(true);
                    try {
                      const steps = await generateSteps(project.title.trim());
                      setProject((prev) => (prev ? { ...prev, steps_list: steps } : prev));
                      setCompletedSteps([]);
                    } catch (err) {
                      console.error('Error generating steps:', err);
                      alert('Failed to generate steps. Please try again.');
                    } finally {
                      setIsGeneratingSteps(false);
                    }
                  }}
                  disabled={isGeneratingSteps}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  <Sparkles className="w-5 h-5" />
                  {isGeneratingSteps ? 'Generating…' : '✨ Auto-Generate Steps'}
                </button>
              )}
              <div className="text-sm font-medium text-emerald-600">
                {completedSteps.length}/{project.steps_list.length} completed
              </div>
            </div>
          </div>
          <div className="mb-4">
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-emerald-600 h-full transition-all duration-300 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          <div className="space-y-4">
            {project.steps_list.map((step, index) => {
              const stepId = index + 1;
              const isCompleted = completedSteps.includes(stepId);
              return (
                <div
                  key={stepId}
                  className={`flex gap-4 p-4 rounded-xl border-2 transition-all ${
                    isCompleted
                      ? 'bg-emerald-50 border-emerald-200'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <button
                    onClick={() => toggleStep(stepId)}
                    disabled={!canEdit}
                    className="flex-shrink-0 mt-1"
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                    ) : (
                      <Circle className="w-6 h-6 text-gray-300 hover:text-emerald-600 transition-colors" />
                    )}
                  </button>
                  <div className="flex-1">
                    <div className="flex items-start gap-2 mb-1">
                      <span className="font-semibold text-gray-700">Step {stepId}:</span>
                    </div>
                    {isGuestViewer ? (
                      <p className={`${isCompleted ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                        {step}
                      </p>
                    ) : (
                      <input
                        value={step}
                        onChange={(e) => {
                          const next = e.target.value;
                          setProject((prev) => {
                            if (!prev) return prev;
                            const steps = [...prev.steps_list];
                            steps[index] = next;
                            return { ...prev, steps_list: steps };
                          });
                        }}
                        className={`w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                          isCompleted ? 'line-through text-gray-500' : ''
                        }`}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
