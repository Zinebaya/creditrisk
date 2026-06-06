-- Supabase / PostgreSQL schema for Credit Risk Platform

CREATE TABLE IF NOT EXISTS users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text NOT NULL UNIQUE,
    password_hash text NOT NULL,
    role text NOT NULL DEFAULT 'user',
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS predictions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users(id) ON DELETE SET NULL,
    input_json jsonb NOT NULL,
    prediction text NOT NULL,
    probability numeric(5,4) NOT NULL,
    timestamp timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    action text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    subject text
);

-- Example RLS policy skeleton for Supabase
-- ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Users can read their own predictions" ON predictions
--     FOR SELECT USING (auth.uid() = user_id::text);
-- CREATE POLICY "Users can insert predictions" ON predictions
--     FOR INSERT WITH CHECK (auth.uid() = user_id::text);
