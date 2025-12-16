import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2, Circle, Wrench, TrendingDown, Save } from 'lucide-react';
import OpenAI from 'openai';
import { supabaseClient } from '../supabaseClient';

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
  const searchTerm = (location.state as { searchTerm?: string })?.searchTerm;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [project, setProject] = useState<ProjectData | null>(null);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [ownedTools, setOwnedTools] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!searchTerm) {
      setError('No search term provided');
      setLoading(false);
      return;
    }

    const generateProject = async () => {
      setLoading(true);
      setError(null);

      try {
        const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
        if (!apiKey) {
          throw new Error('OpenAI API key not found in environment variables');
        }

        const openai = new OpenAI({
          apiKey: apiKey,
          dangerouslyAllowBrowser: true,
        });

        const prompt = `Create a detailed DIY project plan for: "${searchTerm}"

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

    generateProject();
  }, [searchTerm]);

  const toggleStep = (stepId: number) => {
    setCompletedSteps((prev) =>
      prev.includes(stepId) ? prev.filter((id) => id !== stepId) : [...prev, stepId]
    );
  };

  const toggleTool = (toolId: number) => {
    setOwnedTools((prev) =>
      prev.includes(toolId) ? prev.filter((id) => id !== toolId) : [...prev, toolId]
    );
  };

  const handleSaveProject = async () => {
    if (!project) return;

    setSaving(true);
    try {
      // Get current user if authenticated
      const { data: { user } } = await supabaseClient.auth.getUser();

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
        difficulty: project.difficulty,
        professional_cost: project.savings.pro,
        diy_cost: project.savings.diy,
        steps_json: steps,
        tools_json: tools,
        completed_steps: completedSteps,
        owned_items: ownedTools,
        status: 'in_progress',
      };

      // Add user_id if user is authenticated
      if (user) {
        projectData.user_id = user.id;
      }

      console.log('Attempting to save:', projectData);

      try {
        const { error } = await supabaseClient
          .from('projects')
          .insert(projectData);

        if (error) throw error;

        alert('Project Saved!');
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
      setSaving(false);
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
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Generating Plan...</h2>
          <p className="text-gray-600">Creating your DIY project plan for "{searchTerm}"</p>
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
          </div>
          <button
            onClick={handleSaveProject}
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors min-h-[48px]"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Saving...' : 'Save Project'}
          </button>
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
              </div>
            </div>
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
            <div className="text-sm font-medium text-emerald-600">
              {completedSteps.length}/{project.steps_list.length} completed
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
                    <p
                      className={`${
                        isCompleted ? 'line-through text-gray-500' : 'text-gray-900'
                      }`}
                    >
                      {step}
                    </p>
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
