-- Parts Inventory Table
create table if not exists parts_inventory (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  part_num text not null,
  color_id int not null,
  quantity int default 1,
  
  -- Metadata for easier display without joining every time, validated by app logic
  name text,
  img_url text,

  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, part_num, color_id)
);

-- Build History Table
create table if not exists build_history (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  set_id text not null,
  name text not null,
  match_score float not null,
  instruction_url text,
  num_parts int, 
  set_img_url text,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table parts_inventory enable row level security;
alter table build_history enable row level security;

-- Policies (Simple: Users can only see/edit their own data)
create policy "Users can view own parts" on parts_inventory for select using (auth.uid() = user_id);
create policy "Users can insert own parts" on parts_inventory for insert with check (auth.uid() = user_id);
create policy "Users can update own parts" on parts_inventory for update using (auth.uid() = user_id);
create policy "Users can delete own parts" on parts_inventory for delete using (auth.uid() = user_id);

create policy "Users can view own history" on build_history for select using (auth.uid() = user_id);
create policy "Users can insert own history" on build_history for insert with check (auth.uid() = user_id);
