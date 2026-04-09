import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
  console.log('=== Admission Email API Called ===');
  try {
    const { applicantName, applicantEmail, applicantId, program } = await request.json();
    console.log('Request data:', { applicantName, applicantEmail, applicantId, program });

    // Validate required fields
    if (!applicantName || !applicantEmail || !applicantId || !program) {
      console.error('Missing required fields:', { applicantName, applicantEmail, applicantId, program });
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log('Environment variables check:', {
      EMAIL_USER: !!process.env.EMAIL_USER,
      EMAIL_PASSWORD: !!process.env.EMAIL_PASSWORD,
      EMAIL_USER_VALUE: process.env.EMAIL_USER
    });

    // Create nodemailer transporter (exact same config as working contact form)
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    // Email template
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Admission Application Confirmation</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #000054; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .admission-id { background-color: #E32845; color: white; padding: 15px; text-align: center; font-size: 18px; font-weight: bold; margin: 20px 0; }
          .footer { padding: 20px; text-align: center; color: #666; font-size: 14px; }
          .important { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; margin: 20px 0; border-radius: 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>TTech Initiative</h1>
            <h2>Admission Application Confirmation</h2>
          </div>
          
          <div class="content">
            <h3>Dear ${applicantName},</h3>
            
            <p>Thank you for submitting your admission application to TTech Initiative for the <strong>${program}</strong> program.</p>
            
            <p>Your application has been successfully received and is now under review. Please save the following admission ID for your records:</p>
            
            <div class="admission-id">
              Your Admission ID: ${applicantId}
            </div>
            
            <div class="important">
              <strong>Important:</strong> Please keep this Admission ID safe. You will need it to check your application status and for all future correspondence regarding your application.
            </div>
            
            <h4>What happens next?</h4>
            <ul>
              <li>Our admissions team will review your application</li>
              <li>You can check your application status using your Admission ID</li>
              <li>We will notify you of any updates via email</li>
              <li>The review process typically takes 5-10 business days</li>
            </ul>
            
            <h4>Check Your Application Status</h4>
            <p>You can check your application status anytime by visiting our website and using your Admission ID: <strong>${applicantId}</strong></p>
            
            <p>If you have any questions, please don't hesitate to contact our admissions office.</p>
            
            <p>Best regards,<br>
            <strong>TTech Initiative Admissions Team</strong></p>
          </div>
          
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>&copy; 2024 TTech Initiative. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email (using same pattern as working contact form)
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: applicantEmail,
      subject: `Admission Application Confirmation - ID: ${applicantId}`,
      html: htmlContent,
    };
    
    console.log('Attempting to send email with options:', {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject
    });
    
    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully to:', applicantEmail);

    return NextResponse.json(
      { message: 'Email sent successfully' },
      { status: 200 }
    );

  } catch (error: unknown) {
    console.error('Error sending email:', error);
    if (error instanceof Error) {
      const nodemailerErr = error as { code?: string, command?: string, response?: string, responseCode?: number };
      console.error('Error details:', {
        message: error.message,
        code: nodemailerErr.code,
        command: nodemailerErr.command,
        response: nodemailerErr.response,
        responseCode: nodemailerErr.responseCode
      });
    }
    return NextResponse.json(
      { error: 'Failed to send email. Please try again later.' },
      { status: 500 }
    );
  }
}
