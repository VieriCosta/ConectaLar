insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('property-images', 'property-images', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = true, file_size_limit = 5242880, allowed_mime_types = array['image/jpeg','image/png','image/webp'];

drop policy if exists "owners upload property images" on storage.objects;
create policy "owners upload property images" on storage.objects for insert to authenticated with check (
  bucket_id = 'property-images' and (storage.foldername(name))[1] = auth.uid()::text
);
drop policy if exists "owners delete property images" on storage.objects;
create policy "owners delete property images" on storage.objects for delete to authenticated using (
  bucket_id = 'property-images' and (storage.foldername(name))[1] = auth.uid()::text
);
