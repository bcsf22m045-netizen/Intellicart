import nodemailer from 'nodemailer';

/**
 * Email Service Configuration
 * Uses Nodemailer to send transactional emails
 */

// Create reusable transporter object using SMTP transport
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

/**
 * Send verification email to user
 * @param {string} email - User's email address
 * @param {string} name - User's name
 * @param {string} verificationToken - Token for email verification
 */
export const sendVerificationEmail = async (email, name, verificationToken) => {
  const transporter = createTransporter();
  
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
  
  const mailOptions = {
    from: `"IntelliCart" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Verify Your Email Address - IntelliCart',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(to right, #000, #333); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">IntelliCart</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px;">
          <h2 style="color: #333; margin-bottom: 20px;">Welcome, ${name}!</h2>
          <p>Thank you for registering with IntelliCart. Please verify your email address to complete your registration.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background-color: #000; color: white; padding: 14px 28px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              Verify Email Address
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">This link will expire in 24 hours.</p>
          <p style="color: #666; font-size: 14px;">If you didn't create an account, you can safely ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          <p style="color: #999; font-size: 12px; text-align: center;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="${verificationUrl}" style="color: #666;">${verificationUrl}</a>
          </p>
        </div>
      </body>
      </html>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Verification email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw new Error('Failed to send verification email');
  }
};

/**
 * Send password reset email
 * @param {string} email - User's email address
 * @param {string} name - User's name
 * @param {string} resetToken - Token for password reset
 */
export const sendPasswordResetEmail = async (email, name, resetToken) => {
  const transporter = createTransporter();
  
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  
  const mailOptions = {
    from: `"IntelliCart" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Reset Your Password - IntelliCart',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(to right, #000, #333); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">IntelliCart</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px;">
          <h2 style="color: #333; margin-bottom: 20px;">Password Reset Request</h2>
          <p>Hi ${name},</p>
          <p>We received a request to reset your password. Click the button below to create a new password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #000; color: white; padding: 14px 28px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">This link will expire in 1 hour.</p>
          <p style="color: #666; font-size: 14px;">If you didn't request a password reset, you can safely ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          <p style="color: #999; font-size: 12px; text-align: center;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="${resetUrl}" style="color: #666;">${resetUrl}</a>
          </p>
        </div>
      </body>
      </html>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw new Error('Failed to send password reset email');
  }
};

/**
 * Send welcome email after successful verification
 * @param {string} email - User's email address
 * @param {string} name - User's name
 */
export const sendWelcomeEmail = async (email, name) => {
  const transporter = createTransporter();
  
  const mailOptions = {
    from: `"IntelliCart" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Welcome to IntelliCart!',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(to right, #000, #333); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">IntelliCart</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px;">
          <h2 style="color: #333; margin-bottom: 20px;">Welcome to IntelliCart!</h2>
          <p>Hi ${name},</p>
          <p>Your email has been verified successfully. You can now enjoy all the features of IntelliCart.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/collection" 
               style="background-color: #000; color: white; padding: 14px 28px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              Start Shopping
            </a>
          </div>
          <p>Happy Shopping!</p>
          <p>The IntelliCart Team</p>
        </div>
      </body>
      </html>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Welcome email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    // Don't throw error for welcome email, it's not critical
    return { success: false, error: error.message };
  }
};

/**
 * Send professional order confirmation email
 * @param {Object} order - The full order document (populated)
 */
export const sendOrderConfirmationEmail = async (order) => {
  const transporter = createTransporter();

  const { shippingAddress, items, totalPrice, _id, paymentMethod, createdAt } = order;
  const email = shippingAddress.email;
  const name = shippingAddress.fullName;
  const orderId = _id.toString();
  const orderDate = new Date(createdAt).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Build items table rows
  const itemRows = items
    .map(
      (item) => `
      <tr>
        <td style="padding: 12px 8px; border-bottom: 1px solid #eee;">
          <div style="display: flex; align-items: center; gap: 12px;">
            ${
              item.image
                ? `<img src="${item.image}" alt="${item.name}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 6px; border: 1px solid #eee;" />`
                : ""
            }
            <div>
              <p style="margin: 0; font-weight: 600; color: #111;">${item.name}</p>
              ${item.size ? `<p style="margin: 2px 0 0; font-size: 12px; color: #666;">Size: ${item.size}</p>` : ""}
              ${item.color ? `<p style="margin: 2px 0 0; font-size: 12px; color: #666;">Color: ${item.color}</p>` : ""}
            </div>
          </div>
        </td>
        <td style="padding: 12px 8px; border-bottom: 1px solid #eee; text-align: center; color: #444;">${item.quantity}</td>
        <td style="padding: 12px 8px; border-bottom: 1px solid #eee; text-align: right; font-weight: 600; color: #111;">$${(item.price * item.quantity).toFixed(2)}</td>
      </tr>`
    )
    .join("");

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const deliveryFee = totalPrice - subtotal;

  const mailOptions = {
    from: `"IntelliCart" <${process.env.SMTP_USER}>`,
    to: email,
    subject: `Order Confirmed — #${orderId.slice(-8).toUpperCase()} | IntelliCart`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Order Confirmation</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5;">
          <tr>
            <td align="center" style="padding: 40px 16px;">
              <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%;">
                
                <!-- HEADER -->
                <tr>
                  <td style="background: linear-gradient(135deg, #111 0%, #333 100%); padding: 32px; text-align: center; border-radius: 12px 12px 0 0;">
                    <h1 style="color: #fff; margin: 0; font-size: 28px; letter-spacing: 4px; font-weight: 300;">INTELLICART</h1>
                    <p style="color: #aaa; margin: 8px 0 0; font-size: 13px; letter-spacing: 1px;">PREMIUM FASHION STORE</p>
                  </td>
                </tr>

                <!-- MAIN BODY -->
                <tr>
                  <td style="background: #ffffff; padding: 40px 32px;">
                    
                    <!-- Success Icon -->
                    <div style="text-align: center; margin-bottom: 24px;">
                      <div style="display: inline-block; width: 64px; height: 64px; background-color: #ecfdf5; border-radius: 50%; line-height: 64px; text-align: center;">
                        <span style="font-size: 32px;">✓</span>
                      </div>
                    </div>

                    <h2 style="color: #111; text-align: center; margin: 0 0 8px; font-size: 22px;">Thank you for your order, ${name}!</h2>
                    <p style="color: #666; text-align: center; margin: 0 0 32px; font-size: 15px;">
                      We've received your order and are getting it ready.
                    </p>

                    <!-- Order Info Bar -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: #f9fafb; border-radius: 8px; margin-bottom: 32px;">
                      <tr>
                        <td style="padding: 16px 20px; border-right: 1px solid #e5e7eb;">
                          <p style="margin: 0; font-size: 11px; color: #999; text-transform: uppercase; letter-spacing: 1px;">Order Number</p>
                          <p style="margin: 4px 0 0; font-size: 14px; font-weight: 700; color: #111; font-family: monospace;">#${orderId.slice(-8).toUpperCase()}</p>
                        </td>
                        <td style="padding: 16px 20px; border-right: 1px solid #e5e7eb;">
                          <p style="margin: 0; font-size: 11px; color: #999; text-transform: uppercase; letter-spacing: 1px;">Date</p>
                          <p style="margin: 4px 0 0; font-size: 14px; font-weight: 600; color: #111;">${orderDate}</p>
                        </td>
                        <td style="padding: 16px 20px;">
                          <p style="margin: 0; font-size: 11px; color: #999; text-transform: uppercase; letter-spacing: 1px;">Payment</p>
                          <p style="margin: 4px 0 0; font-size: 14px; font-weight: 600; color: #111;">${paymentMethod}</p>
                        </td>
                      </tr>
                    </table>

                    <!-- Items Table -->
                    <h3 style="margin: 0 0 12px; font-size: 15px; color: #111; text-transform: uppercase; letter-spacing: 1px;">Order Items</h3>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                      <thead>
                        <tr style="border-bottom: 2px solid #111;">
                          <th style="padding: 8px; text-align: left; font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 0.5px;">Product</th>
                          <th style="padding: 8px; text-align: center; font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 0.5px;">Qty</th>
                          <th style="padding: 8px; text-align: right; font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 0.5px;">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${itemRows}
                      </tbody>
                    </table>

                    <!-- Totals -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 32px;">
                      <tr>
                        <td style="padding: 8px 0; color: #666; font-size: 14px;">Subtotal</td>
                        <td style="padding: 8px 0; text-align: right; color: #333; font-size: 14px;">$${subtotal.toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #666; font-size: 14px;">Delivery Fee</td>
                        <td style="padding: 8px 0; text-align: right; color: #333; font-size: 14px;">$${deliveryFee.toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td colspan="2" style="border-top: 2px solid #111; padding: 0;"></td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0; color: #111; font-size: 18px; font-weight: 700;">Total</td>
                        <td style="padding: 12px 0; text-align: right; color: #111; font-size: 18px; font-weight: 700;">$${totalPrice.toFixed(2)}</td>
                      </tr>
                    </table>

                    <!-- Shipping Address -->
                    <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 32px;">
                      <h3 style="margin: 0 0 12px; font-size: 13px; color: #999; text-transform: uppercase; letter-spacing: 1px;">Shipping Address</h3>
                      <p style="margin: 0; color: #111; font-weight: 600; font-size: 15px;">${shippingAddress.fullName}</p>
                      <p style="margin: 4px 0 0; color: #555; font-size: 14px;">${shippingAddress.address}</p>
                      <p style="margin: 2px 0 0; color: #555; font-size: 14px;">${shippingAddress.city}, ${shippingAddress.postalCode}</p>
                      <p style="margin: 8px 0 0; color: #555; font-size: 14px;">📞 ${shippingAddress.phone}</p>
                      <p style="margin: 2px 0 0; color: #555; font-size: 14px;">✉️ ${shippingAddress.email}</p>
                    </div>

                    <!-- CTA -->
                    <div style="text-align: center; margin-bottom: 16px;">
                      <a href="${process.env.FRONTEND_URL}/orders"
                         style="display: inline-block; background-color: #111; color: #fff; padding: 14px 36px; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 600; letter-spacing: 1px;">
                        TRACK YOUR ORDER
                      </a>
                    </div>

                    <p style="text-align: center; color: #999; font-size: 13px; margin: 0;">
                      You can also view your order details in your account.
                    </p>

                  </td>
                </tr>

                <!-- FOOTER -->
                <tr>
                  <td style="background: #f9fafb; padding: 24px 32px; border-radius: 0 0 12px 12px; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 0 0 8px; color: #999; font-size: 12px; text-align: center;">
                      If you have any questions about your order, reply to this email or contact us at
                      <a href="mailto:${process.env.SMTP_USER}" style="color: #666;">${process.env.SMTP_USER}</a>
                    </p>
                    <p style="margin: 0; color: #bbb; font-size: 11px; text-align: center;">
                      © ${new Date().getFullYear()} IntelliCart. All rights reserved.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Order confirmation email sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending order confirmation email:", error);
    // Don't throw — email failure should not break order placement
    return { success: false, error: error.message };
  }
};

export default {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendOrderConfirmationEmail,
};
