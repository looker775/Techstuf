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
