// Test script to debug the ALLOWED_ADMIN_EMAILS parsing
require('dotenv').config({ path: '.env.local' });

const AUTHORIZED_ADMINS = (process.env.ALLOWED_ADMIN_EMAILS || '')
  .split(',')
  .map(s => s.trim().toLowerCase())
  .filter(Boolean);

console.log('Environment variable raw:', process.env.ALLOWED_ADMIN_EMAILS);
console.log('Parsed authorized admins:', AUTHORIZED_ADMINS);

const testEmail = 'buildsbyandy@gmail.com';
const isAuthorized = AUTHORIZED_ADMINS.includes(testEmail.toLowerCase());

console.log('Test email:', testEmail);
console.log('Is authorized:', isAuthorized);