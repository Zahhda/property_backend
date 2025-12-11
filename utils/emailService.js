require('dotenv').config();
const nodemailer = require('nodemailer');
const emailConfig = require('../config/emailConfig');

// Create a transporter based on configuration
async function createTransporter() {
  // Check if we have real SMTP credentials
  if (emailConfig.auth.user && emailConfig.auth.pass) {
    if (emailConfig.debug) console.log('Using configured email credentials');

    const userEmail = emailConfig.auth.user.includes('@') 
      ? emailConfig.auth.user 
      : `${emailConfig.auth.user}@${emailConfig.senderDomain}`;

    return nodemailer.createTransport({
      host: emailConfig.host,
      port: emailConfig.port || 465,
      secure: emailConfig.secure ?? true,
      auth: {
        user: userEmail,
        pass: emailConfig.auth.pass
      }
    });
  } else {
    // Fallback to Ethereal if no credentials
    if (emailConfig.debug) console.log('No email credentials found, using Ethereal test account');

    const testAccount = await nodemailer.createTestAccount();
    console.log('Created Ethereal test email account:', testAccount.user);
    console.log('View sent emails at: https://ethereal.email/messages');
    console.log('Login with:', testAccount.user, testAccount.pass);

    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
  }
}

// Correct sender email based on transporter/auth
function getSenderEmail(transporter) {
  if (emailConfig.auth.user) {
    if (!emailConfig.auth.user.includes('@')) {
      return `${emailConfig.auth.user}@${emailConfig.senderDomain}`;
    }
    return emailConfig.auth.user;
  }
  // fallback to transporter auth user (Ethereal)
  return transporter?.options?.auth?.user || `no-reply@${emailConfig.senderDomain}`;
}

/**
 * Send a welcome email
 */
const sendWelcomeEmail = async (user, clearPassword = null) => {
  try {
    if (emailConfig.debug) console.log('Attempting to send welcome email to:', user.email);

    const { email, firstName, lastName } = user;
    const transporter = await createTransporter();

    const fromEmail = getSenderEmail(transporter);

    if (emailConfig.debug) {
      console.log('Using sender email:', fromEmail);
      console.log('Sending email to:', email);
    }

    const passwordHtml = clearPassword 
      ? `<p><strong>Password:</strong> ${clearPassword}</p>`
      : `<p><strong>Password:</strong> The password you created during registration</p>`;
    const passwordText = clearPassword
      ? `Password: ${clearPassword}`
      : `Password: The password you created during registration`;

    const mailOptions = {
      from: `"${emailConfig.senderName}" <${fromEmail}>`,
      to: email,
      subject: emailConfig.welcomeSubject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width:600px; padding:20px; border:1px solid #e0e0e0; border-radius:5px;">
          <h2 style="text-align:center;">Welcome to ${emailConfig.senderName}!</h2>
          <p>Hello ${firstName} ${lastName},</p>
          <p>Your account has been created successfully.</p>
          <div style="background-color:#f9f9f9; border-left:4px solid #007bff; padding:15px; margin:20px 0;">
            <h3>Your Login Details</h3>
            <p><strong>Email:</strong> ${email}</p>
            ${passwordHtml}
          </div>
          <p>You can now:</p>
          <ul>
            <li>Browse available properties</li>
            <li>Contact property owners</li>
            <li>Save your favorite listings</li>
            <li>Manage your profile</li>
          </ul>
          <div style="text-align:center; margin-top:30px;">
            <a href="${emailConfig.loginUrl}" style="background-color:#007bff; color:white; padding:10px 20px; text-decoration:none; border-radius:5px;">Login to Your Account</a>
          </div>
          <p style="margin-top:30px;">Contact support at <a href="mailto:${emailConfig.supportEmail}">${emailConfig.supportEmail}</a> if needed.</p>
          <p>Best regards,<br>The ${emailConfig.senderName} Team</p>
        </div>
      `,
      text: `Welcome to ${emailConfig.senderName}!\n\nHello ${firstName} ${lastName},\n\nYour account has been created successfully.\nEmail: ${email}\n${passwordText}\n\nYou can now browse properties, contact owners, save favorites, and manage your profile.\n\nLogin: ${emailConfig.loginUrl}\nSupport: ${emailConfig.supportEmail}\n\nBest regards,\nThe ${emailConfig.senderName} Team`
    };

    const info = await transporter.sendMail(mailOptions);

    if (emailConfig.debug) console.log('Email sent successfully! Info:', info.response);

    return info;
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return { error: true, message: error.message, details: error };
  }
};

/**
 * Send password reset email
 */
const sendPasswordResetEmail = async (user, resetToken, resetUrl) => {
  try {
    if (emailConfig.debug) console.log('Attempting to send password reset email to:', user.email);

    const { email, firstName, lastName } = user;
    const transporter = await createTransporter();

    const fromEmail = getSenderEmail(transporter);

    if (emailConfig.debug) {
      console.log('Using sender email:', fromEmail);
      console.log('Sending password reset email to:', email);
    }

    const mailOptions = {
      from: `"${emailConfig.senderName}" <${fromEmail}>`,
      to: email,
      subject: 'Password Reset Request',
      html: `
        <div style="font-family: Arial, sans-serif; max-width:600px; padding:20px; border:1px solid #e0e0e0; border-radius:5px;">
          <h2 style="text-align:center;">Password Reset</h2>
          <p>Hello ${firstName} ${lastName},</p>
          <p>We received a request to reset your password. If you didn't request it, ignore this email.</p>
          <div style="background-color:#f9f9f9; border-left:4px solid #ff9800; padding:15px; margin:20px 0;">
            <h3>Reset Your Password</h3>
            <p>Click below to reset your password. Link expires in 1 hour.</p>
          </div>
          <div style="text-align:center; margin-top:30px;">
            <a href="${resetUrl}" style="background-color:#ff9800; color:white; padding:10px 20px; text-decoration:none; border-radius:5px;">Reset Password</a>
          </div>
          <div style="margin-top:30px; font-size:14px; color:#666;">
            <p>If the button doesn't work, copy-paste this link:</p>
            <p>${resetUrl}</p>
          </div>
          <p style="margin-top:30px;">Contact support at <a href="mailto:${emailConfig.supportEmail}">${emailConfig.supportEmail}</a>.</p>
          <p>Best regards,<br>The ${emailConfig.senderName} Team</p>
        </div>
      `,
      text: `Password Reset - ${emailConfig.senderName}\n\nHello ${firstName} ${lastName},\n\nWe received a request to reset your password. Ignore if not requested.\n\nReset Link: ${resetUrl}\n\nSupport: ${emailConfig.supportEmail}\n\nBest regards,\nThe ${emailConfig.senderName} Team`
    };

    const info = await transporter.sendMail(mailOptions);

    if (emailConfig.debug) console.log('Password reset email sent successfully! Info:', info.response);

    return info;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return { error: true, message: error.message, details: error };
  }
};

module.exports = { sendWelcomeEmail, sendPasswordResetEmail };
