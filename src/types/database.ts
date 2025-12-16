export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string
          user_id: string
          project_title: string
          status: string
          difficulty: string
          time_estimate: string
          professional_cost: number
          diy_cost: number
          steps_json: Json
          tools_json: Json
          completed_steps: Json
          owned_items: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          project_title: string
          status?: string
          difficulty: string
          time_estimate: string
          professional_cost: number
          diy_cost: number
          steps_json?: Json
          tools_json?: Json
          completed_steps?: Json
          owned_items?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          project_title?: string
          status?: string
          difficulty?: string
          time_estimate?: string
          professional_cost?: number
          diy_cost?: number
          steps_json?: Json
          tools_json?: Json
          completed_steps?: Json
          owned_items?: Json
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
