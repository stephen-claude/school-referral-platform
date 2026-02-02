'use client';

import { useState, useEffect } from 'react';

export const dynamicParams = true;
import { useParams } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Referral, Questionnaire, Student } from '@/types';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';

const STATUS_COLORS = {
    new: 'bg-blue-100 text-blue-800',
    in_review: 'bg-yellow-100 text-yellow-800',
    waiting_info: 'bg-orange-100 text-orange-800',
    waiting_consent: 'bg-orange-100 text-orange-800',
    closed: 'bg-gray-100 text-gray-800',
    completed: 'bg-green-100 text-green-800',
};

export default function ReferralDetailPage() {
    const params = useParams();
    const referralId = params.id as string;
    const { userProfile, loading } = useRequireAuth(['teacher', 'school_admin', 'clinic_admin']);

    const [referral, setReferral] = useState<Referral | null>(null);
    const [student, setStudent] = useState<Student | null>(null);
    const [questionnaire, setQuestionnaire] = useState<Questionnaire | null>(null);
    const [loadingData, setLoadingData] = useState(true);

    useEffect(() => {
        if (!loading && userProfile && referralId) {
            fetchReferralData();
        }
    }, [loading, userProfile, referralId]);

    const fetchReferralData = async () => {
        try {
            // Fetch referral
            const referralDoc = await getDoc(doc(db, 'referrals', referralId));
            if (referralDoc.exists()) {
                const referralData = {
                    id: referralDoc.id,
                    ...referralDoc.data(),
                    createdAt: referralDoc.data().createdAt?.toDate(),
                    updatedAt: referralDoc.data().updatedAt?.toDate(),
                } as Referral;
                setReferral(referralData);

                // Fetch student
                if (referralData.studentId) {
                    const studentDoc = await getDoc(doc(db, 'students', referralData.studentId));
                    if (studentDoc.exists()) {
                        setStudent({
                            id: studentDoc.id,
                            ...studentDoc.data(),
                        } as Student);
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
            console.error('Error fetching referral data:', error);
        } finally {
            setLoadingData(false);
        }
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
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Referral Not Found</h2>
                        <p className="text-gray-600 mb-6">The referral you're looking for doesn't exist.</p>
                        <Link href="/referrals">
                            <Button>Back to Referrals</Button>
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
                        <Link href="/referrals" className="text-blue-600 hover:text-blue-700 flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Back to Referrals
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header Card */}
                <Card className="mb-8">
                    <CardHeader>
                        <div className="flex items-start justify-between">
                            <div>
                                <CardTitle className="text-3xl">{referral.caseNumber}</CardTitle>
                                <CardDescription className="mt-2">
                                    Submitted {formatDate(referral.createdAt)}
                                </CardDescription>
                            </div>
                            <span
                                className={`px-3 py-1.5 text-sm font-medium rounded-full ${STATUS_COLORS[referral.status as keyof typeof STATUS_COLORS] || 'bg-gray-100 text-gray-800'
                                    }`}
                            >
                                {referral.status.replace('_', ' ').toUpperCase()}
                            </span>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid md:grid-cols-3 gap-6">
                            <div>
                                <h4 className="text-sm font-medium text-gray-500 mb-1">Student</h4>
                                <p className="text-gray-900 font-medium">
                                    {student ? `${student.firstName} ${student.lastName}` : 'Loading...'}
                                </p>
                                {student?.grade && <p className="text-sm text-gray-600">Grade {student.grade}</p>}
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-gray-500 mb-1">Priority</h4>
                                <span
                                    className={`inline-flex items-center px-2 py-1 text-sm font-medium rounded ${referral.priority === 'urgent'
                                        ? 'bg-red-100 text-red-800'
                                        : referral.priority === 'high'
                                            ? 'bg-orange-100 text-orange-800'
                                            : 'bg-gray-100 text-gray-600'
                                        }`}
                                >
                                    {referral.priority.charAt(0).toUpperCase() + referral.priority.slice(1)}
                                </span>
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
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-gray-900">Questionnaire Responses</h2>

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
                                            <h4 className="text-sm font-medium text-gray-700 mb-2">Additional Notes:</h4>
                                            <p className="text-gray-700">{questionnaire.readingPerformance.notes}</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {questionnaire.attentionBehavior && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Attention & Behavior</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {questionnaire.attentionBehavior.issues.length > 0 ? (
                                        <ul className="list-disc list-inside space-y-1 text-gray-700">
                                            {questionnaire.attentionBehavior.issues.map((item, idx) => (
                                                <li key={idx}>{item}</li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-gray-500 italic">No issues selected</p>
                                    )}
                                    {questionnaire.attentionBehavior.notes && (
                                        <div className="mt-4 pt-4 border-t border-gray-200">
                                            <h4 className="text-sm font-medium text-gray-700 mb-2">Additional Notes:</h4>
                                            <p className="text-gray-700">{questionnaire.attentionBehavior.notes}</p>
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
                                            <h4 className="text-sm font-medium text-gray-700 mb-2">Additional Notes:</h4>
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
                                    <div className="space-y-4">
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-700 mb-2">Main Concerns:</h4>
                                            <p className="text-gray-700 whitespace-pre-wrap">{questionnaire.teacherSummary.description}</p>
                                        </div>
                                        {questionnaire.teacherSummary.duration && (
                                            <div>
                                                <h4 className="text-sm font-medium text-gray-700 mb-1">Duration:</h4>
                                                <p className="text-gray-700">{questionnaire.teacherSummary.duration}</p>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
