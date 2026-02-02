'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Student, Referral } from '@/types';
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

export default function StudentDetailPage() {
    const params = useParams();
    const studentId = params.id as string;
    const { userProfile, loading } = useRequireAuth(['teacher', 'school_admin', 'clinic_admin']);

    const [student, setStudent] = useState<Student | null>(null);
    const [referrals, setReferrals] = useState<(Referral & { id: string })[]>([]);
    const [loadingData, setLoadingData] = useState(true);

    useEffect(() => {
        if (!loading && userProfile && studentId) {
            fetchStudentData();
        }
    }, [loading, userProfile, studentId]);

    const fetchStudentData = async () => {
        try {
            // Fetch student
            const studentDoc = await getDoc(doc(db, 'students', studentId));
            if (studentDoc.exists()) {
                setStudent({ id: studentDoc.id, ...studentDoc.data() } as Student);
            }

            // Fetch referrals for this student
            const q = query(
                collection(db, 'referrals'),
                where('studentId', '==', studentId),
                orderBy('createdAt', 'desc')
            );
            const snapshot = await getDocs(q);
            const referralsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate(),
                updatedAt: doc.data().updatedAt?.toDate(),
            })) as (Referral & { id: string })[];
            setReferrals(referralsData);
        } catch (error) {
            console.error('Error fetching student data:', error);
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

    if (!student) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Card>
                    <CardContent className="py-12 text-center">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Student Not Found</h2>
                        <p className="text-gray-600 mb-6">The student you're looking for doesn't exist.</p>
                        <Link href="/students">
                            <Button>Back to Students</Button>
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
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Link href="/dashboard" className="hover:text-gray-900">Dashboard</Link>
                            <span>/</span>
                            <Link href="/students" className="hover:text-gray-900">Students</Link>
                            <span>/</span>
                            <span className="text-gray-900 font-medium">{student.firstName} {student.lastName}</span>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Left Column - Student Info */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                                        <span className="text-white text-2xl font-bold">
                                            {student.firstName[0]}{student.lastName[0]}
                                        </span>
                                    </div>
                                    <div>
                                        <CardTitle className="text-2xl">{student.firstName} {student.lastName}</CardTitle>
                                        <CardDescription>Grade {student.grade}</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Date of Birth</label>
                                    <p className="text-gray-900">{formatDate(student.dateOfBirth)}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Student ID</label>
                                    <p className="text-gray-900 font-mono text-sm">{student.studentId}</p>
                                </div>
                                {student.homeLanguage && (
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Home Language</label>
                                        <p className="text-gray-900">{student.homeLanguage}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Parent/Guardian</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Name</label>
                                    <p className="text-gray-900">{student.parentName}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Email</label>
                                    <p className="text-gray-900">{student.parentEmail}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Phone</label>
                                    <p className="text-gray-900">{student.parentPhone}</p>
                                </div>
                                <div className="pt-4 border-t border-gray-200">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-3 h-3 rounded-full ${student.hasParentConsent ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                        <span className="text-sm text-gray-700">
                                            {student.hasParentConsent ? 'Parent consent received' : 'Consent pending'}
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Quick Actions</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <Link href={`/referrals/new?studentId=${student.id}`}>
                                    <Button className="w-full">
                                        New Referral for {student.firstName}
                                    </Button>
                                </Link>
                                <Button variant="outline" className="w-full">
                                    Edit Student Info
                                </Button>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column - Referral History */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>Referral History</CardTitle>
                                        <CardDescription>All referrals for this student</CardDescription>
                                    </div>
                                    <div className="text-3xl font-bold text-blue-600">{referrals.length}</div>
                                </div>
                            </CardHeader>
                        </Card>

                        {referrals.length === 0 ? (
                            <Card>
                                <CardContent className="py-12 text-center">
                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Referrals Yet</h3>
                                    <p className="text-gray-600 mb-6">This student has no referrals on record.</p>
                                    <Link href={`/referrals/new?studentId=${student.id}`}>
                                        <Button>Create First Referral</Button>
                                    </Link>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-4">
                                {referrals.map((referral) => (
                                    <Card key={referral.id} hover className="cursor-pointer">
                                        <CardContent className="py-4">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <h3 className="text-lg font-semibold text-gray-900">{referral.caseNumber}</h3>
                                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${STATUS_COLORS[referral.status as keyof typeof STATUS_COLORS]}`}>
                                                            {referral.status.replace('_', ' ').toUpperCase()}
                                                        </span>
                                                        {referral.priority === 'urgent' && (
                                                            <span className="px-2 py-1 text-xs font-bold bg-red-100 text-red-800 rounded-full">
                                                                🔴 URGENT
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-sm text-gray-600 space-y-1">
                                                        <p>Submitted: {formatDate(referral.createdAt)}</p>
                                                        <p>Last Updated: {formatDate(referral.updatedAt)}</p>
                                                    </div>
                                                </div>
                                                <Link
                                                    href={userProfile?.role === 'clinic_admin'
                                                        ? `/clinic/cases/${referral.id}`
                                                        : `/referrals/${referral.id}`
                                                    }
                                                >
                                                    <Button size="sm">View Details</Button>
                                                </Link>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
