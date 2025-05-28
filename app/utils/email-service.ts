import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

interface EmailTemplate {
  to: string
  subject: string
  html: string
}

// Email templates
export function createVerificationEmailTemplate(verificationUrl: string, name: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Fitback Account</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8f9fa;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #4A2B6B 0%, #6B46C1 100%); padding: 40px 20px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 32px; font-weight: bold;">Fitback</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 18px;">Welcome to the future of fashion feedback</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 20px;">
          <h2 style="color: #4A2B6B; margin: 0 0 20px 0; font-size: 28px;">Welcome, ${name}! 👋</h2>
          
          <p style="color: #374151; font-size: 18px; line-height: 1.6; margin: 0 0 30px 0;">
            Thank you for joining Fitback! We're excited to help you get honest feedback on your outfits and style choices.
          </p>
          
          <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
            To get started, please verify your email address by clicking the button below:
          </p>
          
          <!-- CTA Button -->
          <div style="text-align: center; margin: 40px 0;">
            <a href="${verificationUrl}" 
               style="display: inline-block; background: linear-gradient(135deg, #4A2B6B 0%, #6B46C1 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: bold; font-size: 18px; box-shadow: 0 4px 12px rgba(74, 43, 107, 0.3);">
              Verify My Email
            </a>
          </div>
          
          <p style="color: #6B7280; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="${verificationUrl}" style="color: #4A2B6B; word-break: break-all;">${verificationUrl}</a>
          </p>
          
          <div style="border-top: 1px solid #E5E7EB; margin: 40px 0 0 0; padding: 30px 0 0 0;">
            <h3 style="color: #4A2B6B; margin: 0 0 15px 0; font-size: 20px;">What's next?</h3>
            <ul style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0; padding-left: 20px;">
              <li style="margin-bottom: 8px;">Complete your profile setup</li>
              <li style="margin-bottom: 8px;">Upload your first outfit photo</li>
              <li style="margin-bottom: 8px;">Get honest feedback from our community</li>
              <li>Earn rewards for helping others!</li>
            </ul>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #F9FAFB; padding: 30px 20px; text-align: center; border-top: 1px solid #E5E7EB;">
          <p style="color: #6B7280; font-size: 14px; margin: 0 0 10px 0;">
            This email was sent to you because you signed up for Fitback.
          </p>
          <p style="color: #6B7280; font-size: 14px; margin: 0;">
            © 2024 Fitback. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}

export function createPasswordResetEmailTemplate(resetUrl: string, name: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Fitback Password</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8f9fa;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #4A2B6B 0%, #6B46C1 100%); padding: 40px 20px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 32px; font-weight: bold;">Fitback</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 18px;">Password Reset Request</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 20px;">
          <h2 style="color: #4A2B6B; margin: 0 0 20px 0; font-size: 28px;">Hi ${name},</h2>
          
          <p style="color: #374151; font-size: 18px; line-height: 1.6; margin: 0 0 30px 0;">
            We received a request to reset your password for your Fitback account.
          </p>
          
          <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
            Click the button below to create a new password:
          </p>
          
          <!-- CTA Button -->
          <div style="text-align: center; margin: 40px 0;">
            <a href="${resetUrl}" 
               style="display: inline-block; background: linear-gradient(135deg, #4A2B6B 0%, #6B46C1 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: bold; font-size: 18px; box-shadow: 0 4px 12px rgba(74, 43, 107, 0.3);">
              Reset My Password
            </a>
          </div>
          
          <p style="color: #6B7280; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="${resetUrl}" style="color: #4A2B6B; word-break: break-all;">${resetUrl}</a>
          </p>
          
          <div style="background-color: #FEF3C7; border: 1px solid #F59E0B; border-radius: 8px; padding: 20px; margin: 30px 0;">
            <p style="color: #92400E; font-size: 14px; margin: 0; font-weight: 500;">
              ⚠️ If you didn't request this password reset, please ignore this email. Your password will remain unchanged.
            </p>
          </div>
          
          <p style="color: #6B7280; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
            This link will expire in 1 hour for security reasons.
          </p>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #F9FAFB; padding: 30px 20px; text-align: center; border-top: 1px solid #E5E7EB;">
          <p style="color: #6B7280; font-size: 14px; margin: 0 0 10px 0;">
            This email was sent to you because a password reset was requested for your Fitback account.
          </p>
          <p style="color: #6B7280; font-size: 14px; margin: 0;">
            © 2024 Fitback. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}

// Email sending functions
export async function sendVerificationEmail(email: string, name: string, verificationToken: string) {
  try {
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify-email?token=${verificationToken}`

    const { data, error } = await resend.emails.send({
      from: "Fitback <noreply@tashion.ai>",
      to: email,
      subject: "Welcome to Fitback! Please verify your email",
      html: createVerificationEmailTemplate(verificationUrl, name),
    })

    if (error) {
      console.error("[EMAIL SERVICE] Error sending verification email:", error)
      return { success: false, error: error.message }
    }

    console.log("[EMAIL SERVICE] Verification email sent successfully:", data?.id)
    return { success: true, emailId: data?.id }
  } catch (error) {
    console.error("[EMAIL SERVICE] Unexpected error sending verification email:", error)
    return { success: false, error: "Failed to send verification email" }
  }
}

export async function sendPasswordResetEmail(email: string, name: string, resetToken: string) {
  try {
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${resetToken}`

    const { data, error } = await resend.emails.send({
      from: "Fitback <noreply@tashion.ai>",
      to: email,
      subject: "Reset your Fitback password",
      html: createPasswordResetEmailTemplate(resetUrl, name),
    })

    if (error) {
      console.error("[EMAIL SERVICE] Error sending password reset email:", error)
      return { success: false, error: error.message }
    }

    console.log("[EMAIL SERVICE] Password reset email sent successfully:", data?.id)
    return { success: true, emailId: data?.id }
  } catch (error) {
    console.error("[EMAIL SERVICE] Unexpected error sending password reset email:", error)
    return { success: false, error: "Failed to send password reset email" }
  }
}

export async function sendWelcomeEmail(email: string, name: string) {
  try {
    const { data, error } = await resend.emails.send({
      from: "Fitback <noreply@tashion.ai>",
      to: email,
      subject: "Welcome to Fitback! 🎉",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #4A2B6B 0%, #6B46C1 100%); padding: 40px 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 32px;">Welcome to Fitback, ${name}! 🎉</h1>
          </div>
          <div style="padding: 40px 20px;">
            <p style="font-size: 18px; color: #374151;">Your email has been verified and your account is now active!</p>
            <p style="font-size: 16px; color: #374151;">You can now start uploading outfits and getting feedback from our community.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
                 style="display: inline-block; background: linear-gradient(135deg, #4A2B6B 0%, #6B46C1 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: bold;">
                Go to Dashboard
              </a>
            </div>
          </div>
        </div>
      `,
    })

    if (error) {
      console.error("[EMAIL SERVICE] Error sending welcome email:", error)
      return { success: false, error: error.message }
    }

    console.log("[EMAIL SERVICE] Welcome email sent successfully:", data?.id)
    return { success: true, emailId: data?.id }
  } catch (error) {
    console.error("[EMAIL SERVICE] Unexpected error sending welcome email:", error)
    return { success: false, error: "Failed to send welcome email" }
  }
}
