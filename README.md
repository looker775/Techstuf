# Techstuf storefront

This is a standalone static storefront for Techstuf (Netlify + Supabase + PayPal).

## Quick start
- Open `index.html` in a browser to preview.
- Deploy the repo on Netlify with publish directory set to `.`.

## Supabase connection
Fill in `SUPABASE_URL` and `SUPABASE_ANON_KEY` inside `app.js` to connect to your Supabase project.

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