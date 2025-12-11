// Vercel serverless entrypoint: reuse the Express app without listening.
const app = require('../index');
module.exports = app;

