require('dotenv').config();

module.exports = {
  // Server configuration
  port: process.env.PORT || 3000,
  nodeEnv: 'development',
  
  // Database configuration
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'property_management_dev',
    dialect: 'mysql',
    logging: true, // Enable SQL query logging in development
    pool: {
      max: 5,
      min: 0,
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
      bigNumberStrings: true
    }
  },
  
  // JWT configuration
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-key',
  jwtExpiration: '1d',
  refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET || 'dev-refresh-secret',
  refreshTokenExpiration: '7d',
  passwordResetSecret: process.env.PASSWORD_RESET_SECRET || 'dev-password-reset-secret',
  emailVerificationSecret: process.env.EMAIL_VERIFICATION_SECRET || 'dev-email-verification-secret',
  
  // Email configuration
  email: {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    from: process.env.EMAIL_FROM || 'dev@propertymanagement.com'
  },
  
  // File upload configuration
  upload: {
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedFileTypes: ['image/jpeg', 'image/png', 'image/gif'],
    uploadDir: 'uploads/dev'
  },
  
  // Rate limiting configuration
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
  },
  
  // CORS configuration
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:8080'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  },
  
  // Logging configuration
  logging: {
    level: 'debug',
    format: 'dev'
  },
  
  // Cache configuration
  cache: {
    ttl: 300, // 5 minutes
    checkPeriod: 600 // 10 minutes
  }
}; 