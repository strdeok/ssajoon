-- Create the profiles table for Nicknames
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
    nickname TEXT UNIQUE NOT NULL
);

-- Turn on RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow public read access to verify duplicates natively
CREATE POLICY "Allow public read access to profiles for deduplication" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Trigger to automatically insert row into profiles when auth.users is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, nickname)
  VALUES (new.id, new.raw_user_meta_data->>'nickname');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Create the problems table
CREATE TABLE public.problems (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    input_desc TEXT NOT NULL,
    output_desc TEXT NOT NULL,
    test_cases JSONB
);

-- Create the submissions table
CREATE TABLE public.submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users NOT NULL,
    problem_id TEXT REFERENCES public.problems NOT NULL,
    code TEXT NOT NULL,
    language TEXT NOT NULL,
    status TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Turn on Row Level Security
ALTER TABLE public.problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- Problems Policies (Everyone can read)
CREATE POLICY "Allow public read access to problems" ON public.problems FOR SELECT USING (true);
CREATE POLICY "Allow full access for local dev" ON public.problems FOR ALL USING (true); -- Useful for seeding/development

-- Submissions Policies (Auth required)
CREATE POLICY "Users can insert their own submissions" ON public.submissions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can read their own submissions" ON public.submissions FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Wait! We need a server to be able to READ/UPDATE submissions globally via service role. 
-- For MVP testing we can allow all access, otherwise Next.js background threads update using anon key matching RLS.
-- Since the Next.js API uses anon key, it must be allowed to update its own submissions:
CREATE POLICY "Users can update their own submissions" ON public.submissions FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Seed initial mock problems matching our MVP
INSERT INTO public.problems (id, title, description, input_desc, output_desc, test_cases) VALUES
  ('1', 'A + B', '두 수를 입력받아 합을 출력하시오.', '첫째 줄에 A와 B가 주어진다.', 'A+B를 출력한다.', '[{"input": "1 2\n", "output": "3\n"}, {"input": "4 7\n", "output": "11\n"}]'),
  ('2', 'Hello World', '''Hello World!''를 화면에 출력하시오.', '입력은 없습니다.', '''Hello World!''를 출력한다.', '[{"input": "", "output": "Hello World!\n"}]');
