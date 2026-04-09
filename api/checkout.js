/* ═══════════════════════════════════════════════════
   EURO POLO · api/checkout.js
   Vercel Serverless Function — Toyyibpay Bill Creation

   SETUP: Add these to Vercel Environment Variables
   ─────────────────────────────────────────────────
   TOYYIBPAY_SECRET_KEY    = your Secret Key  (from Toyyibpay merchant panel)
   TOYYIBPAY_CATEGORY_CODE = your Category Code (from Toyyibpay merchant panel)

   Register at: https://toyyibpay.com/
   Merchant panel: https://toyyibpay.com/index.php/dashboard
═══════════════════════════════════════════════════ */

module.exports = async function (req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST')   { res.status(405).json({ error: 'Method not allowed' }); return; }

  const secretKey    = process.env.TOYYIBPAY_SECRET_KEY;
  const categoryCode = process.env.TOYYIBPAY_CATEGORY_CODE;

  if (!secretKey || !categoryCode) {
    res.status(500).json({ error: 'Payment gateway not configured. Please contact support.' });
    return;
  }

  try {
    const { items, customer, promoCode, discountAmount } = req.body;

    if (!items || !items.length) {
      res.status(400).json({ error: 'Cart is empty.' });
      return;
    }

    const subtotal      = items.reduce((s, i) => s + parseFloat(i.price) * i.qty, 0);
    const total         = Math.max(0, subtotal - (discountAmount || 0));
    const amountInSen   = Math.round(total * 100); // Toyyibpay uses sen (cents)

    const refNo         = 'EP-' + Date.now().toString(36).toUpperCase();
    const origin        = req.headers.origin || 'https://europolo.my';
    const billDesc      = items.map(i => i.name).join(', ').substring(0, 99) || 'Euro Polo Order';

    // Create bill via Toyyibpay API
    const params = new URLSearchParams({
      userSecretKey:          secretKey,
      categoryCode:           categoryCode,
      billName:               'Euro Polo Order',
      billDescription:        billDesc,
      billPriceSetting:       1,          // 1 = fixed price
      billPayorInfo:          1,          // 1 = collect payor info
      billAmount:             amountInSen,
      billReturnUrl:          origin + '/api/payment-response',
      billCallbackUrl:        origin + '/api/payment-response',
      billExternalReferenceNo: refNo,
      billTo:                 customer?.name    || '',
      billEmail:              customer?.email   || '',
      billPhone:              customer?.phone   || '',
      billSplitPayment:       0,
      billSplitPaymentArgs:   '',
      billPaymentChannel:     0,          // 0 = all (FPX + credit/debit card)
      billContentEmail:       'Thank you for your Euro Polo order! We will process it shortly.',
      billChargeToCustomer:   1,          // 1 = transaction fee charged to customer
      billExpiryDays:         1,          // Bill expires in 1 day
    });

    const apiResponse = await fetch('https://toyyibpay.com/index.php/api/createBill', {
      method:  'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body:    params.toString(),
    });

    const result = await apiResponse.json();

    if (!result || !result[0] || !result[0].BillCode) {
      const msg = result?.[0]?.Message || 'Failed to create payment bill.';
      throw new Error(msg);
    }

    const billCode   = result[0].BillCode;
    const paymentUrl = 'https://toyyibpay.com/' + billCode;

    res.status(200).json({ url: paymentUrl, refNo });

  } catch (err) {
    console.error('Toyyibpay error:', err.message);
    res.status(500).json({ error: err.message || 'Payment could not be started.' });
  }
};
