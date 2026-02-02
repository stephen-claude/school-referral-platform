'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/FormInputs';
import { InternalNotes } from '@/components/referrals/InternalNotes';
import { RiskScoringDisplay, generateMockRiskScore } from '@/components/referrals/RiskScoringDisplay';
import { generateReferralHTML, printReferral, downloadReferralHTML } from '@/lib/export';
import { Referral, Questionnaire, Student } from '@/types';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = [
    { value: 'new', label: 'New' },
    { value: 'in_review', label: 'In Review' },
    { value: 'waiting_info', label: 'Waiting for Info' },
    { value: 'waiting_consent', label: 'Waiting for Consent' },
    { value: 'completed', label: 'Completed' },
    { value: 'closed', label: 'Closed' },
];

const PRIORITY_OPTIONS = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' },
];

export default function CaseDetailPage() {
    const params = useParams();
    const caseId = params.id as string;
    const router = useRouter();
    const { userProfile, loading } = useRequireAuth(['clinic_admin']);

    const [referral, setReferral] = useState<Referral | null>(null);
    const [student, setStudent] = useState<Student | null>(null);
    const [questionnaire, setQuestionnaire] = useState<Questionnaire | null>(null);
    const [loadingData, setLoadingData] = useState(true);
    const [updating, setUpdating] = useState(false);

    const [newStatus, setNewStatus] = useState('');
    const [newPriority, setNewPriority] = useState('');
    const [notes, setNotes] = useState('');

    useEffect(() => {
        if (!loading && userProfile && caseId) {
            fetchCaseData();
        }
    }, [loading, userProfile, caseId]);

    const fetchCaseData = async () => {
        try {
            const referralDoc = await getDoc(doc(db, 'referrals', caseId));
            if (referralDoc.exists()) {
                const referralData = {
                    id: referralDoc.id,
                    ...referralDoc.data(),
                    createdAt: referralDoc.data().createdAt?.toDate(),
                    updatedAt: referralDoc.data().updatedAt?.toDate(),
                } as Referral;
                setReferral(referralData);
                setNewStatus(referralData.status);
                setNewPriority(referralData.priority);

                // Fetch student
                if (referralData.studentId) {
                    const studentDoc = await getDoc(doc(db, 'students', referralData.studentId));
                    if (studentDoc.exists()) {
                        setStudent({ id: studentDoc.id, ...studentDoc.data() } as Student);
                    }
                }

                // Fetch questionnaire
                if (referralData.questionnaireId) {
                    const questionnaireDoc = await getDoc(doc(db, 'questionnaires', referralData.questionnaireId));
                    if (questionnaireDoc.exists()) {
                        setQuestionnaire(questionnaireDoc.data() as Questionnaire);
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching case data:', error);
        } finally {
            setLoadingData(false);
        }
    };

    const handleUpdateStatus = async () => {
        if (!referral) return;

        setUpdating(true);
        try {
            await updateDoc(doc(db, 'referrals', caseId), {
                status: newStatus,
                priority: newPriority,
                updatedAt: serverTimestamp(),
            });

            // If status changed, send email notification
            if (newStatus !== referral.status) {
                try {
                    await fetch('/api/send-email', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            type: 'status_update',
                            data: {
                                teacherEmail: 'teacher@example.com', // TODO: Fetch teacher email
                                teacherName: 'Teacher', // TODO: Fetch teacher name
                                studentName: student ? `${student.firstName} ${student.lastName}` : 'Student',
                                caseNumber: referral.caseNumber,
                                oldStatus: referral.status,
                                newStatus: newStatus,
                                message: notes,
                            },
                        }),
                    });
                } catch (emailError) {
                    console.error('Failed to send email:', emailError);
                }
            }

            toast.success('Case updated successfully');
            setReferral({ ...referral, status: newStatus as any, priority: newPriority as any });
            setNotes('');
        } catch (error: any) {
            console.error('Error updating case:', error);
            toast.error(error.message || 'Failed to update case');
        } finally {
            setUpdating(false);
        }
    };

    const handleExport = () => {
        if (!referral || !student || !questionnaire) return;

        const exportData = {
            caseNumber: referral.caseNumber,
            studentName: `${student.firstName} ${student.lastName}`,
            dateOfBirth: formatDate(student.dateOfBirth),
            grade: student.grade || '',
            teacherName: 'Teacher Name', // TODO: Fetch from teacher data
            schoolName: 'School Name', // TODO: Fetch from school data
            submittedDate: formatDate(referral.createdAt),
            status: referral.status,
            priority: referral.priority,
            questionnaire,
            riskScore: generateMockRiskScore(questionnaire),
        };

        const htmlContent = generateReferralHTML(exportData);
        printReferral(htmlContent);
    };

    const handleDownload = () => {
        if (!referral || !student || !questionnaire) return;

        const exportData = {
            caseNumber: referral.caseNumber,
            studentName: `${student.firstName} ${student.lastName}`,
            dateOfBirth: formatDate(student.dateOfBirth),
            grade: student.grade || '',
            teacherName: 'Teacher Name',
            schoolName: 'School Name',
            submittedDate: formatDate(referral.createdAt),
            status: referral.status,
            priority: referral.priority,
            questionnaire,
            riskScore: generateMockRiskScore(questionnaire),
        };

        const htmlContent = generateReferralHTML(exportData);
        downloadReferralHTML(htmlContent, referral.caseNumber);
    };

    if (loading || loadingData) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            </div>
        );
    }

    if (!referral) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Card>
                    <CardContent className="py-12 text-center">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Case Not Found</h2>
                        <p className="text-gray-600 mb-6">The case you're looking for doesn't exist.</p>
                        <Link href="/clinic/triage">
                            <Button>Back to Triage</Button>
                        </Link>
                    </CardContent>
                </Card>
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

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Left Column - Case Details */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Header Card */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div>
                                        <CardTitle className="text-3xl">{referral.caseNumber}</CardTitle>
                                        <CardDescription className="mt-2">
                                            Submitted {formatDate(referral.createdAt)}
                                        </CardDescription>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" onClick={handleExport}>
                                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                            </svg>
                                            Print
                                        </Button>
                                        <Button variant="outline" size="sm" onClick={handleDownload}>
                                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            Download
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-500 mb-1">Student</h4>
                                        <p className="text-gray-900 font-medium">
                                            {student ? `${student.firstName} ${student.lastName}` : 'Loading...'}
                                        </p>
                                        {student?.grade && <p className="text-sm text-gray-600">Grade {student.grade}</p>}
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-500 mb-1">Last Updated</h4>
                                        <p className="text-gray-900">{formatDate(referral.updatedAt)}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Questionnaire Responses */}
                        {questionnaire && (
                            <div className="space-y-4">
                                <h2 className="text-2xl font-bold text-gray-900">Assessment Details</h2>

                                {questionnaire.readingPerformance && (
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Reading Performance</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            {questionnaire.readingPerformance.struggles.length > 0 ? (
                                                <ul className="list-disc list-inside space-y-1 text-gray-700">
                                                    {questionnaire.readingPerformance.struggles.map((item, idx) => (
                                                        <li key={idx}>{item}</li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <p className="text-gray-500 italic">No issues selected</p>
                                            )}
                                            {questionnaire.readingPerformance.notes && (
                                                <div className="mt-4 pt-4 border-t border-gray-200">
                                                    <p className="text-gray-700">{questionnaire.readingPerformance.notes}</p>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                )}

                                {questionnaire.visualSymptoms && (
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Visual Symptoms</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            {questionnaire.visualSymptoms.symptoms.length > 0 ? (
                                                <ul className="list-disc list-inside space-y-1 text-gray-700">
                                                    {questionnaire.visualSymptoms.symptoms.map((item, idx) => (
                                                        <li key={idx}>{item}</li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <p className="text-gray-500 italic">No symptoms reported</p>
                                            )}
                                            {questionnaire.visualSymptoms.notes && (
                                                <div className="mt-4 pt-4 border-t border-gray-200">
                                                    <p className="text-gray-700">{questionnaire.visualSymptoms.notes}</p>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                )}

                                {questionnaire.teacherSummary && (
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Teacher Summary</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-gray-700 whitespace-pre-wrap mb-4">{questionnaire.teacherSummary.description}</p>
                                            {questionnaire.teacherSummary.duration && (
                                                <div className="text-sm text-gray-600">
                                                    <span className="font-medium">Duration observed:</span> {questionnaire.teacherSummary.duration}
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Right Column - Actions */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Case Management</CardTitle>
                                <CardDescription>Update status and priority</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
                                    <select
                                        value={newStatus}
                                        onChange={(e) => setNewStatus(e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        {STATUS_OPTIONS.map((opt) => (
                                            <option key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Priority</label>
                                    <select
                                        value={newPriority}
                                        onChange={(e) => setNewPriority(e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        {PRIORITY_OPTIONS.map((opt) => (
                                            <option key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <Textarea
                                    label="Notes (optional)"
                                    placeholder="Add notes for teacher or internal reference..."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    rows={4}
                                />

                                <Button
                                    onClick={handleUpdateStatus}
                                    loading={updating}
                                    className="w-full"
                                    disabled={newStatus === referral.status && newPriority === referral.priority}
                                >
                                    Update Case
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Risk Scoring */}
                        {questionnaire && (
                            <RiskScoringDisplay score={generateMockRiskScore(questionnaire)} />
                        )}

                        {/* Internal Notes */}
                        <InternalNotes referralId={caseId} />

                        <Card>
                            <CardHeader>
                                <CardTitle>Quick Actions</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <Button variant="outline" className="w-full justify-start">
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    Message Teacher
                                </Button>
                                <Button variant="outline" className="w-full justify-start">
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    Generate Letter
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
