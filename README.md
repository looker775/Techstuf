# Techstuf storefront

This is a standalone static storefront for Techstuf (Netlify + Supabase + PayPal).

## Quick start
- Open `index.html` in a browser to preview.
- Deploy the repo on Netlify with publish directory set to `.`.

## Supabase connection
Supabase config is now stored in `config.js`. Update:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

Suggested `products` table columns:
- `id` (uuid or text)
- `name` (text)
- `category` (text)
- `price` (numeric)
- `rating` (numeric)
- `badge` (text)
- `description` (text)
- `image_hue` (numeric)
- `active` (boolean)

Enable RLS and add a public read policy for active products.

## Auth setup (buyers, admins, owner)
The landing page includes buyer registration/login, admin request/login, and owner login.

Run this SQL in Supabase SQL Editor:

```sql
create extension if not exists "pgcrypto";

create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text unique,
  role text default 'buyer',
  created_at timestamptz default now()
);

create table public.admin_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  email text not null,
  reason text,
  status text default 'pending',
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;
alter table public.admin_requests enable row level security;

create policy "Users can view own profile"
on public.profiles for select
using (auth.uid() = id);

create policy "Users can request admin"
on public.admin_requests for insert
with check (auth.uid() = user_id);

create policy "Users can view own admin request"
on public.admin_requests for select
using (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'buyer')
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();
```

Owner setup:
- Create the owner account in Supabase Auth (Authentication → Users → Add user).
- Then set the owner role in SQL:

```sql
update public.profiles
set role = 'owner'
where email = 'kaliwill3@gmail.com';
```

Admin/Owner login page:
- Visit `/kali` on your Netlify site for admin + owner login.

Admin approval:
- After an admin requests access, set their role to `admin`:

```sql
update public.profiles
set role = 'admin'
where email = 'admin@example.com';

update public.admin_requests
set status = 'approved'
where email = 'admin@example.com';
```

Owner dashboard approvals require these additional RLS policies:

```sql
create policy "Owner can view profiles"
on public.profiles for select
using (
  auth.uid() = id
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'owner'
  )
);

create policy "Owner can update profiles"
on public.profiles for update
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'owner'
  )
);

create policy "Owner can view admin requests"
on public.admin_requests for select
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'owner'
  )
);

create policy "Owner can update admin requests"
on public.admin_requests for update
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'owner'
  )
);
```

## Publishing permissions (products + categories + subcategories)
Run this SQL to add permission fields and catalog tables:

```sql
alter table public.profiles
  add column if not exists is_active boolean default true,
  add column if not exists can_publish_products boolean default false,
  add column if not exists can_manage_categories boolean default false,
  add column if not exists can_manage_subcategories boolean default false;

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  description text,
  active boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.subcategories (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete cascade,
  name text not null,
  description text,
  active boolean default true,
  created_at timestamptz default now(),
  unique (category_id, name)
);

alter table public.products
  add column if not exists category_id uuid references public.categories(id),
  add column if not exists subcategory_id uuid references public.subcategories(id),
  add column if not exists published_by uuid references auth.users(id);

alter table public.categories enable row level security;
alter table public.subcategories enable row level security;
```

Allow owner + approved admins to manage catalog:

```sql
create policy "Owner can manage products"
on public.products for all
using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'owner')
)
with check (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'owner')
);

create policy "Admins can manage products"
on public.products for all
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
      and p.is_active = true
      and p.can_publish_products = true
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
      and p.is_active = true
      and p.can_publish_products = true
  )
);

create policy "Owner can manage categories"
on public.categories for all
using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'owner')
)
with check (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'owner')
);

create policy "Admins can manage categories"
on public.categories for all
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
      and p.is_active = true
      and p.can_manage_categories = true
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
      and p.is_active = true
      and p.can_manage_categories = true
  )
);

create policy "Owner can manage subcategories"
on public.subcategories for all
using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'owner')
)
with check (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'owner')
);

create policy "Admins can manage subcategories"
on public.subcategories for all
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
      and p.is_active = true
      and p.can_manage_subcategories = true
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
      and p.is_active = true
      and p.can_manage_subcategories = true
  )
);
```

Admin console:
- Visit `/kali/admin/` after your admin account is approved.

## PayPal setup
Frontend (public):
- Set `PAYPAL_CLIENT_ID` inside `app.js` to your PayPal client ID.

Backend (Netlify Functions):
- Add these environment variables in Netlify:
  - `PAYPAL_CLIENT_ID`
  - `PAYPAL_CLIENT_SECRET`
  - `PAYPAL_ENV` (`sandbox` or `live`)

The PayPal buttons call Netlify Functions at:
- `/.netlify/functions/paypal-create-order`
- `/.netlify/functions/paypal-capture-order`
