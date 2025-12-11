const path = require('path');
const dotenv = require('dotenv');

// Load the appropriate .env file based on NODE_ENV
const env = process.env.NODE_ENV || 'production';
const envFile = `.env.${env}`;

// Load environment variables from the appropriate .env file
dotenv.config({ 
  path: path.resolve(process.cwd(), envFile),
  override: true // This ensures the environment variables are loaded
});

console.log(`Loading environment from: ${envFile}`);

// Load the environment-specific config
const config = require(`./${env}`);

module.exports = config; 