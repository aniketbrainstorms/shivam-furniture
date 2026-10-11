create extension if not exists pgcrypto;

-- ---------- tables ----------
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) > 0),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  cover_path text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) > 0),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  category_id uuid references public.categories(id) on delete restrict,
  rooms text[] not null default '{}' check (rooms <@ array['bedroom','living','dining','study','kids']::text[]),
  material text not null default '',
  size_label text,
  availability text check (availability in ('in_showroom','made_to_order','ready_in_days')),
  ready_days int check (ready_days is null or ready_days > 0),
  customisable boolean not null default false,
  dimensions text,
  finishes jsonb not null default '[]'::jsonb,
  good_to_know text,
  status text not null default 'draft' check (status in ('draft','published','unpublished')),
  published_once boolean not null default false,
  featured boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint publish_requires_fields check (
    status <> 'published' or (
      btrim(material) <> '' and availability is not null and category_id is not null
      and (availability <> 'ready_in_days' or ready_days is not null)
    )
  )
);
create index products_category_idx on public.products (category_id);

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  path text not null,
  alt text not null default '',
  is_styled boolean not null default false,
  sort_order int not null default 0
);
create index product_images_product_idx on public.product_images (product_id, sort_order);

create table public.site_settings (
  id int primary key check (id = 1),
  phone text not null,
  phone_display text not null,
  address text not null,
  locality text,
  region text,
  postal_code text,
  maps_url text,
  gbp_url text,
  hours text,
  opening_hours text[] not null default '{}',
  delivery_text text,
  warranty_text text,
  years_text text,
  workshop_photos jsonb not null default '[]'::jsonb
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  body text not null,
  source text not null check (source in ('google','whatsapp')),
  visible boolean not null default true,
  sort_order int not null default 0
);

create table public.custom_gallery (
  id uuid primary key default gen_random_uuid(),
  path text not null,
  caption text not null default '',
  visible boolean not null default true,
  sort_order int not null default 0
);

-- ---------- guards ----------
create function public.products_guard() returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  if tg_op = 'UPDATE' then
    if old.published_once then
      if new.slug <> old.slug then
        raise exception 'Slug is locked once a piece has been published';
      end if;
      if new.category_id is distinct from old.category_id then
        raise exception 'Category is locked once a piece has been published';
      end if;
    end if;
  end if;
  if new.status = 'published' then new.published_once = true; end if;
  return new;
end $$;
create trigger products_guard_trg before insert or update on public.products
  for each row execute function public.products_guard();

create function public.categories_guard() returns trigger language plpgsql as $$
begin
  if tg_op = 'UPDATE' then
    if new.slug <> old.slug then
      raise exception 'Category slug cannot be changed (it would break product links)';
    end if;
  end if;
  return new;
end $$;
create trigger categories_guard_trg before update on public.categories
  for each row execute function public.categories_guard();

-- ---------- row level security ----------
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.site_settings enable row level security;
alter table public.reviews enable row level security;
alter table public.custom_gallery enable row level security;

create policy admin_all on public.categories for all to authenticated using (true) with check (true);
create policy admin_all on public.products for all to authenticated using (true) with check (true);
create policy admin_all on public.product_images for all to authenticated using (true) with check (true);
create policy admin_all on public.site_settings for all to authenticated using (true) with check (true);
create policy admin_all on public.reviews for all to authenticated using (true) with check (true);
create policy admin_all on public.custom_gallery for all to authenticated using (true) with check (true);

create policy public_read on public.categories for select to anon using (true);
create policy public_read on public.products for select to anon using (status = 'published');
create policy public_read on public.product_images for select to anon using (
  exists (select 1 from public.products p where p.id = product_id and p.status = 'published')
);
create policy public_read on public.site_settings for select to anon using (true);
create policy public_read on public.reviews for select to anon using (visible);
create policy public_read on public.custom_gallery for select to anon using (visible);

-- ---------- storage ----------
insert into storage.buckets (id, name, public) values ('images', 'images', true) on conflict (id) do nothing;
create policy "admin write images" on storage.objects for all to authenticated
  using (bucket_id = 'images') with check (bucket_id = 'images');

-- ---------- seed (editable later in the admin) ----------
insert into public.categories (name, slug, sort_order) values
  ('Beds', 'beds', 1), ('Sofas', 'sofas', 2), ('Dining', 'dining', 3),
  ('Storage', 'storage', 4), ('Study', 'study', 5);

insert into public.site_settings (id, phone, phone_display, address, locality, region, postal_code, maps_url) values (
  1, '917002023649', '+91 70020 23649',
  'Ganesh Turning, Narakasur Path, opposite Bharat Petrol Pump, Kahilipara, Guwahati, Assam 781019',
  'Guwahati', 'Assam', '781019',
  'https://www.google.com/maps/search/?api=1&query=Shivam+Furniture+Ganesh+Turning+Narakasur+Path+Kahilipara+Guwahati+Assam+781019'
);
