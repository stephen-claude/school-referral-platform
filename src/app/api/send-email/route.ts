import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { type, data } = body;

        if (!type) {
            return NextResponse.json(
                { error: 'Email type is required' },
                { status: 400 }
            );
        }

        // Send email using the new unified system
        const result = await sendEmail(type, data);

        if (!result || result.error) {
            return NextResponse.json(
                { error: 'Failed to send email', details: result?.error },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Email sent successfully',
            data: result.data,
        });
    } catch (error: any) {
        console.error('Email API error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
