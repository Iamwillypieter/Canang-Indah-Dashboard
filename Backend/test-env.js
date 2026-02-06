import dotenv from 'dotenv';
dotenv.config();

console.log('🔍 Environment Variables:');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '✅ Defined' : '❌ Undefined');
console.log('PORT:', process.env.PORT);
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_NAME:', process.env.DB_NAME);

if (!process.env.JWT_SECRET) {
  console.error('❌ ERROR: JWT_SECRET is not defined!');
  console.error('Please create a .env file with JWT_SECRET variable');
  process.exit(1);
} else {
  console.log('✅ All environment variables loaded successfully!');
}