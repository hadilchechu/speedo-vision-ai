-- Supabase hardening checklist for Speedo Vision AI.
-- Run these in the Supabase SQL editor after creating the `projects` table and `video` bucket.

alter table public.projects enable row level security;

drop policy if exists "Users can read their own projects" on public.projects;
create policy "Users can read their own projects"
on public.projects
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert their own projects" on public.projects;
create policy "Users can insert their own projects"
on public.projects
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own projects" on public.projects;
create policy "Users can update their own projects"
on public.projects
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own projects" on public.projects;
create policy "Users can delete their own projects"
on public.projects
for delete
to authenticated
using (auth.uid() = user_id);

-- Storage object policies assume the video object path starts with the user's auth id:
--   {user_id}/{project_id}/{random_file_id}.mp4
-- For stronger privacy, keep the bucket private and replace public URLs with signed URLs.

drop policy if exists "Users can upload videos to their own folder" on storage.objects;
create policy "Users can upload videos to their own folder"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'video'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can read videos from their own folder" on storage.objects;
create policy "Users can read videos from their own folder"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'video'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can replace videos in their own folder" on storage.objects;
create policy "Users can replace videos in their own folder"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'video'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'video'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can delete videos from their own folder" on storage.objects;
create policy "Users can delete videos from their own folder"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'video'
  and (storage.foldername(name))[1] = auth.uid()::text
);
