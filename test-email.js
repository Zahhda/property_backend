const { sendWelcomeEmail } = require('./utils/emailService');
const nodemailer = require('nodemailer');

async function testEmail() {
  const testAccount = await nodemailer.createTestAccount();
  const ethTransporter = nodemailer.createTransport({
    host: 'smtp.hostinger.com',
    port: 587,
    secure: false,
    auth: {
      user: 'support@dorpay.in',
      pass: 'UGMrWM-Ly9M-H?!'
    }
  });

  const testUser = { email: 'ankitagrawal288@gmail.com', firstName: 'Test', lastName: 'User' };

  const info = await sendWelcomeEmail(testUser, 'Test123', ethTransporter);

  console.log('✅ Email sent!');
  console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
  console.log('SMTP response:', info.response);
}

testEmail();
