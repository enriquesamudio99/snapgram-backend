import nodemailer from 'nodemailer';
import { EMAIL_HOST, EMAIL_PASS, EMAIL_PORT, EMAIL_USER } from '../config/env.js';

const forgetPasswordEmail = async (data) => {
  const transport = nodemailer.createTransport({
    host: EMAIL_HOST,
    port: EMAIL_PORT,
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS
    }
  });

  const { name, email, token } = data;

  await transport.sendMail({
    from: 'ecommerce.com',
    to: email,
    subject: 'Reset your password on Snapgram',
    text: 'Reset your password on Snapgram',
    html: `
      <p>Hello ${name}, reset your user password</p>
      <p>Enter the following link to generate your new password: <a href="${process.env.BACKEND_URL}:${process.env.SERVER_PORT || 3000}/auth/forget-password/${token}">Change Password</a></p>
      <p>If you did not request this change, just ignore it.</p>
    `
  });
}

export {
  forgetPasswordEmail
}