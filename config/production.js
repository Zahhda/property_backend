require('dotenv').config();

module.exports = {
  // Server configuration
  port: process.env.PORT || 80,
  nodeEnv: 'production',
  
  // Database configuration
  database: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    dialect: 'mysql',
    logging: false, // Disable SQL query logging in production
    pool: {
      max: 20, // Increased pool size for production
      min: 5,
      acquire: 30000,
      idle: 10000
    },
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: false
    },
    dialectOptions: {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
      supportBigNumbers: true,
      bigNumberStrings: true,
      ssl: {
        require: true,
        rejectUnauthorized: false // Use true in production with proper SSL cert
      }
    }
  },
  
  // JWT configuration
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiration: '1d',
  refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET,
  refreshTokenExpiration: '7d',
  passwordResetSecret: process.env.PASSWORD_RESET_SECRET,
  emailVerificationSecret: process.env.EMAIL_VERIFICATION_SECRET,
  
  // Email configuration
  email: {
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    from: process.env.EMAIL_FROM
  },
  
  // File upload configuration
  upload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB in production
    allowedFileTypes: ['image/jpeg', 'image/png', 'image/gif'],
    uploadDir: process.env.UPLOAD_DIR || 'uploads/prod'
  },
  
  // Rate limiting configuration
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50 // Stricter rate limiting in production
  },
  
  // CORS configuration
  cors: {
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['https://yourdomain.com'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  },
  
  // Logging configuration
  logging: {
    level: 'error', // Only log errors in production
    format: 'combined'
  },
  
  // Cache configuration
  cache: {
    ttl: 600, // 10 minutes in production
    checkPeriod: 1200 // 20 minutes in production
  }
}; 