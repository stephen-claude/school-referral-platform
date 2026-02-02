'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Referral } from '@/types';
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

const STATUS_LABELS = {
    new: 'New',
    in_review: 'In Review',
    waiting_info: 'Waiting for Info',
    waiting_consent: 'Waiting for Consent',
    closed: 'Closed',
    completed: 'Completed',
};

export default function ReferralsPage() {
    const { userProfile, loading } = useRequireAuth(['teacher', 'school_admin', 'clinic_admin']);
    const [referrals, setReferrals] = useState<(Referral & { id: string; studentName?: string })[]>([]);
    const [loadingReferrals, setLoadingReferrals] = useState(true);
    const [filter, setFilter] = useState<'all' | 'active' | 'waiting' | 'closed'>('all');

    useEffect(() => {
        if (!loading && userProfile) {
            fetchReferrals();
        }
    }, [loading, userProfile]);

    const fetchReferrals = async () => {
        if (!userProfile) return;

        try {
            let q;
            if (userProfile.role === 'clinic_admin') {
                // Clinic admin sees all referrals
                q = query(collection(db, 'referrals'), orderBy('createdAt', 'desc'));
            } else if (userProfile.schoolId) {
                // Teachers and school admins see only their school's referrals
                q = query(
                    collection(db, 'referrals'),
                    where('schoolId', '==', userProfile.schoolId),
                    orderBy('createdAt', 'desc')
                );
            } else {
                setLoadingReferrals(false);
                return;
            }

            const snapshot = await getDocs(q);
            const referralsData = await Promise.all(
                snapshot.docs.map(async (docSnap) => {
                    const data = docSnap.data();

                    // Fetch student name
                    let studentName = 'Unknown Student';
                    if (data.studentId) {
                        try {
                            const studentDoc = await getDocs(
                                query(collection(db, 'students'), where('__name__', '==', data.studentId))
                            );
                            if (!studentDoc.empty) {
                                const student = studentDoc.docs[0].data();
                                studentName = `${student.firstName} ${student.lastName}`;
                            }
                        } catch (err) {
                            console.error('Error fetching student:', err);
                        }
                    }

                    return {
                        id: docSnap.id,
                        ...data,
                        studentName,
                        createdAt: data.createdAt?.toDate(),
                        updatedAt: data.updatedAt?.toDate(),
                    } as Referral & { id: string; studentName: string };
                })
            );

            setReferrals(referralsData);
        } catch (error) {
            console.error('Error fetching referrals:', error);
        } finally {
            setLoadingReferrals(false);
        }
    };

    const filteredReferrals = referrals.filter((ref) => {
        if (filter === 'all') return true;
        if (filter === 'active') return ['new', 'in_review'].includes(ref.status);
        if (filter === 'waiting') return ['waiting_info', 'waiting_consent'].includes(ref.status);
        if (filter === 'closed') return ['closed', 'completed'].includes(ref.status);
        return true;
    });

    if (loading || loadingReferrals) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <p className="mt-4 text-gray-600">Loading referrals...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navigation */}
            <nav className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <Link href="/dashboard" className="text-blue-600 hover:text-blue-700 flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Back to Dashboard
                        </Link>
                        {(userProfile?.role === 'teacher' || userProfile?.role === 'school_admin') && (
                            <Link href="/referrals/new">
                                <Button className="flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    New Referral
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Referrals</h1>
                    <p className="text-gray-600 mt-1">Track and manage vision assessment referrals</p>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-2 mb-6 border-b border-gray-200">
                    {[
                        { key: 'all', label: 'All' },
                        { key: 'active', label: 'Active' },
                        { key: 'waiting', label: 'Waiting' },
                        { key: 'closed', label: 'Closed' },
                    ].map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setFilter(tab.key as any)}
                            className={`px-4 py-2 font-medium border-b-2 transition-colors ${filter === tab.key
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            {tab.label}
                            <span className="ml-2 text-sm">
                                ({referrals.filter((ref) => {
                                    if (tab.key === 'all') return true;
                                    if (tab.key === 'active') return ['new', 'in_review'].includes(ref.status);
                                    if (tab.key === 'waiting') return ['waiting_info', 'waiting_consent'].includes(ref.status);
                                    if (tab.key === 'closed') return ['closed', 'completed'].includes(ref.status);
                                    return true;
                                }).length})
                            </span>
                        </button>
                    ))}
                </div>

                {filteredReferrals.length === 0 ? (
                    <Card>
                        <CardContent className="py-12">
                            <div className="text-center">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">No referrals yet</h3>
                                <p className="text-gray-600 mb-6">
                                    {filter === 'all'
                                        ? 'Get started by creating your first referral.'
                                        : `No ${filter} referrals found.`}
                                </p>
                                {(userProfile?.role === 'teacher' || userProfile?.role === 'school_admin') && filter === 'all' && (
                                    <Link href="/referrals/new">
                                        <Button>Create First Referral</Button>
                                    </Link>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredReferrals.map((referral) => (
                            <Card key={referral.id} hover className="cursor-pointer">
                                <CardHeader>
                                    <div className="flex items-start justify-between mb-2">
                                        <CardTitle className="text-lg">{referral.caseNumber}</CardTitle>
                                        <span
                                            className={`px-2 py-1 text-xs font-medium rounded-full ${STATUS_COLORS[referral.status as keyof typeof STATUS_COLORS] || 'bg-gray-100 text-gray-800'
                                                }`}
                                        >
                                            {STATUS_LABELS[referral.status as keyof typeof STATUS_LABELS] || referral.status}
                                        </span>
                                    </div>
                                    <CardDescription>
                                        <div className="space-y-1">
                                            <div className="font-medium text-gray-900">{referral.studentName}</div>
                                            <div className="text-sm text-gray-600">
                                                Submitted {formatDate(referral.createdAt)}
                                            </div>
                                        </div>
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {referral.priority && (
                                        <div className="mb-3">
                                            <span
                                                className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded ${referral.priority === 'urgent'
                                                        ? 'bg-red-100 text-red-800'
                                                        : referral.priority === 'high'
                                                            ? 'bg-orange-100 text-orange-800'
                                                            : 'bg-gray-100 text-gray-600'
                                                    }`}
                                            >
                                                {referral.priority === 'urgent' && '🔴 '}
                                                {referral.priority.charAt(0).toUpperCase() + referral.priority.slice(1)} Priority
                                            </span>
                                        </div>
                                    )}
                                    <Link href={`/referrals/${referral.id}`}>
                                        <Button variant="outline" size="sm" className="w-full">
                                            View Details
                                        </Button>
                                    </Link>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
