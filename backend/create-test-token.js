const jwt = require('jsonwebtoken');

// Tạo token mới cho user Nghia Phan
const payload = {
  userId: '68f62dfc04bdae1b84bfb1b9',
  email: 'nghiaskt147@gmail.com'
};

const secret = process.env.JWT_SECRET || 'your-secret-key';
const token = jwt.sign(payload, secret, { expiresIn: '24h' });

console.log('🔑 New test token:');
console.log(token);
console.log('\n📋 Copy this token and use it in the frontend localStorage or cookies');
