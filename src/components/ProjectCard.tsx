import { Clock, TrendingDown, BarChart3 } from 'lucide-react';
import type { Project } from '../types/project';

interface ProjectCardProps {
  project: Project;
  onStartProject: () => void;
}

export function ProjectCard({ project, onStartProject }: ProjectCardProps) {
  const savings = project.professional_cost - project.diy_cost;
  const savingsPercent = Math.round((savings / project.professional_cost) * 100);

  const difficultyColors = {
    easy: 'bg-green-100 text-green-800 border-green-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    hard: 'bg-red-100 text-red-800 border-red-200',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-8 text-white">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              {project.project_title}
            </h1>
            <div className="flex flex-wrap gap-3">
              <span
                className={`px-4 py-2 rounded-full text-sm font-semibold border-2 ${
                  difficultyColors[project.difficulty]
                }`}
              >
                {project.difficulty.charAt(0).toUpperCase() + project.difficulty.slice(1)}
              </span>
            </div>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-emerald-50 rounded-xl p-5 border-2 border-emerald-100">
                <div className="flex items-center gap-3 mb-2">
                  <Clock className="w-5 h-5 text-emerald-600" />
                  <span className="font-semibold text-gray-700">Time Needed</span>
                </div>
                <div className="text-2xl font-bold text-emerald-900">
                  {project.time_estimate}
                </div>
              </div>

              <div className="bg-emerald-50 rounded-xl p-5 border-2 border-emerald-100">
                <div className="flex items-center gap-3 mb-2">
                  <TrendingDown className="w-5 h-5 text-emerald-600" />
                  <span className="font-semibold text-gray-700">You Save</span>
                </div>
                <div className="text-2xl font-bold text-emerald-900">
                  ${savings}
                </div>
                <div className="text-sm text-emerald-700 font-medium">
                  {savingsPercent}% less than hiring
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-5 border-2 border-gray-100">
                <div className="flex items-center gap-3 mb-2">
                  <BarChart3 className="w-5 h-5 text-gray-600" />
                  <span className="font-semibold text-gray-700">Cost Breakdown</span>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-gray-600">
                    Professional: <span className="font-semibold">${project.professional_cost}</span>
                  </div>
                  <div className="text-sm text-emerald-600">
                    DIY: <span className="font-semibold">${project.diy_cost}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
              <h3 className="font-semibold text-blue-900 mb-2">What You'll Get</h3>
              <ul className="space-y-2 text-blue-800">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>{project.steps.length} detailed step-by-step instructions</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>Complete list of {project.tools.length} tools and materials</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>Professional tips and safety guidance</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>Track your progress as you work</span>
                </li>
              </ul>
            </div>

            <button
              onClick={onStartProject}
              className="w-full py-4 bg-emerald-600 text-white font-semibold text-lg rounded-xl hover:bg-emerald-700 transition-colors min-h-[56px]"
            >
              Start This Project
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
