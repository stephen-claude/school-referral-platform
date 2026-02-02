'use client';

import { useState } from 'react';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function EmailPreviewPage() {
    const { userProfile, loading } = useRequireAuth(['clinic_admin']);
    const [selectedTemplate, setSelectedTemplate] = useState('referral_submitted');
    const [sending, setSending] = useState(false);

    const templates = [
        { value: 'referral_submitted', label: 'Referral Submitted (to Teacher)', icon: '✅' },
        { value: 'status_update', label: 'Status Update (to Teacher)', icon: '📋' },
        { value: 'urgent_case', label: 'Urgent Case Alert (to Clinic)', icon: '🚨' },
        { value: 'parent_notification', label: 'Parent Notification', icon: '👪' },
        { value: 'weekly_digest', label: 'Weekly Digest (to Clinic)', icon: '📊' },
    ];

    const mockData: Record<string, any> = {
        referral_submitted: {
            teacherName: 'Sarah Johnson',
            studentName: 'Emma Smith',
            caseNumber: 'REF-2024-001',
            submittedDate: 'January 15, 2024',
        },
        status_update: {
            teacherName: 'Sarah Johnson',
            studentName: 'Emma Smith',
            caseNumber: 'REF-2024-001',
            oldStatus: 'new',
            newStatus: 'in_review',
            message: 'We have begun our review of this case and will provide an update within 48 hours.',
        },
        urgent_case: {
            studentName: 'Michael Chen',
            caseNumber: 'REF-2024-015',
            teacherName: 'David Martinez',
            schoolName: 'Lincoln Elementary School',
            riskScore: 87,
            flags: [
                'Multiple severe visual symptoms reported',
                'Significant impact on reading performance',
                'Symptoms worsening over past 3 months',
            ],
        },
        parent_notification: {
            parentName: 'Jennifer Smith',
            studentName: 'Emma Smith',
            teacherName: 'Sarah Johnson',
            schoolName: 'Washington Elementary',
            caseNumber: 'REF-2024-001',
            concerns: [
                'Difficulty tracking text while reading',
                'Frequent headaches during classroom work',
                'Closes one eye when focusing on the board',
            ],
        },
        weekly_digest: {
            weekStart: 'Jan 8, 2024',
            weekEnd: 'Jan 14, 2024',
            stats: {
                newReferrals: 12,
                completedCases: 8,
                urgentCases: 3,
                avgResponseTime: '2.3 days',
            },
            topSchools: [
                { name: 'Lincoln Elementary', count: 5 },
                { name: 'Washington Middle School', count: 3 },
                { name: 'Jefferson High School', count: 2 },
            ],
        },
    };

    const sendTestEmail = async () => {
        setSending(true);
        try {
            const response = await fetch('/api/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: selectedTemplate,
                    data: {
                        ...mockData[selectedTemplate],
                        to: userProfile?.email, // Send to self for testing
                    },
                }),
            });

            if (response.ok) {
                toast.success(`Test email sent to ${userProfile?.email}`);
            } else {
                toast.error('Failed to send test email');
            }
        } catch (error) {
            console.error('Error sending test email:', error);
            toast.error('Error sending test email');
        } finally {
            setSending(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navigation */}
            <nav className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center h-16">
                        <Link href="/clinic/triage" className="text-blue-600 hover:text-blue-700 flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Back to Triage
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Email Templates Preview</h1>
                    <p className="text-gray-600 mt-1">Preview and test email notification templates</p>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Left Column - Template Selector */}
                    <div>
                        <Card>
                            <CardHeader>
                                <CardTitle>Select Template</CardTitle>
                                <CardDescription>Choose an email template to preview</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {templates.map((template) => (
                                    <button
                                        key={template.value}
                                        onClick={() => setSelectedTemplate(template.value)}
                                        className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all ${selectedTemplate === template.value
                                                ? 'border-blue-600 bg-blue-50'
                                                : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">{template.icon}</span>
                                            <div>
                                                <div className="font-medium text-gray-900">{template.label}</div>
                                            </div>
                                        </div>
                                    </button>
                                ))}

                                <div className="pt-4">
                                    <Button
                                        onClick={sendTestEmail}
                                        loading={sending}
                                        className="w-full"
                                    >
                                        📧 Send Test Email
                                    </Button>
                                    <p className="text-xs text-gray-500 mt-2 text-center">
                                        Will send to {userProfile?.email}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column - Preview */}
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Preview</CardTitle>
                                <CardDescription>
                                    {templates.find(t => t.value === selectedTemplate)?.label}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="bg-gray-100 p-4 rounded-lg">
                                    <iframe
                                        srcDoc={getEmailHTML(selectedTemplate, mockData[selectedTemplate])}
                                        className="w-full h-[600px] bg-white rounded border border-gray-300"
                                        title="Email Preview"
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Helper function to generate email HTML (imported from email.ts logic)
function getEmailHTML(type: string, data: any): string {
    // This would match the templates from email.ts
    // For now, returning a placeholder - in production, import from email.ts
    const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const emailStyles = `
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #1f2937; margin: 0; padding: 0; background-color: #f3f4f6; }
      .email-container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
      .header { background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%); padding: 40px 30px; text-align: center; }
      .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 600; }
      .content { padding: 40px 30px; }
      .button { display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%); color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 600; }
      .footer { padding: 30px; text-align: center; background: #f9fafb; border-top: 1px solid #e5e7eb; }
    </style>
  `;

    return `
    <!DOCTYPE html>
    <html>
      <head>${emailStyles}</head>
      <body>
        <div class="email-container">
          <div class="header">
            <h1>Email Template Preview</h1>
          </div>
          <div class="content">
            <p>Template: <strong>${type}</strong></p>
            <p>This is a preview. Actual templates are rendered server-side.</p>
            <pre style="background: #f3f4f6; padding: 15px; border-radius: 4px; overflow-x: auto;">
${JSON.stringify(data, null, 2)}
            </pre>
          </div>
          <div class="footer">
            <p>School Referral Platform</p>
          </div>
        </div>
      </body>
    </html>
  `;
}
