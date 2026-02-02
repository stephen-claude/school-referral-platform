'use client';

import { useState, useEffect } from 'react';
import { collection, query, getDocs, orderBy, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Referral } from '@/types';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';

const STATUS_COLORS = {
    new: 'bg-blue-100 text-blue-800 border-blue-200',
    in_review: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    waiting_info: 'bg-orange-100 text-orange-800 border-orange-200',
    waiting_consent: 'bg-orange-100 text-orange-800 border-orange-200',
    closed: 'bg-gray-100 text-gray-800 border-gray-200',
    completed: 'bg-green-100 text-green-800 border-green-200',
};

const PRIORITY_COLORS = {
    urgent: 'bg-red-50 border-red-300',
    high: 'bg-orange-50 border-orange-300',
    medium: 'bg-gray-50 border-gray-200',
    low: 'bg-blue-50 border-blue-200',
};

export default function TriagePage() {
    const { userProfile, loading } = useRequireAuth(['clinic_admin']);
    const [referrals, setReferrals] = useState<(Referral & { id: string; studentName?: string; teacherName?: string; schoolName?: string })[]>([]);
    const [loadingReferrals, setLoadingReferrals] = useState(true);
    const [filter, setFilter] = useState<'all' | 'new' | 'urgent' | 'in_review' | 'waiting'>('all');

    useEffect(() => {
        if (!loading && userProfile) {
            fetchReferrals();
        }
    }, [loading, userProfile]);

    const fetchReferrals = async () => {
        try {
            const q = query(collection(db, 'referrals'), orderBy('createdAt', 'desc'));
            const snapshot = await getDocs(q);

            const referralsData = await Promise.all(
                snapshot.docs.map(async (docSnap) => {
                    const data = docSnap.data();

                    // Fetch related data
                    let studentName = 'Unknown';
                    let teacherName = 'Unknown';
                    let schoolName = 'Unknown';

                    try {
                        // Fetch student
                        if (data.studentId) {
                            const studentSnap = await getDocs(query(collection(db, 'students'), where('__name__', '==', data.studentId)));
                            if (!studentSnap.empty) {
                                const student = studentSnap.docs[0].data();
                                studentName = `${student.firstName} ${student.lastName}`;
                            }
                        }

                        // Fetch teacher
                        if (data.teacherId) {
                            const teacherSnap = await getDocs(query(collection(db, 'users'), where('uid', '==', data.teacherId)));
                            if (!teacherSnap.empty) {
                                teacherName = teacherSnap.docs[0].data().displayName || 'Unknown';
                            }
                        }

                        // Fetch school
                        if (data.schoolId) {
                            const schoolSnap = await getDocs(query(collection(db, 'schools'), where('__name__', '==', data.schoolId)));
                            if (!schoolSnap.empty) {
                                schoolName = schoolSnap.docs[0].data().name;
                            }
                        }
                    } catch (err) {
                        console.error('Error fetching related data:', err);
                    }

                    return {
                        id: docSnap.id,
                        ...data,
                        studentName,
                        teacherName,
                        schoolName,
                        createdAt: data.createdAt?.toDate(),
                        updatedAt: data.updatedAt?.toDate(),
                    } as Referral & { id: string; studentName: string; teacherName: string; schoolName: string };
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
        if (filter === 'new') return ref.status === 'new';
        if (filter === 'urgent') return ref.priority === 'urgent';
        if (filter === 'in_review') return ref.status === 'in_review';
        if (filter === 'waiting') return ['waiting_info', 'waiting_consent'].includes(ref.status);
        return true;
    });

    if (loading || loadingReferrals) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <p className="mt-4 text-gray-600">Loading triage queue...</p>
                </div>
            </div>
        );
    }

    const stats = {
        total: referrals.length,
        new: referrals.filter(r => r.status === 'new').length,
        urgent: referrals.filter(r => r.priority === 'urgent').length,
        inReview: referrals.filter(r => r.status === 'in_review').length,
        waiting: referrals.filter(r => ['waiting_info', 'waiting_consent'].includes(r.status)).length,
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navigation */}
            <nav className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-6">
                            <Link href="/dashboard" className="text-gray-900 font-semibold text-lg">
                                Clinic Dashboard
                            </Link>
                            <Link href="/clinic/triage" className="text-blue-600 font-medium">
                                Triage
                            </Link>
                            <Link href="/schools" className="text-gray-600 hover:text-gray-900">
                                Schools
                            </Link>
                        </div>
                        <Link href="/dashboard">
                            <Button variant="outline" size="sm">Dashboard</Button>
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Referral Triage</h1>
                    <p className="text-gray-600 mt-1">Review and prioritize incoming referrals</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                    <Card className={filter === 'all' ? 'ring-2 ring-blue-500' : ''}>
                        <CardContent className="pt-6">
                            <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
                            <div className="text-sm text-gray-600 mt-1">Total Cases</div>
                        </CardContent>
                    </Card>
                    <Card className={filter === 'new' ? 'ring-2 ring-blue-500' : ''}>
                        <CardContent className="pt-6">
                            <div className="text-3xl font-bold text-blue-600">{stats.new}</div>
                            <div className="text-sm text-gray-600 mt-1">New</div>
                        </CardContent>
                    </Card>
                    <Card className={filter === 'urgent' ? 'ring-2 ring-blue-500' : ''}>
                        <CardContent className="pt-6">
                            <div className="text-3xl font-bold text-red-600">{stats.urgent}</div>
                            <div className="text-sm text-gray-600 mt-1">Urgent</div>
                        </CardContent>
                    </Card>
                    <Card className={filter === 'in_review' ? 'ring-2 ring-blue-500' : ''}>
                        <CardContent className="pt-6">
                            <div className="text-3xl font-bold text-yellow-600">{stats.inReview}</div>
                            <div className="text-sm text-gray-600 mt-1">In Review</div>
                        </CardContent>
                    </Card>
                    <Card className={filter === 'waiting' ? 'ring-2 ring-blue-500' : ''}>
                        <CardContent className="pt-6">
                            <div className="text-3xl font-bold text-orange-600">{stats.waiting}</div>
                            <div className="text-sm text-gray-600 mt-1">Waiting</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-2 mb-6 border-b border-gray-200">
                    {[
                        { key: 'all', label: 'All', count: stats.total },
                        { key: 'new', label: 'New', count: stats.new },
                        { key: 'urgent', label: 'Urgent', count: stats.urgent },
                        { key: 'in_review', label: 'In Review', count: stats.inReview },
                        { key: 'waiting', label: 'Waiting', count: stats.waiting },
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
                            <span className="ml-2 text-sm">({tab.count})</span>
                        </button>
                    ))}
                </div>

                {/* Referrals List */}
                {filteredReferrals.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No referrals found</h3>
                            <p className="text-gray-600">No {filter !== 'all' ? filter : ''} referrals at this time.</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {filteredReferrals.map((referral) => (
                            <Card
                                key={referral.id}
                                hover
                                className={`cursor-pointer transition-all ${PRIORITY_COLORS[referral.priority as keyof typeof PRIORITY_COLORS] || ''}`}
                            >
                                <CardContent className="py-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-lg font-semibold text-gray-900">{referral.caseNumber}</h3>
                                                <span
                                                    className={`px-2 py-1 text-xs font-medium rounded-full border ${STATUS_COLORS[referral.status as keyof typeof STATUS_COLORS] || 'bg-gray-100 text-gray-800'
                                                        }`}
                                                >
                                                    {referral.status.replace('_', ' ').toUpperCase()}
                                                </span>
                                                {referral.priority === 'urgent' && (
                                                    <span className="px-2 py-1 text-xs font-bold bg-red-100 text-red-800 rounded-full border border-red-200">
                                                        🔴 URGENT
                                                    </span>
                                                )}
                                            </div>
                                            <div className="grid md:grid-cols-3 gap-4 text-sm">
                                                <div>
                                                    <span className="text-gray-600">Student:</span>
                                                    <span className="ml-2 font-medium text-gray-900">{referral.studentName}</span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-600">Teacher:</span>
                                                    <span className="ml-2 text-gray-900">{referral.teacherName}</span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-600">School:</span>
                                                    <span className="ml-2 text-gray-900">{referral.schoolName}</span>
                                                </div>
                                            </div>
                                            <div className="mt-2 text-sm text-gray-500">
                                                Submitted {formatDate(referral.createdAt)}
                                            </div>
                                        </div>
                                        <Link href={`/clinic/cases/${referral.id}`}>
                                            <Button size="sm">Review Case</Button>
                                        </Link>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
