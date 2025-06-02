-- Create todos table for RxDB sync
-- Based on RxDB Supabase example: https://github.com/pubkey/rxdb/tree/master/examples/supabase

-- Create the todos table
CREATE TABLE IF NOT EXISTS public.todos (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    completed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    replication_revision TEXT NOT NULL,
    deleted BOOLEAN DEFAULT false
);

-- Create index on updated_at for efficient replication queries
CREATE INDEX IF NOT EXISTS todos_updated_at_idx ON public.todos(updated_at);

-- Create index on completed for filtering
CREATE INDEX IF NOT EXISTS todos_completed_idx ON public.todos(completed);

-- Enable Row Level Security (RLS)
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for authenticated users
-- You may want to customize this based on your authentication requirements
CREATE POLICY "Allow all operations for authenticated users" ON public.todos
FOR ALL USING (auth.role() = 'authenticated');

-- Alternative: Allow all operations for now (less secure, for development)
CREATE POLICY "Allow all operations for development" ON public.todos
FOR ALL USING (true);

-- Create function to automatically update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at on row changes
CREATE TRIGGER update_todos_updated_at 
    BEFORE UPDATE ON public.todos 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable realtime for the todos table
ALTER PUBLICATION supabase_realtime ADD TABLE public.todos; 