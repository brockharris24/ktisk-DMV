# Ktisk - DIY Home Improvement Platform

A mobile-first web platform that empowers users to tackle home improvement projects themselves, saving money while learning valuable skills.

## Overview

Ktisk is the inverse of Thumbtack. Instead of hiring professionals, users search for tasks and receive comprehensive AI-generated guides to complete projects themselves, including step-by-step instructions and purchasing lists for tools and materials.

## Features

- **AI-Powered Project Generation**: Enter any home improvement task and get a complete DIY guide
- **Smart Cost Tracking**: See how much you save vs. hiring professionals
- **Progress Tracking**: Check off steps as you complete them
- **Supply List Management**: Mark items you already own and get Amazon links for items you need
- **Project Dashboard**: View all your active and completed projects in one place
- **Mobile-First Design**: Beautiful, responsive interface optimized for phones and tablets

## Tech Stack

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Supabase (Database + Authentication + Edge Functions)
- **AI**: OpenAI API (GPT-4o-mini)
- **Icons**: Lucide React

## Setup Instructions

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
Create a `.env` file based on `.env.example`:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. The database schema and Edge Functions are already deployed to your Supabase project.

4. Start the development server (handled automatically)

## How It Works

1. **Search**: User enters a home improvement task
2. **Generate**: AI creates a comprehensive project guide with:
   - Difficulty rating (Easy/Medium/Hard)
   - Time estimate
   - Cost comparison (Professional vs. DIY)
   - Step-by-step instructions
   - Complete supply list
3. **Execute**: User follows the guide, checking off steps and tracking progress
4. **Track**: All projects are saved to the dashboard for reference

## Key Components

- **Landing**: Search interface for finding projects
- **ProjectCard**: Displays project overview and savings calculator
- **Guide**: Main workspace with tabs for steps and supplies
- **Dashboard**: Tracks all active and completed projects
- **Auth**: Email/password authentication

## Database Schema

### projects table
- Project metadata (title, difficulty, time, costs)
- Steps and tools stored as JSON
- Progress tracking (completed steps, owned items)
- Row Level Security enabled for user privacy

## Features in Detail

### Smart Cost Calculator
- Real-time updates based on items you already own
- Shows savings percentage vs. professional services
- Tracks total DIY cost

### Progress Tracking
- Visual progress bar
- Checkbox-style step completion
- Strikethrough animation for completed steps
- Auto-save to database

### Supply List
- Categorized tools and materials
- Direct Amazon purchase links
- "I already have this" checkbox functionality
- Real-time cost recalculation

## Design Philosophy

- **Mobile-first**: Optimized for vertical scrolling and touch interfaces
- **High contrast**: Ensures readability on all screens
- **Green accents**: Represents savings and completion
- **Card-based UI**: Clean, modern aesthetic with ample white space
- **Accessibility**: 44px minimum button height, clear visual hierarchy

## Security

- Row Level Security (RLS) on all database tables
- Users can only access their own projects
- Authentication required for all project operations
- API keys secured in Edge Functions
