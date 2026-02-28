import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { email } = body;

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        // Configure nodemailer with SMTP credentials from .env
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: Number(process.env.SMTP_PORT) || 465,
            secure: true,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        const mailOptions = {
            from: process.env.SMTP_USER || 'noreply@ccjournal.com',
            to: 'iqbalcode.nt@gmail.com',
            subject: 'New Newsletter Subscriber: C&C Journal',
            text: `A new user has subscribed to the C&C Journal newsletter!\n\nEmail: ${email}`,
            html: `<p>A new user has subscribed to the C&C Journal newsletter!</p><p><strong>Email:</strong> ${email}</p>`,
        };

        if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
            console.warn("SMTP_USER and SMTP_PASS are not set. Simulating success for now.");
            return NextResponse.json({ success: true, message: 'Simulated email send' }, { status: 200 });
        }

        await transporter.sendMail(mailOptions);

        return NextResponse.json({ success: true, message: 'Email sent' }, { status: 200 });
    } catch (error) {
        console.error('Error sending email:', error);
        return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }
}
