export interface ProjectStep {
  id: number;
  instruction: string;
  tips?: string;
}

export interface ProjectTool {
  id: number;
  name: string;
  price: number;
  category: 'tool' | 'material';
  amazon_search: string;
}

export interface Project {
  id?: string;
  user_id?: string;
  project_title: string;
  is_public: boolean;
  difficulty: 'easy' | 'medium' | 'hard';
  time_estimate: string;
  professional_cost: number;
  diy_cost: number;
  steps: ProjectStep[];
  tools: ProjectTool[];
  completed_steps?: number[];
  owned_items?: number[];
  status?: string;
  created_at?: string;
  updated_at?: string;
}
