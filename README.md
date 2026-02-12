# Techstuf storefront

This is a standalone static storefront for Techstuf (Netlify + Supabase).

## Quick start
- Open `techstuf/index.html` in a browser to preview.
- Deploy the `techstuf` folder on Netlify with publish directory set to `techstuf`.

## Supabase connection
Fill in `SUPABASE_URL` and `SUPABASE_ANON_KEY` inside `techstuf/app.js` to connect to your Supabase project.

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
