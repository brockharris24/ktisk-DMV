/*
  # Create Projects Table for Ktisk Platform

  ## Overview
  This migration creates the core projects table for storing user DIY projects.

  ## New Tables
  
  ### `projects`
  - `id` (uuid, primary key) - Unique project identifier
  - `user_id` (uuid, foreign key) - Links to auth.users
  - `project_title` (text) - Name of the DIY project
  - `status` (text) - Current status: 'in_progress' or 'completed'
  - `difficulty` (text) - Difficulty level: 'easy', 'medium', or 'hard'
  - `time_estimate` (text) - Estimated completion time
  - `professional_cost` (integer) - Estimated professional service cost in dollars
  - `diy_cost` (integer) - Estimated DIY cost in dollars
  - `steps_json` (jsonb) - Array of step objects with instructions
  - `tools_json` (jsonb) - Array of tool/material objects with prices
  - `completed_steps` (jsonb) - Array of completed step IDs
  - `owned_items` (jsonb) - Array of item IDs user already owns
  - `created_at` (timestamptz) - Timestamp of project creation
  - `updated_at` (timestamptz) - Timestamp of last update

  ## Security
  
  1. Enable Row Level Security (RLS) on projects table
  2. Users can only view their own projects
  3. Users can only insert projects for themselves
  4. Users can only update their own projects
  5. Users can only delete their own projects
*/

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  project_title text NOT NULL,
  status text DEFAULT 'in_progress' NOT NULL,
  difficulty text NOT NULL,
  time_estimate text NOT NULL,
  professional_cost integer NOT NULL,
  diy_cost integer NOT NULL,
  steps_json jsonb DEFAULT '[]'::jsonb NOT NULL,
  tools_json jsonb DEFAULT '[]'::jsonb NOT NULL,
  completed_steps jsonb DEFAULT '[]'::jsonb NOT NULL,
  owned_items jsonb DEFAULT '[]'::jsonb NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own projects
CREATE POLICY "Users can view own projects"
  ON projects
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own projects
CREATE POLICY "Users can insert own projects"
  ON projects
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own projects
CREATE POLICY "Users can update own projects"
  ON projects
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own projects
CREATE POLICY "Users can delete own projects"
  ON projects
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS projects_user_id_idx ON projects(user_id);
CREATE INDEX IF NOT EXISTS projects_status_idx ON projects(status);