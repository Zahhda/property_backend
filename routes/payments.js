const express = require('express');
const router = express.Router();
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const db = require('../models');

// ============================================================================
// ENVIRONMENT CONFIGURATION
// ============================================================================
const base = (process.env.IPAYMENT_BASE_URL || 'https://console.ipayments.in/v1').replace(/\/$/, '');
const clientId = process.env.IPAYMENT_CLIENT_ID || '';             // verification client id (unchanged)
const clientSecret = process.env.IPAYMENT_CLIENT_SECRET || '';     // verification client secret (unchanged)

// NEW: payment (PGCollect) credentials read from .env as requested
const paymentClientId = process.env.PIPAYMENT_CLIENT_ID || '';
const paymentClientSecret = process.env.PIPAYMENT_CLIENT_SECRET || '';

const paymentPath = (process.env.IPAYMENT_PAYMENT_PATH || 'service/pgcollect/jio/order/generate').replace(/^\/|\/$/g, '');
const merchantCode = process.env.IPAYMENT_MERCHANT_CODE || '';
const settlementType = process.env.IPAYMENT_SETTLEMENT_TYPE || 'instant';
const frontendBaseUrl = process.env.FRONTEND_URL || 'https://dorpay.in';
const paymentsDbEnabled = process.env.PAYMENTS_DB_ENABLED !== 'false'; // allow disabling DB writes
let paymentModelSyncPromise = null;

async function ensurePaymentModelSynced() {
  if (!paymentsDbEnabled) return null;
  if (!db.PaymentTransaction) {
    throw new Error('PaymentTransaction model is not registered');
  }
  if (!paymentModelSyncPromise) {
    // Sync once to avoid "model undefined" or missing table issues in fresh environments
    paymentModelSyncPromise = db.PaymentTransaction.sync();
  }
  return paymentModelSyncPromise;
}

// ============================================================================
// HELPERS
// ============================================================================
function authHeader() {
  // this helper remains tied to verification credentials (IPAYMENT_*)
  if (!clientId || !clientSecret) return null;
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  return `Basic ${basic}`;
}
function buildIpaymentUrl(path = '') {
  const normalizedPath = path.replace(/^\/+/, '');
  return `${base}/${normalizedPath}`;
}
function respondMissingCreds(res) {
  return res.status(500).json({
    ok: false,
    success: false,
    message: 'Payment gateway credentials not configured. Please contact administrator.',
    code: 'IPAYMENT_CONFIG_MISSING',
  });
}
function validateVPA(vpa) {
  if (!vpa || typeof vpa !== 'string') return false;
  const vpaPattern = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
  return vpaPattern.test(vpa.trim());
}
function validateIFSC(ifsc) {
  if (!ifsc || typeof ifsc !== 'string') return false;
  const ifscPattern = /^[A-Z]{4}0[A-Z0-9]{6}$/;
  return ifscPattern.test(ifsc.trim().toUpperCase());
}
function validateAccountNumber(accountNumber) {
  if (!accountNumber || typeof accountNumber !== 'string') return false;
  const accountPattern = /^[0-9]{9,18}$/;
  return accountPattern.test(accountNumber.trim());
}
function validateAmount(amount) {
  const num = parseFloat(amount);
  return !isNaN(num) && num > 0 && num <= 10000000;
}
function isHttpsUrl(url) {
  try {
    const u = new URL(url);
    return u.protocol === 'https:';
  } catch {
    return false;
  }
}
function redact(value) {
  if (!value || value.length < 4) return '[REDACTED]';
  return `${value.slice(0, 2)}***${value.slice(-2)}`;
}
function logPaymentOperation(operation, data, level = 'info') {
  const timestamp = new Date().toISOString();
  const logData = { timestamp, operation, ...data };
  if (logData.clientSecret) logData.clientSecret = '[REDACTED]';
  if (logData.accountNumber) logData.accountNumber = logData.accountNumber.slice(0, 4) + '****';
  if (logData.merchantCode) logData.merchantCode = redact(logData.merchantCode);
  if (level === 'error') console.error(`[PAYMENT ${operation}]`, JSON.stringify(logData, null, 2));
  else console.log(`[PAYMENT ${operation}]`, JSON.stringify(logData, null, 2));
}

// ============================================================================
// HEALTH CHECK ENDPOINT
// ============================================================================
router.get('/health', (req, res) => {
  return res.status(200).json({ ok: true });
});

// ============================================================================
// VERIFICATION ENDPOINTS
// ============================================================================
router.post('/verify-vpa', async (req, res) => {
  const requestId = uuidv4();
  try {
    const { vpa } = req.body || {};
    if (!vpa || typeof vpa !== 'string' || !vpa.trim()) {
      logPaymentOperation('VPA_VERIFY', { requestId, error: 'VPA is required' }, 'error');
      return res.status(400).json({ ok: false, success: false, message: 'VPA (UPI ID) is required', code: 'VALIDATION_ERROR' });
    }
    const trimmedVpa = vpa.trim();
    if (!validateVPA(trimmedVpa)) {
      logPaymentOperation('VPA_VERIFY', { requestId, vpa: trimmedVpa, error: 'Invalid VPA format' }, 'error');
      return res.status(400).json({ ok: false, success: false, message: 'Invalid UPI ID format. Please check and try again.', code: 'INVALID_VPA_FORMAT' });
    }
    const auth = authHeader();
    if (!auth) {
      logPaymentOperation('VPA_VERIFY', { requestId, error: 'Missing credentials' }, 'error');
      return respondMissingCreds(res);
    }
    const vpaEndpoint = buildIpaymentUrl('service/verification/vpa/verify');
    logPaymentOperation('VPA_VERIFY', { requestId, vpa: trimmedVpa, endpoint: vpaEndpoint });
    const r = await axios.post(vpaEndpoint, { vpa: trimmedVpa }, { headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', Authorization: auth }, timeout: 15000 });
    logPaymentOperation('VPA_VERIFY_SUCCESS', { requestId, vpa: trimmedVpa, status: r.status });
    return res.status(200).json({ ok: true, success: true, gateway: r.data });
  } catch (e) {
    logPaymentOperation('VPA_VERIFY_ERROR', { requestId, status: e.response?.status, data: e.response?.data, message: e.message }, 'error');
    const status = e.response?.status || 500;
    const errorData = e.response?.data || {};
    return res.status(status).json({ 
      ok: false, 
      success: false, 
      message: errorData.message || 'UPI verification failed', 
      gateway: errorData,
      error: errorData 
    });
  }
});

router.post('/verify-bank', async (req, res) => {
  const requestId = uuidv4();
  try {
    const { accountNumber, ifsc } = req.body || {};
    if (!accountNumber || !ifsc) {
      logPaymentOperation('BANK_VERIFY', { requestId, error: 'Account number and IFSC are required' }, 'error');
      return res.status(400).json({ ok: false, success: false, message: 'Account number and IFSC code are required', code: 'VALIDATION_ERROR' });
    }
    const trimmedAccount = accountNumber.trim();
    const trimmedIfsc = ifsc.trim().toUpperCase();
    if (!validateAccountNumber(trimmedAccount)) {
      logPaymentOperation('BANK_VERIFY', { requestId, error: 'Invalid account number format' }, 'error');
      return res.status(400).json({ ok: false, success: false, message: 'Invalid account number format', code: 'INVALID_ACCOUNT_FORMAT' });
    }
    if (!validateIFSC(trimmedIfsc)) {
      logPaymentOperation('BANK_VERIFY', { requestId, error: 'Invalid IFSC format' }, 'error');
      return res.status(400).json({ ok: false, success: false, message: 'Invalid IFSC code format', code: 'INVALID_IFSC_FORMAT' });
    }
    const auth = authHeader();
    if (!auth) {
      logPaymentOperation('BANK_VERIFY', { requestId, error: 'Missing credentials' }, 'error');
      return respondMissingCreds(res);
    }
    const bankEndpoint = buildIpaymentUrl('service/verification/bank/verify');
    logPaymentOperation('BANK_VERIFY', { requestId, accountNumber: trimmedAccount.slice(0, 4) + '****', ifsc: trimmedIfsc, endpoint: bankEndpoint });
    const r = await axios.post(bankEndpoint, { accountNumber: trimmedAccount, ifsc: trimmedIfsc }, { headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', Authorization: auth }, timeout: 15000 });
    logPaymentOperation('BANK_VERIFY_SUCCESS', { requestId, status: r.status });
    return res.status(200).json({ ok: true, success: true, gateway: r.data });
  } catch (e) {
    logPaymentOperation('BANK_VERIFY_ERROR', { requestId, status: e.response?.status, data: e.response?.data, message: e.message }, 'error');
    const status = e.response?.status || 500;
    return res.status(status).json({ ok: false, success: false, message: e.response?.data?.message || 'Bank verification failed', error: e.response?.data || e.message });
  }
});

// ============================================================================
// PAYMENT PROCESSING ENDPOINT (PGCollect) - Production Ready
// ============================================================================
router.post('/process-payment', async (req, res) => {
  const requestId = uuidv4();
  let transactionRecord = null;

  try {
    const {
      amount,
      paymentMethod,
      vpa,
      accountNumber,
      ifsc,
      name,
      email,
      mobile,
      userId,
      payingTo,
      paymentType,
      selectedMonth
    } = req.body;

    // Validation
    if (!amount || !paymentMethod) {
      logPaymentOperation('PAYMENT_PROCESS', { requestId, error: 'Amount and payment method are required' }, 'error');
      return res.status(400).json({
        ok: false,
        success: false,
        message: 'Amount and payment method are required'
      });
    }

    if (!name || !mobile) {
      logPaymentOperation('PAYMENT_PROCESS', { requestId, error: 'Name and mobile are required' }, 'error');
      return res.status(400).json({
        ok: false,
        success: false,
        message: 'Name and mobile number are required'
      });
    }

    // Validate amount
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0 || amountNum > 10000000) {
      logPaymentOperation('PAYMENT_PROCESS', { requestId, error: 'Invalid amount' }, 'error');
      return res.status(400).json({
        ok: false,
        success: false,
        message: 'Invalid amount. Amount must be greater than 0 and less than ₹1,00,00,000'
      });
    }

    // Check credentials - Use PAYMENT GATEWAY credentials (not verification credentials)
    // NOTE: switched to PIPAYMENT_ env vars for payment (PGCollect)
    if (!process.env.PIPAYMENT_CLIENT_ID || !process.env.PIPAYMENT_CLIENT_SECRET) {
      logPaymentOperation('PAYMENT_PROCESS', { requestId, error: 'Missing iPayment PGCollect credentials' }, 'error');
      return res.status(500).json({
        ok: false,
        success: false,
        message: 'Payment gateway (PGCollect) credentials not configured. Please set PIPAYMENT_CLIENT_ID and PIPAYMENT_CLIENT_SECRET in environment variables.'
      });
    }

    if (!process.env.IPAYMENT_MERCHANT_CODE) {
      logPaymentOperation('PAYMENT_PROCESS', { requestId, error: 'Missing merchant code' }, 'error');
      return res.status(500).json({
        ok: false,
        success: false,
        message: 'Payment gateway merchant code not configured. Please set IPAYMENT_MERCHANT_CODE in environment variables.'
      });
    }

    // Validate credentials format
    if (process.env.PIPAYMENT_CLIENT_ID.length < 5 || process.env.PIPAYMENT_CLIENT_SECRET.length < 5) {
      logPaymentOperation('PAYMENT_PROCESS', { requestId, error: 'Invalid credentials format' }, 'error');
      return res.status(500).json({
        ok: false,
        success: false,
        message: 'Invalid payment gateway credentials format. Please verify PIPAYMENT_CLIENT_ID and PIPAYMENT_CLIENT_SECRET are correct.'
      });
    }

    // Ensure model/table exists; if DB is unavailable or disabled, continue so gateway still runs
    if (paymentsDbEnabled) {
      try {
        await ensurePaymentModelSynced();
      } catch (syncErr) {
        logPaymentOperation('PAYMENT_MODEL_SYNC_ERROR', { requestId, error: syncErr.message }, 'error');
      }
    }

    // Generate unique transaction ID
    const clientRefId = `TXN${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const transactionId = clientRefId;

    // Build redirect URLs - prefer env, otherwise derive from request
    const reqOrigin = req.get('origin');
    const frontendUrl = (process.env.FRONTEND_URL || reqOrigin || 'http://localhost:5173').replace(/\/$/, '');
    const backendUrl = (process.env.BACKEND_URL || process.env.API_URL || `${req.protocol}://${req.get('host') || 'localhost:3001'}`).replace(/\/$/, '');
    const successUrl = `${frontendUrl}/payment/success?transactionId=${transactionId}`;
    const failureUrl = `${frontendUrl}/payment/failure?transactionId=${transactionId}`;
    const callbackUrl = (process.env.IPAYMENT_WEBHOOK_URL || `${backendUrl}/api/payments/ipayment-webhook`).replace(/\/$/, '');

    // Create pending transaction record (non-blocking - continue even if DB fails or disabled)
    if (paymentsDbEnabled) {
      try {
        transactionRecord = await db.PaymentTransaction.create({
          id: uuidv4(),
          userId: userId || null,
          transactionId: transactionId,
          amount: amountNum,
          paymentMethod: paymentMethod === 'upi' ? 'UPI Payments' : 'Bank Transfer',
          paymentType: paymentType || null,
          selectedMonth: selectedMonth || null,
          payingTo: payingTo?.trim() || null,
          vpa: paymentMethod === 'upi' ? (vpa?.trim() || null) : null,
          accountNumber: paymentMethod === 'bank' ? (accountNumber?.trim() || null) : null,
          ifsc: paymentMethod === 'bank' ? (ifsc?.trim() || null) : null,
          status: 'pending',
          successUrl: successUrl,
          failureUrl: failureUrl,
          redirectUrl: null,
          gatewayResponse: null,
          gatewayTransactionId: null,
        });
        logPaymentOperation('PAYMENT_RECORD_CREATED', { requestId, transactionId, recordId: transactionRecord.id });
      } catch (dbError) {
        logPaymentOperation('PAYMENT_RECORD_ERROR', { requestId, error: dbError.message }, 'error');
        // Continue payment processing even if DB write fails (non-blocking)
      }
    }

    // Build gateway payload
    const gatewayPayload = {
      clientRefId: clientRefId,
      merchantCode: process.env.IPAYMENT_MERCHANT_CODE,
      amount: String(amount),
      name: name.trim(),
      email: email?.trim() || 'noemail@example.com',
      mobile: mobile.trim(),
      paymentType: paymentMethod === 'upi' ? 'upi' : 'netbanking',
      settlementType: process.env.IPAYMENT_SETTLEMENT_TYPE || 'instant',
      redirectUrl: successUrl,
      callbackUrl: callbackUrl
    };

    if (paymentMethod === 'upi' && vpa) {
      gatewayPayload.vpa = vpa.trim();
    }

    if (paymentMethod === 'bank') {
      if (accountNumber) gatewayPayload.accountNumber = accountNumber.trim();
      if (ifsc) gatewayPayload.ifsc = ifsc.trim().toUpperCase();
    }

    // Prepare auth for PGCollect using PIPAYMENT_ credentials
    const auth = Buffer
      .from(`${process.env.PIPAYMENT_CLIENT_ID}:${process.env.PIPAYMENT_CLIENT_SECRET}`)
      .toString('base64');

    // Build payment endpoint
    const baseUrl = (process.env.IPAYMENT_BASE_URL || 'https://console.ipayments.in/v1').replace(/\/+$/, '');
    const paymentPath = (process.env.IPAYMENT_PAYMENT_PATH || 'service/pgcollect/jio/order/generate').replace(/^\/+/, '');
    const paymentEndpoint = `${baseUrl}/${paymentPath}`;

    logPaymentOperation('PAYMENT_GATEWAY_ATTEMPT', { requestId, transactionId, endpoint: paymentEndpoint });

    // Call iPayment API
    const r = await axios.post(paymentEndpoint, gatewayPayload, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Basic ${auth}`
      },
      timeout: 30000
    });

    const gateway = r.data || {};

    // Update transaction with gateway response
    if (transactionRecord) {
      try {
        await transactionRecord.update({
          gatewayResponse: gateway,
          gatewayTransactionId: gateway.transactionId || gateway.id || null,
          redirectUrl: gateway.redirectUrl || gateway.paymentUrl || null,
          status: gateway.redirectUrl ? 'processing' : 'pending'
        });
      } catch (updateError) {
        logPaymentOperation('PAYMENT_RECORD_UPDATE_ERROR', { requestId, error: updateError.message }, 'error');
      }
    }

    // Handle response codes
    if (gateway.code === '0x0209' && gateway.redirectUrl) {
      logPaymentOperation('PAYMENT_GATEWAY_SUCCESS', { requestId, transactionId, code: '0x0209', hasRedirectUrl: true });
      return res.json({
        ok: true,
        success: true,
        transactionId: transactionId,
        redirectUrl: gateway.redirectUrl,
        gateway: gateway
      });
    }

    if (gateway.code === '0x0200') {
      // Direct success (no redirect needed)
      if (transactionRecord) {
        try {
          await transactionRecord.update({
            status: 'success',
            receiptUrl: gateway.receiptUrl || null,
            webhookReceived: false
          });
        } catch (updateError) {
          logPaymentOperation('PAYMENT_RECORD_UPDATE_ERROR', { requestId, error: updateError.message }, 'error');
        }
      }
      logPaymentOperation('PAYMENT_GATEWAY_SUCCESS', { requestId, transactionId, code: '0x0200' });
      return res.json({
        ok: true,
        success: true,
        transactionId: transactionId,
        receiptUrl: gateway.receiptUrl,
        gateway: gateway
      });
    }

    // Handle 401 - Invalid credentials
    if (r.status === 401 || gateway.code === '0x0201') {
      logPaymentOperation('PAYMENT_GATEWAY_CREDENTIALS_ERROR', { 
        requestId, 
        transactionId, 
        code: gateway.code, 
        message: gateway.message 
      }, 'error');
      
      if (transactionRecord) {
        try {
          await transactionRecord.update({
            status: 'failed',
            failureReason: gateway.message || 'Invalid payment gateway credentials'
          });
        } catch (updateError) {
          logPaymentOperation('PAYMENT_RECORD_UPDATE_ERROR', { requestId, error: updateError.message }, 'error');
        }
      }

      return res.status(401).json({
        ok: false,
        success: false,
        message: gateway.message || 'Invalid payment gateway credentials. Please verify PIPAYMENT_CLIENT_ID and PIPAYMENT_CLIENT_SECRET are correct payment gateway credentials (not verification credentials).',
        code: gateway.code,
        hint: 'Ensure you are using PGCollect/payment gateway credentials from iPayments console, not verification API credentials.'
      });
    }

    // Error response
    if (transactionRecord) {
      try {
        await transactionRecord.update({
          status: 'failed',
          failureReason: gateway.message || 'Payment initiation failed'
        });
      } catch (updateError) {
        logPaymentOperation('PAYMENT_RECORD_UPDATE_ERROR', { requestId, error: updateError.message }, 'error');
      }
    }

    logPaymentOperation('PAYMENT_GATEWAY_ERROR', { requestId, transactionId, code: gateway.code, message: gateway.message }, 'error');
    return res.status(400).json({
      ok: false,
      success: false,
      message: gateway.message || 'Payment failed',
      gateway: gateway
    });

  } catch (err) {
    const errorData = err.response?.data || {};
    const errorStatus = err.response?.status || 500;
    
    logPaymentOperation('PAYMENT_GATEWAY_ERROR', { 
      requestId, 
      transactionId: transactionRecord?.transactionId,
      error: err.message,
      status: errorStatus,
      responseData: errorData
    }, 'error');

    // Handle 401 - Invalid credentials
    if (errorStatus === 401 || errorData.code === '0x0201') {
      if (transactionRecord) {
        try {
          await transactionRecord.update({
            status: 'failed',
            failureReason: errorData.message || 'Invalid payment gateway credentials',
            gatewayResponse: errorData
          });
        } catch (updateError) {
          logPaymentOperation('PAYMENT_RECORD_UPDATE_ERROR', { requestId, error: updateError.message }, 'error');
        }
      }

      return res.status(401).json({
        ok: false,
        success: false,
        message: errorData.message || 'Invalid payment gateway credentials',
        code: errorData.code || '0x0201',
        hint: 'Please verify you are using PGCollect/payment gateway credentials (PIPAYMENT_CLIENT_ID & PIPAYMENT_CLIENT_SECRET) from iPayments console. Also ensure your server IP is whitelisted in iPayments dashboard.'
      });
    }

    // Update transaction record if exists
    if (transactionRecord) {
      try {
        await transactionRecord.update({
          status: 'failed',
          failureReason: errorData.message || err.message || 'Payment processing failed',
          gatewayResponse: errorData
        });
      } catch (updateError) {
        logPaymentOperation('PAYMENT_RECORD_UPDATE_ERROR', { requestId, error: updateError.message }, 'error');
      }
    }

    return res.status(errorStatus).json({
      ok: false,
      success: false,
      message: errorData.message || 'Internal payment gateway error',
      code: errorData.code || 'PAYMENT_FAILED'
    });
  }
});

// ============================================================================
// IPAYMENT WEBHOOK ENDPOINT (Production Ready)
// ============================================================================
router.post('/ipayment-webhook', express.json(), async (req, res) => {
  const requestId = uuidv4();
  try {
    const webhookData = req.body || {};

    logPaymentOperation('IPAYMENT_WEBHOOK_RECEIVED', { requestId, webhookData });

    // Extract transaction identifiers
    const clientRefId = webhookData.clientRefId || webhookData.orderId || webhookData.referenceId;
    const gatewayTransactionId = webhookData.transactionId || webhookData.paymentId || webhookData.gatewayTransactionId;
    const status = webhookData.status || webhookData.paymentStatus || webhookData.state;
    const amount = webhookData.amount;

    if (!clientRefId && !gatewayTransactionId) {
      logPaymentOperation('IPAYMENT_WEBHOOK_MISSING_ID', { requestId, webhookData }, 'error');
      return res.status(400).send('Invalid payload: Missing transaction identifier');
    }

    // Find transaction by clientRefId (transactionId) or gatewayTransactionId
    let transactionRecord = null;
    if (clientRefId) {
      transactionRecord = await db.PaymentTransaction.findOne({ where: { transactionId: clientRefId } });
    }
    if (!transactionRecord && gatewayTransactionId) {
      transactionRecord = await db.PaymentTransaction.findOne({ where: { gatewayTransactionId } });
    }

    if (!transactionRecord) {
      logPaymentOperation('IPAYMENT_WEBHOOK_TRANSACTION_NOT_FOUND', { requestId, clientRefId, gatewayTransactionId }, 'error');
      return res.status(200).send('OK'); // Acknowledge even if not found (idempotent)
    }

    // Validate amount matches (security check)
    if (amount && transactionRecord.amount) {
      const webhookAmount = parseFloat(amount);
      const storedAmount = parseFloat(transactionRecord.amount);
      if (Math.abs(webhookAmount - storedAmount) > 0.01) {
        logPaymentOperation('IPAYMENT_WEBHOOK_AMOUNT_MISMATCH', { 
          requestId, 
          transactionId: transactionRecord.transactionId,
          webhookAmount,
          storedAmount 
        }, 'error');
        // Log but continue processing
      }
    }

    // Determine new status
    let newStatus = transactionRecord.status;
    const statusLower = String(status || '').toLowerCase();
    
    if (statusLower === 'success' || statusLower === 'completed' || statusLower === 'paid' || statusLower === 'successful') {
      newStatus = 'success';
    } else if (statusLower === 'failed' || statusLower === 'rejected' || statusLower === 'declined' || statusLower === 'failure') {
      newStatus = 'failed';
    } else if (statusLower === 'cancelled' || statusLower === 'canceled') {
      newStatus = 'cancelled';
    } else if (statusLower === 'pending' || statusLower === 'processing') {
      newStatus = 'processing';
    }

    // Idempotency check - if already processed with same status, acknowledge
    if (transactionRecord.webhookReceived && transactionRecord.status === newStatus) {
      logPaymentOperation('IPAYMENT_WEBHOOK_ALREADY_PROCESSED', { 
        requestId, 
        transactionId: transactionRecord.transactionId,
        status: newStatus 
      });
      return res.status(200).send('OK');
    }

    // Update transaction
    await transactionRecord.update({
      status: newStatus,
      webhookReceived: true,
      webhookData: webhookData,
      gatewayTransactionId: gatewayTransactionId || transactionRecord.gatewayTransactionId,
      receiptUrl: webhookData.receiptUrl || webhookData.receipt_url || webhookData.receiptUrl || transactionRecord.receiptUrl,
      failureReason: newStatus === 'failed' 
        ? (webhookData.message || webhookData.failureReason || webhookData.error || 'Payment failed') 
        : null,
    });

    logPaymentOperation('IPAYMENT_WEBHOOK_PROCESSED', { 
      requestId, 
      transactionId: transactionRecord.transactionId,
      oldStatus: transactionRecord.status,
      newStatus,
      webhookStatus: status 
    });

    return res.status(200).send('OK');

  } catch (e) {
    logPaymentOperation('IPAYMENT_WEBHOOK_ERROR', { requestId, error: e.message, stack: e.stack }, 'error');
    // Always return 200 to acknowledge webhook (idempotent)
    return res.status(200).send('OK');
  }
});

// ============================================================================
// WEBHOOK/CALLBACK ENDPOINT (idempotent) - Legacy endpoint
// ============================================================================
router.post('/webhook', express.raw({ type: '*/*' }), async (req, res) => {
  const requestId = uuidv4();
  try {
    let webhookData;
    try {
      if (Buffer.isBuffer(req.body)) {
        const text = req.body.toString('utf8');
        webhookData = text ? JSON.parse(text) : {};
      } else if (typeof req.body === 'string') {
        webhookData = JSON.parse(req.body);
      } else {
        webhookData = req.body || {};
      }
    } catch (parseError) {
      logPaymentOperation('WEBHOOK_PARSE_ERROR', { requestId, error: parseError.message }, 'error');
      return res.status(400).json({ ok: false, message: 'Invalid webhook data format' });
    }

    logPaymentOperation('WEBHOOK_RECEIVED', { requestId, webhookData });

    const transactionId = webhookData.transactionId || webhookData.orderId || webhookData.id || webhookData.referenceId;
    const gatewayTransactionId = webhookData.gatewayTransactionId || webhookData.paymentId || webhookData.transaction_id;

    if (!transactionId && !gatewayTransactionId) {
      logPaymentOperation('WEBHOOK_MISSING_ID', { requestId, webhookData }, 'error');
      return res.status(400).json({ ok: false, message: 'Transaction ID not found in webhook data' });
    }

    let transactionRecord = null;
    if (transactionId) {
      transactionRecord = await db.PaymentTransaction.findOne({ where: { transactionId } });
    }
    if (!transactionRecord && gatewayTransactionId) {
      transactionRecord = await db.PaymentTransaction.findOne({ where: { gatewayTransactionId } });
    }

    if (!transactionRecord) {
      logPaymentOperation('WEBHOOK_TRANSACTION_NOT_FOUND', { requestId, transactionId, gatewayTransactionId }, 'error');
      return res.status(200).json({ ok: true, message: 'Transaction not found, but webhook received' });
    }

    const webhookStatus = webhookData.status || webhookData.paymentStatus || webhookData.state;
    let newStatus = transactionRecord.status;
    if (webhookStatus === 'success' || webhookStatus === 'completed' || webhookStatus === 'paid') newStatus = 'success';
    else if (webhookStatus === 'failed' || webhookStatus === 'rejected' || webhookStatus === 'declined') newStatus = 'failed';
    else if (webhookStatus === 'cancelled' || webhookStatus === 'canceled') newStatus = 'cancelled';
    else if (webhookStatus === 'pending' || webhookStatus === 'processing') newStatus = 'processing';

    if (transactionRecord.webhookReceived && transactionRecord.status === newStatus) {
      return res.status(200).json({ ok: true, message: 'Webhook already processed' });
    }

    await transactionRecord.update({
      status: newStatus,
      webhookReceived: true,
      webhookData: webhookData,
      gatewayTransactionId: gatewayTransactionId || transactionRecord.gatewayTransactionId,
      receiptUrl: webhookData.receiptUrl || webhookData.receipt_url || transactionRecord.receiptUrl,
      failureReason: newStatus === 'failed' ? (webhookData.message || webhookData.failureReason || 'Payment failed') : null,
    });

    logPaymentOperation('WEBHOOK_PROCESSED', { requestId, transactionId: transactionRecord.transactionId, oldStatus: transactionRecord.status, newStatus, webhookStatus });

    return res.status(200).json({ ok: true, message: 'Webhook processed successfully' });
  } catch (e) {
    logPaymentOperation('WEBHOOK_ERROR', { requestId, error: e.message }, 'error');
    return res.status(200).json({ ok: false, message: 'Webhook processing error, but acknowledged' });
  }
});

// ============================================================================
// PAYMENT STATUS CHECK ENDPOINT
// ============================================================================
router.get('/status/:transactionId', async (req, res) => {
  try {
    const { transactionId } = req.params;
    if (!transactionId) {
      return res.status(400).json({ ok: false, success: false, message: 'Transaction ID is required' });
    }
    const transaction = await db.PaymentTransaction.findOne({ where: { transactionId } });
    if (!transaction) {
      return res.status(404).json({ ok: false, success: false, message: 'Transaction not found' });
    }
    return res.status(200).json({
      ok: true,
      success: true,
      transaction: {
        transactionId: transaction.transactionId,
        status: transaction.status,
        amount: transaction.amount,
        paymentMethod: transaction.paymentMethod,
        gatewayTransactionId: transaction.gatewayTransactionId,
        receiptUrl: transaction.receiptUrl,
        failureReason: transaction.failureReason,
        createdAt: transaction.createdAt,
        updatedAt: transaction.updatedAt,
      },
    });
  } catch (e) {
    logPaymentOperation('STATUS_CHECK_ERROR', { transactionId: req.params.transactionId, error: e.message }, 'error');
    return res.status(500).json({ ok: false, success: false, message: 'Error checking payment status' });
  }
});

// ============================================================================
// DEVELOPMENT/DEBUG ENDPOINTS (only in development)
// ============================================================================
if (process.env.NODE_ENV === 'development') {
  router.get('/server-info', async (req, res) => {
    try {
      const clientIp = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || 'unknown';
      let publicIp = 'unknown';
      try {
        const ipResponse = await axios.get('https://api.ipify.org?format=json', { timeout: 3000 });
        publicIp = ipResponse.data.ip;
      } catch (ipError) {
        console.log('Could not fetch public IP:', ipError.message);
      }
      return res.status(200).json({
        clientIp: clientIp.split(',')[0].trim(),
        publicIp,
        ipaymentBase: base,
        hasClientId: Boolean(clientId),
        hasClientSecret: Boolean(clientSecret),
        frontendBaseUrl,
      });
    } catch (error) {
      return res.status(500).json({ message: 'Could not fetch server information', error: error.message });
    }
  });

  router.get('/selftest', async (req, res) => {
    const nodeEnv = process.env.NODE_ENV || 'development';
    const envFile = `.env.${nodeEnv}`;
    const vpaEndpoint = buildIpaymentUrl('service/verification/vpa/verify');
    const bankEndpoint = buildIpaymentUrl('service/verification/bank/verify');
    const paymentEndpoint = buildIpaymentUrl(paymentPath);
    const summary = {
      env: {
        nodeEnv,
        envFile,
        ipaymentBaseUrl: base,
        hasClientId: Boolean(clientId),
        hasClientSecret: Boolean(clientSecret),
        frontendBaseUrl,
      },
      endpoints: { vpa: vpaEndpoint, bank: bankEndpoint, payment: paymentEndpoint },
      gatewayTest: { status: 0, code: null, message: null },
    };
    try {
      const auth = authHeader();
      if (!auth) {
        summary.gatewayTest = { status: 0, code: 'NO_AUTH', message: 'Missing IPAYMENT_CLIENT_ID or IPAYMENT_CLIENT_SECRET' };
      } else {
        const testVpa = 'upi@ybl';
        const resp = await axios.post(vpaEndpoint, { vpa: testVpa }, { headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', Authorization: auth }, timeout: 15000 });
        const data = resp.data || {};
        summary.gatewayTest = { status: resp.status, code: data.code || data.statusCode || null, message: data.message || 'OK' };
      }
    } catch (e) {
      const status = e.response?.status || 0;
      const data = e.response?.data || {};
      summary.gatewayTest = { status, code: data.code || data.statusCode || null, message: data.message || e.message || 'Unknown error' };
    }
    return res.status(200).json(summary);
  });
}

module.exports = router;
module.exports = router;
