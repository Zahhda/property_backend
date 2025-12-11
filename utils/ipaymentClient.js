// utils/ipaymentClient.js
const axios = require('axios');

const {
  IPAYMENT_BASE_URL,
  IPAYMENT_VERIFY_CLIENT_ID,
  IPAYMENT_VERIFY_CLIENT_SECRET,
  IPAYMENT_PG_CLIENT_ID,
  IPAYMENT_PG_CLIENT_SECRET
} = process.env;

/**
 * Create an axios client for IPayment with Basic Auth.
 * Each client uses different clientId/clientSecret.
 */
function createIpaymentClient(clientId, clientSecret) {
  const instance = axios.create({
    baseURL: IPAYMENT_BASE_URL,
    timeout: 15000
  });

  // Attach Basic Auth header for each request
  instance.interceptors.request.use(config => {
    const token = Buffer.from(`${clientId}:${clientSecret}`, 'utf8').toString('base64');
    config.headers.Authorization = `Basic ${token}`;
    config.headers['Content-Type'] = 'application/json';
    return config;
  });

  return instance;
}

// Client for UPI/bank verification
const verifyClient = createIpaymentClient(
  IPAYMENT_VERIFY_CLIENT_ID,
  IPAYMENT_VERIFY_CLIENT_SECRET
);

// Client for payment order creation
const pgClient = createIpaymentClient(
  IPAYMENT_PG_CLIENT_ID,
  IPAYMENT_PG_CLIENT_SECRET
);

module.exports = { verifyClient, pgClient };

