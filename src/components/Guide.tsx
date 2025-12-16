import { useState, useEffect } from 'react';
import { CheckCircle2, Circle, Package, ClipboardList, ArrowLeft, ExternalLink, Home } from 'lucide-react';
import type { Project, ProjectStep, ProjectTool } from '../types/project';
import { supabase } from '../lib/supabase';

interface GuideProps {
  project: Project;
  onBack: () => void;
  onGoHome: () => void;
}

export function Guide({ project, onBack, onGoHome }: GuideProps) {
  const [activeTab, setActiveTab] = useState<'steps' | 'supplies'>('steps');
  const [completedSteps, setCompletedSteps] = useState<number[]>(project.completed_steps || []);
  const [ownedItems, setOwnedItems] = useState<number[]>(project.owned_items || []);
  const [saving, setSaving] = useState(false);

  const progress = (completedSteps.length / project.steps.length) * 100;
  const totalCost = project.tools
    .filter((tool) => !ownedItems.includes(tool.id))
    .reduce((sum, tool) => sum + tool.price, 0);

  useEffect(() => {
    if (project.id) {
      updateProject();
    }
  }, [completedSteps, ownedItems]);

  const updateProject = async () => {
    if (!project.id || saving) return;

    setSaving(true);
    try {
      const allStepsCompleted = completedSteps.length === project.steps.length;
      await supabase
        .from('projects')
        .update({
          completed_steps: completedSteps,
          owned_items: ownedItems,
          status: allStepsCompleted ? 'completed' : 'in_progress',
          updated_at: new Date().toISOString(),
        })
        .eq('id', project.id);
    } catch (error) {
      console.error('Error updating project:', error);
    } finally {
      setSaving(false);
    }
  };

  const toggleStep = (stepId: number) => {
    setCompletedSteps((prev) =>
      prev.includes(stepId) ? prev.filter((id) => id !== stepId) : [...prev, stepId]
    );
  };

  const toggleItem = (itemId: number) => {
    setOwnedItems((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium"
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </button>
            <button
              onClick={onGoHome}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium"
            >
              <Home className="w-5 h-5" />
              Home
            </button>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{project.project_title}</h1>
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Progress</span>
              <span className="text-sm font-bold text-emerald-600">
                {completedSteps.length}/{project.steps.length} steps
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-emerald-600 h-full transition-all duration-300 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('steps')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-semibold transition-colors min-h-[48px] ${
                activeTab === 'steps'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <ClipboardList className="w-5 h-5" />
              Steps
            </button>
            <button
              onClick={() => setActiveTab('supplies')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-semibold transition-colors min-h-[48px] ${
                activeTab === 'supplies'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Package className="w-5 h-5" />
              Supply List
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {activeTab === 'steps' ? (
          <div className="space-y-4">
            {project.steps.map((step: ProjectStep) => {
              const isCompleted = completedSteps.includes(step.id);
              return (
                <div
                  key={step.id}
                  className={`bg-white rounded-xl p-6 shadow-sm border-2 transition-all ${
                    isCompleted ? 'border-emerald-200 bg-emerald-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex gap-4">
                    <button
                      onClick={() => toggleStep(step.id)}
                      className="flex-shrink-0 mt-1"
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-7 h-7 text-emerald-600" />
                      ) : (
                        <Circle className="w-7 h-7 text-gray-300 hover:text-emerald-600 transition-colors" />
                      )}
                    </button>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <h3
                          className={`font-semibold text-lg ${
                            isCompleted ? 'line-through text-gray-500' : 'text-gray-900'
                          }`}
                        >
                          Step {step.id}
                        </h3>
                      </div>
                      <p
                        className={`mb-3 ${
                          isCompleted ? 'line-through text-gray-500' : 'text-gray-700'
                        }`}
                      >
                        {step.instruction}
                      </p>
                      {step.tips && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <p className="text-sm text-blue-800">
                            <span className="font-semibold">Tip:</span> {step.tips}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div>
            <div className="bg-white rounded-xl p-6 shadow-sm border-2 border-emerald-200 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    Estimated DIY Cost
                  </h3>
                  <p className="text-sm text-gray-600">
                    Total for items you need to purchase
                  </p>
                </div>
                <div className="text-3xl font-bold text-emerald-600">${totalCost}</div>
              </div>
            </div>

            <div className="space-y-4">
              {project.tools.map((tool: ProjectTool) => {
                const isOwned = ownedItems.includes(tool.id);
                return (
                  <div
                    key={tool.id}
                    className={`bg-white rounded-xl p-5 shadow-sm border-2 transition-all ${
                      isOwned ? 'border-gray-200 opacity-60' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-start gap-3 mb-2">
                          <input
                            type="checkbox"
                            checked={isOwned}
                            onChange={() => toggleItem(tool.id)}
                            className="mt-1 w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                          />
                          <div className="flex-1">
                            <h4
                              className={`font-semibold text-gray-900 mb-1 ${
                                isOwned ? 'line-through' : ''
                              }`}
                            >
                              {tool.name}
                            </h4>
                            <div className="flex items-center gap-3 flex-wrap">
                              <span className="text-sm font-medium text-gray-600">
                                ${tool.price}
                              </span>
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  tool.category === 'tool'
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-amber-100 text-amber-700'
                                }`}
                              >
                                {tool.category}
                              </span>
                            </div>
                          </div>
                        </div>
                        {isOwned && (
                          <p className="text-sm text-gray-500 ml-8">
                            Already have this
                          </p>
                        )}
                      </div>
                      {!isOwned && (
                        <a
                          href={`https://www.amazon.com/s?k=${encodeURIComponent(
                            tool.amazon_search
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white font-semibold rounded-lg hover:bg-amber-600 transition-colors text-sm whitespace-nowrap min-h-[40px]"
                        >
                          Buy on Amazon
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
