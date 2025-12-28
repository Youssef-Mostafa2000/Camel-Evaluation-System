import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  role: 'visitor' | 'owner' | 'expert' | 'admin';
  full_name: string;
  phone?: string;
  organization?: string;
  created_at: string;
  updated_at: string;
};

export type Camel = {
  id: string;
  owner_id: string;
  name: string;
  breed: string;
  gender: 'male' | 'female';
  age: number;
  notes?: string;
  created_at: string;
  updated_at: string;
};

export type CamelImage = {
  id: string;
  camel_id: string;
  image_url: string;
  uploaded_at: string;
};

export type Evaluation = {
  id: string;
  camel_id: string;
  image_id: string;
  overall_score: number;
  head_score: number;
  neck_score: number;
  hump_score: number;
  body_score: number;
  legs_score: number;
  evaluation_type: 'ai' | 'expert';
  expert_id?: string;
  notes?: string;
  created_at: string;
};
