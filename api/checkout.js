/* ═══════════════════════════════════════════════════
   EURO POLO · api/checkout.js
   Vercel Serverless Function — Stripe Checkout Session

   SETUP: Add STRIPE_SECRET_KEY to Vercel Environment Variables
   ─────────────────────────────────────────────────────────────
   1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   2. Add: STRIPE_SECRET_KEY = sk_live_xxxxxxxxxxxxx  (your Stripe secret key)
   3. Redeploy after adding the variable.

   Get your keys at: https://dashboard.stripe.com/apikeys
═══════════════════════════════════════════════════ */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async function (req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    res.status(500).json({ error: 'Payment gateway not configured. Please contact support.' });
    return;
  }

  try {
    const { items, customer, promoCode, discountAmount } = req.body;

    if (!items || !items.length) {
      res.status(400).json({ error: 'Cart is empty.' });
      return;
    }

    // Build Stripe line items from cart
    const lineItems = items.map(function (item) {
      return {
        price_data: {
          currency: 'myr',
          product_data: {
            name: item.name,
            description: item.sku ? 'SKU: ' + item.sku : undefined,
          },
          unit_amount: Math.round(parseFloat(item.price) * 100), // in sen
        },
        quantity: item.qty,
      };
    });

    // Apply discount as a separate line item if promo code used
    if (discountAmount && discountAmount > 0) {
      lineItems.push({
        price_data: {
          currency: 'myr',
          product_data: {
            name: 'Discount' + (promoCode ? ' (' + promoCode + ')' : ''),
          },
          unit_amount: -Math.round(discountAmount * 100), // negative = discount
        },
        quantity: 1,
      });
    }

    const origin = req.headers.origin || 'https://europolo.my';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      customer_email: customer ? customer.email : undefined,
      success_url: origin + '/success.html?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: origin + '/checkout.html',
      metadata: {
        customer_name: customer ? customer.name : '',
        customer_phone: customer ? customer.phone : '',
        customer_city: customer ? customer.city : '',
        customer_state: customer ? customer.state : '',
        customer_postcode: customer ? customer.postcode : '',
        promo_code: promoCode || '',
      },
      billing_address_collection: 'required',
    });

    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Stripe error:', err.message);
    res.status(500).json({ error: err.message || 'Payment session could not be created.' });
  }
};
