/*
  # Add Expert Scoring and Analytics Features

  1. New Tables
    - `expert_assignments`
      - `id` (uuid, primary key)
      - `camel_id` (uuid, references camels)
      - `expert_id` (uuid, references profiles)
      - `assigned_by` (uuid, references profiles)
      - `assigned_at` (timestamptz)
      - `status` (text) - pending, in_progress, completed
      - `notes` (text, optional)
    
    - `expert_evaluations`
      - `id` (uuid, primary key)
      - `assignment_id` (uuid, references expert_assignments)
      - `camel_id` (uuid, references camels)
      - `expert_id` (uuid, references profiles)
      - `overall_score` (numeric)
      - `head_score` (numeric)
      - `neck_score` (numeric)
      - `hump_score` (numeric)
      - `body_score` (numeric)
      - `legs_score` (numeric)
      - `notes` (text, optional)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on new tables
    - Admins can assign experts
    - Experts can view their assignments
    - Experts can submit evaluations for assigned camels
    - Owners can view expert evaluations of their camels

  3. Indexes
    - Index on assignment status
    - Index on expert_id for quick lookups
    - Index on camel_id for analytics queries
*/

-- Create expert_assignments table
CREATE TABLE IF NOT EXISTS expert_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  camel_id uuid NOT NULL REFERENCES camels(id) ON DELETE CASCADE,
  expert_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_by uuid NOT NULL REFERENCES profiles(id),
  assigned_at timestamptz DEFAULT now(),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  notes text,
  UNIQUE(camel_id, expert_id)
);

-- Create expert_evaluations table
CREATE TABLE IF NOT EXISTS expert_evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES expert_assignments(id) ON DELETE CASCADE,
  camel_id uuid NOT NULL REFERENCES camels(id) ON DELETE CASCADE,
  expert_id uuid NOT NULL REFERENCES profiles(id),
  overall_score numeric NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
  head_score numeric NOT NULL CHECK (head_score >= 0 AND head_score <= 100),
  neck_score numeric NOT NULL CHECK (neck_score >= 0 AND neck_score <= 100),
  hump_score numeric NOT NULL CHECK (hump_score >= 0 AND hump_score <= 100),
  body_score numeric NOT NULL CHECK (body_score >= 0 AND body_score <= 100),
  legs_score numeric NOT NULL CHECK (legs_score >= 0 AND legs_score <= 100),
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE expert_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE expert_evaluations ENABLE ROW LEVEL SECURITY;

-- Expert assignments policies
CREATE POLICY "Admins can manage assignments"
  ON expert_assignments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Experts can view their assignments"
  ON expert_assignments FOR SELECT
  TO authenticated
  USING (auth.uid() = expert_id);

CREATE POLICY "Owners can view assignments for their camels"
  ON expert_assignments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM camels
      WHERE camels.id = expert_assignments.camel_id
      AND camels.owner_id = auth.uid()
    )
  );

-- Expert evaluations policies
CREATE POLICY "Experts can view their evaluations"
  ON expert_evaluations FOR SELECT
  TO authenticated
  USING (auth.uid() = expert_id);

CREATE POLICY "Experts can insert evaluations for assigned camels"
  ON expert_evaluations FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = expert_id
    AND EXISTS (
      SELECT 1 FROM expert_assignments
      WHERE expert_assignments.id = expert_evaluations.assignment_id
      AND expert_assignments.expert_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all expert evaluations"
  ON expert_evaluations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Owners can view expert evaluations of their camels"
  ON expert_evaluations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM camels
      WHERE camels.id = expert_evaluations.camel_id
      AND camels.owner_id = auth.uid()
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_expert_assignments_expert_id ON expert_assignments(expert_id);
CREATE INDEX IF NOT EXISTS idx_expert_assignments_camel_id ON expert_assignments(camel_id);
CREATE INDEX IF NOT EXISTS idx_expert_assignments_status ON expert_assignments(status);
CREATE INDEX IF NOT EXISTS idx_expert_evaluations_expert_id ON expert_evaluations(expert_id);
CREATE INDEX IF NOT EXISTS idx_expert_evaluations_camel_id ON expert_evaluations(camel_id);
CREATE INDEX IF NOT EXISTS idx_expert_evaluations_assignment_id ON expert_evaluations(assignment_id);

-- Function to auto-update assignment status
CREATE OR REPLACE FUNCTION update_assignment_status()
RETURNS trigger AS $$
BEGIN
  UPDATE expert_assignments
  SET status = 'completed'
  WHERE id = NEW.assignment_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update assignment status when evaluation is submitted
DROP TRIGGER IF EXISTS on_expert_evaluation_created ON expert_evaluations;
CREATE TRIGGER on_expert_evaluation_created
  AFTER INSERT ON expert_evaluations
  FOR EACH ROW EXECUTE FUNCTION update_assignment_status();