import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ContactFormData = await request.json();
    const { name, email, subject, message } = body;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Create nodemailer transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail', // You can change this to your email service
      auth: {
        user: process.env.EMAIL_USER, // Your email
        pass: process.env.EMAIL_PASSWORD, // Your app password
      },
    });

    // Email content for you (the recipient)
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.CONTACT_EMAIL || process.env.EMAIL_USER, // Your email address
      subject: `Contact Form: ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #000054 0%, #1a1a6e 100%); color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">New Contact Form Submission</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Benzard Sports Management Website</p>
          </div>
          
          <div style="padding: 30px; background: #f9f9f9;">
            <div style="background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <h2 style="color: #000054; margin-top: 0; border-bottom: 2px solid #E32845; padding-bottom: 10px;">Contact Details</h2>
              
              <div style="margin: 20px 0;">
                <strong style="color: #000054;">Name:</strong>
                <p style="margin: 5px 0 15px 0; color: #333;">${name}</p>
              </div>
              
              <div style="margin: 20px 0;">
                <strong style="color: #000054;">Email:</strong>
                <p style="margin: 5px 0 15px 0; color: #333;">
                  <a href="mailto:${email}" style="color: #E32845; text-decoration: none;">${email}</a>
                </p>
              </div>
              
              <div style="margin: 20px 0;">
                <strong style="color: #000054;">Subject:</strong>
                <p style="margin: 5px 0 15px 0; color: #333;">${subject}</p>
              </div>
              
              <div style="margin: 20px 0;">
                <strong style="color: #000054;">Message:</strong>
                <div style="margin: 10px 0; padding: 15px; background: #f8f9fa; border-left: 4px solid #E32845; border-radius: 4px;">
                  <p style="margin: 0; color: #333; line-height: 1.6; white-space: pre-wrap;">${message}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div style="background: #000054; color: white; padding: 15px; text-align: center; font-size: 14px;">
            <p style="margin: 0;">This message was sent from the Benzard Sports Management contact form</p>
            <p style="margin: 5px 0 0 0; opacity: 0.8;">Timestamp: ${new Date().toLocaleString()}</p>
          </div>
        </div>
      `,
    };

    // Auto-reply email for the sender
    const autoReplyOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Thank you for contacting Benzard Sports Management',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #000054 0%, #1a1a6e 100%); color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">Thank You for Contacting Us!</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Benzard Sports Management</p>
          </div>
          
          <div style="padding: 30px; background: #f9f9f9;">
            <div style="background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <p style="color: #333; line-height: 1.6; margin-top: 0;">Dear ${name},</p>
              
              <p style="color: #333; line-height: 1.6;">
                Thank you for reaching out to Benzard Sports Management. We have received your message and appreciate your interest in our work.
              </p>
              
              <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #E32845;">
                <p style="margin: 0; color: #333; font-weight: bold;">Your Message Summary:</p>
                <p style="margin: 5px 0 0 0; color: #666;">Subject: ${subject}</p>
              </div>
              
              <p style="color: #333; line-height: 1.6;">
                Our team will review your message and get back to you within 24-48 hours. If your inquiry is urgent, please don't hesitate to call us at +231 777 123 456.
              </p>
              
              <p style="color: #333; line-height: 1.6;">
                In the meantime, feel free to explore our website to learn more about our athlete development, matchday operations, and community programs.
              </p>
              
              <p style="color: #333; line-height: 1.6; margin-bottom: 0;">
                Best regards,<br>
                <strong style="color: #000054;">The Benzard Sports Management Team</strong>
              </p>
            </div>
          </div>
          
          <div style="background: #000054; color: white; padding: 20px; text-align: center;">
            <p style="margin: 0 0 10px 0; font-weight: bold;">Stay Connected</p>
            <p style="margin: 0; font-size: 14px; opacity: 0.9;">
              Email: info@benzardsportsmanagement.com<br>
              Phone: +231 777 123 456<br>
              Address: Paynesville City, Montserrado County, Liberia
            </p>
          </div>
        </div>
      `,
    };

    // Send both emails
    await transporter.sendMail(mailOptions);
    await transporter.sendMail(autoReplyOptions);

    return NextResponse.json(
      { message: 'Email sent successfully' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: 'Failed to send email. Please try again later.' },
      { status: 500 }
    );
  }
}
