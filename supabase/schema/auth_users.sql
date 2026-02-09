-- Create a simple table for application users
create table if not exists public.app_users (
  id uuid default gen_random_uuid() primary key,
  username text not null unique,
  password text not null, -- Storing as plain text per user request for simplicity in this specific context (Not recommended for prod)
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Turn on RLS
alter table public.app_users enable row level security;

-- Allow read access to everyone (since we query it from client for this simple auth)
-- In a real app, we would use Supabase Auth, but this is a requested simple workaround.
create policy "Allow public read access"
  on public.app_users for select
  using (true);

-- Insert the default user if it doesn't exist
insert into public.app_users (username, password)
values ('SB', 'LegoAI')
on conflict (username) do nothing;
