-- Enable Row Level Security on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view their own data"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own data"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Jobs table policies
CREATE POLICY "Anyone authenticated can view jobs"
  ON jobs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create jobs"
  ON jobs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own jobs"
  ON jobs FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own jobs"
  ON jobs FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- Job criteria policies
CREATE POLICY "Anyone authenticated can view criteria"
  ON job_criteria FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Job owners can manage criteria"
  ON job_criteria FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM jobs
      WHERE jobs.id = job_criteria.job_id
      AND jobs.created_by = auth.uid()
    )
  );

-- Resumes table policies
CREATE POLICY "Anyone authenticated can view resumes"
  ON resumes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can upload resumes"
  ON resumes FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update resumes"
  ON resumes FOR UPDATE
  TO authenticated
  USING (true);

-- Candidates table policies
CREATE POLICY "Anyone authenticated can view candidates"
  ON candidates FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can create candidates"
  ON candidates FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "System can update candidates"
  ON candidates FOR UPDATE
  TO authenticated
  USING (true);

-- Analyses table policies
CREATE POLICY "Anyone authenticated can view analyses"
  ON analyses FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can create analyses"
  ON analyses FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "System can update analyses"
  ON analyses FOR UPDATE
  TO authenticated
  USING (true);

-- Activity logs policies
CREATE POLICY "Users can view their own activity"
  ON activity_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can create activity logs"
  ON activity_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create storage bucket for resumes (run this in Supabase dashboard or via SQL)
INSERT INTO storage.buckets (id, name, public)
VALUES ('resumes', 'resumes', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for resumes bucket
CREATE POLICY "Anyone authenticated can upload resumes"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'resumes');

CREATE POLICY "Anyone can view resumes"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'resumes');

CREATE POLICY "Authenticated users can delete resumes"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'resumes');
