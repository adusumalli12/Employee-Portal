import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface Environment {
  // Server
  PORT: number;
  NODE_ENV: 'development' | 'production' | 'test';

  // Database
  MONGODB_URI: string;

  // Email
  EMAIL_HOST: string;
  EMAIL_PORT: number;
  EMAIL_USER: string;
  EMAIL_PASSWORD: string;

  // JWT
  JWT_SECRET: string;
  JWT_EXPIRY: string;

  // Twilio
  TWILIO_ACCOUNT_SID: string;
  TWILIO_AUTH_TOKEN: string;
  TWILIO_PHONE_NUMBER: string;

  // App
  APP_NAME: string;
  APP_URL: string;
  FRONTEND_URL: string;

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: number;
  RATE_LIMIT_MAX_GLOBAL: number;
  RATE_LIMIT_MAX_AUTH: number;
  RATE_LIMIT_MAX_OTP: number;

  // Admin
  INITIAL_ADMIN_EMAIL: string;
}

function getEnvVariable(key: keyof Environment, defaultValue?: string | number): string | number {
  const value = process.env[key];

  if (!value && defaultValue === undefined) {
    throw new Error(`Environment variable ${key} is not defined`);
  }

  return value || defaultValue || '';
}

const env: Environment = {
  // Server
  PORT: parseInt(getEnvVariable('PORT', 3000) as string, 10),
  NODE_ENV: (process.env['NODE_ENV'] as any) || 'development',

  // Database
  MONGODB_URI: getEnvVariable('MONGO_URI' as any) as string,

  // Email
  EMAIL_HOST: getEnvVariable('EMAIL_HOST', 'smtp.gmail.com') as string,
  EMAIL_PORT: parseInt(getEnvVariable('EMAIL_PORT', 587) as string, 10),
  EMAIL_USER: getEnvVariable('EMAIL_USER') as string,
  EMAIL_PASSWORD: getEnvVariable('EMAIL_PASSWORD') as string,

  // JWT
  JWT_SECRET: getEnvVariable('JWT_SECRET') as string,
  JWT_EXPIRY: getEnvVariable('JWT_EXPIRY', '7d') as string,

  // Twilio
  TWILIO_ACCOUNT_SID: getEnvVariable('TWILIO_ACCOUNT_SID') as string,
  TWILIO_AUTH_TOKEN: getEnvVariable('TWILIO_AUTH_TOKEN') as string,
  TWILIO_PHONE_NUMBER: getEnvVariable('TWILIO_PHONE_NUMBER') as string,

  // App
  APP_NAME: getEnvVariable('APP_NAME', 'Employee Portal') as string,
  APP_URL: (getEnvVariable('APP_URL', 'http://localhost:3000') as string).replace(/\/$/, ''),
  FRONTEND_URL: (getEnvVariable('FRONTEND_URL', 'http://localhost:3000') as string).replace(/\/$/, ''),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: parseInt(getEnvVariable('RATE_LIMIT_WINDOW_MS' as any, 900000) as string, 10),
  RATE_LIMIT_MAX_GLOBAL: parseInt(getEnvVariable('RATE_LIMIT_MAX_GLOBAL' as any, 1000) as string, 10),
  RATE_LIMIT_MAX_AUTH: parseInt(getEnvVariable('RATE_LIMIT_MAX_AUTH' as any, 100) as string, 10),
  RATE_LIMIT_MAX_OTP: parseInt(getEnvVariable('RATE_LIMIT_MAX_OTP' as any, 100) as string, 10),

  // Admin
  INITIAL_ADMIN_EMAIL: getEnvVariable('INITIAL_ADMIN_EMAIL' as any, '') as string,
};

console.log('------------------------------------------------');
console.log(`🚀 APP CONFIGURATION LOADED [${new Date().toLocaleTimeString()}]`);
console.log(`📍 PORT: ${env.PORT}`);
console.log(`🌍 APP_URL: ${env.APP_URL}`);
console.log('------------------------------------------------');

export default env;

// Log masked environment variables on startup
function maskValue(value: string | number): string {
  const str = String(value);
  if (str.length <= 4) return '***';
  return `${str.slice(0, 4)}... (len=${str.length})`;
}

if (process.env['NODE_ENV'] !== 'production') {
  console.log('[env] Configuration loaded:');
  console.log(`[env] PORT: ${env.PORT}`);
  console.log(`[env] NODE_ENV: ${env.NODE_ENV}`);
  console.log(`[env] MONGODB_URI: ${maskValue(env.MONGODB_URI)}`);
  console.log(`[env] EMAIL_HOST: ${env.EMAIL_HOST}`);
  console.log(`[env] JWT_SECRET: ${maskValue(env.JWT_SECRET)}`);
  console.log(`[env] TWILIO_ACCOUNT_SID: ${maskValue(env.TWILIO_ACCOUNT_SID)}`);
}
