import nodemailer from "nodemailer";

// Create reusable transporter object using the default SMTP transport
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: parseInt(process.env.EMAIL_PORT || "587"),
    secure: parseInt(process.env.EMAIL_PORT || "587") === 465, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER || "",
      pass: process.env.EMAIL_PASSWORD || "",
    },
  });
};

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send email using nodemailer
 */
export const sendEmail = async (options: EmailOptions): Promise<void> => {
  try {
    // Check if email is configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.log(`Email would be sent to ${options.to} (Email service not configured)`);
      console.log(`Subject: ${options.subject}`);
      return;
    }

    const transporter = createTransporter();

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'DigiPlot Property Management'}" <${process.env.EMAIL_FROM || 'noreply@digiplot.com'}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${options.to}`);
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send email");
  }
};

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = async (
  email: string,
  resetToken: string,
  firstName: string
): Promise<void> => {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Account Password</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f4f4f4;
        }
        .container {
          background-color: #ffffff;
          padding: 40px;
          border-radius: 10px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .logo {
          font-size: 28px;
          font-weight: bold;
          color: #2563eb;
          margin-bottom: 10px;
        }
        .title {
          font-size: 24px;
          color: #1f2937;
          margin-bottom: 20px;
        }
        .content {
          font-size: 16px;
          line-height: 1.6;
          margin-bottom: 30px;
        }
        .reset-button {
          display: inline-block;
          background-color: #2563eb;
          color: white;
          padding: 14px 28px;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 600;
          text-align: center;
          margin: 20px 0;
        }
        .reset-button:hover {
          background-color: #1d4ed8;
        }
        .footer {
          margin-top: 30px;
          font-size: 14px;
          color: #6b7280;
          text-align: center;
          border-top: 1px solid #e5e7eb;
          padding-top: 20px;
        }
        .warning {
          background-color: #fef3c7;
          border: 1px solid #f59e0b;
          border-radius: 6px;
          padding: 12px;
          margin: 20px 0;
          font-size: 14px;
          color: #92400e;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">DigiPlot Property Management</div>
        </div>
        
        <h2 class="title">Reset Your Password</h2>
        
        <div class="content">
          <p>Hello ${firstName},</p>
          
          <p>We received a request to reset your password for your DigiPlot Property Management account. If you didn't make this request, please ignore this email.</p>
          
          <p>To reset your password, click the button below:</p>
          
          <div style="text-align: center;">
            <a href="${resetUrl}" class="reset-button">Reset Password</a>
          </div>
          
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #2563eb;">${resetUrl}</p>
          
          <div class="warning">
            <strong>Important:</strong> This link will expire in 1 hour for security reasons. If you need to reset your password after this time, please request a new reset link.
          </div>
        </div>
        
        <div class="footer">
          <p>Do not reply to this email. This is a system generated email from DigiPlot Property Management.</p>
          <p>If you have any questions, please contact your system administrator.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
    Reset Your Password - DigiPlot Property Management
    
    Hello ${firstName},
    
    We received a request to reset your password for your DigiPlot Property Management account. If you didn't make this request, please ignore this email.
    
    To reset your password, visit the following link:
    ${resetUrl}
    
    Important: This link will expire in 1 hour for security reasons.
    
    If you have any questions, please contact your system administrator.
    
    Best regards,
    DigiPlot Property Management
  `;

  // Log email content if not configured for actual sending
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.log("=== PASSWORD RESET EMAIL (Not sent - Email not configured) ===");
    console.log(`To: ${email}`);
    console.log(`Reset URL: ${resetUrl}`);
    console.log("=== END EMAIL ===");
  }

  await sendEmail({
    to: email,
    subject: "Reset Your Password - DigiPlot Property Management",
    html: htmlContent,
    text: textContent,
  });
};
