-- Create attractions table for Taiwan tourist attractions database
CREATE TABLE IF NOT EXISTS public.attractions (
  id BIGSERIAL PRIMARY KEY,
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  tags TEXT,
  suitable_for TEXT,
  additional_info JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_attractions_category ON public.attractions(category);
CREATE INDEX idx_attractions_location ON public.attractions(location);
CREATE INDEX idx_attractions_name ON public.attractions(name);
CREATE INDEX idx_attractions_additional_info ON public.attractions USING GIN (additional_info);

-- Enable RLS
ALTER TABLE public.attractions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all authenticated users to read attractions
CREATE POLICY "Allow authenticated users to read attractions"
  ON public.attractions
  FOR SELECT
  TO authenticated
  USING (true);

-- Create policy to allow authenticated users to insert attractions (for initial import)
CREATE POLICY "Allow authenticated users to insert attractions"
  ON public.attractions
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create policy to allow authenticated users to update attractions
CREATE POLICY "Allow authenticated users to update attractions"
  ON public.attractions
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.attractions TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE attractions_id_seq TO authenticated;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_attractions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_attractions_updated_at
  BEFORE UPDATE ON public.attractions
  FOR EACH ROW
  EXECUTE FUNCTION update_attractions_updated_at();
