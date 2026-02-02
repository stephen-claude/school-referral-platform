'use client';

import { useState, useEffect } from 'react';
import { collection, query, getDocs, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

interface Stats {
    totalReferrals: number;
    newReferrals: number;
    inReview: number;
    urgent: number;
    completed: number;
    totalSchools: number;
    totalStudents: number;
    avgResponseTime: string;
}

export default function AnalyticsPage() {
    const { userProfile, loading } = useRequireAuth(['clinic_admin']);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loadingStats, setLoadingStats] = useState(true);

    useEffect(() => {
        if (!loading && userProfile) {
            fetchAnalytics();
        }
    }, [loading, userProfile]);

    const fetchAnalytics = async () => {
        try {
            // Fetch referrals
            const referralsSnap = await getDocs(collection(db, 'referrals'));
            const referrals = referralsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // Fetch schools
            const schoolsSnap = await getDocs(collection(db, 'schools'));

            // Fetch students
            const studentsSnap = await getDocs(collection(db, 'students'));

            const analytics: Stats = {
                totalReferrals: referrals.length,
                newReferrals: referrals.filter((r: any) => r.status === 'new').length,
                inReview: referrals.filter((r: any) => r.status === 'in_review').length,
                urgent: referrals.filter((r: any) => r.priority === 'urgent').length,
                completed: referrals.filter((r: any) => r.status === 'completed').length,
                totalSchools: schoolsSnap.size,
                totalStudents: studentsSnap.size,
                avgResponseTime: '2.4 days', // Mock - would calculate from actual data
            };

            setStats(analytics);
        } catch (error) {
            console.error('Error fetching analytics:', error);
        } finally {
            setLoadingStats(false);
        }
    };

    if (loading || loadingStats) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <p className="mt-4 text-gray-600">Loading analytics...</p>
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
                        <div className="flex items-center gap-6">
                            <Link href="/dashboard" className="text-gray-900 font-semibold text-lg">
                                Clinic Dashboard
                            </Link>
                            <Link href="/clinic/triage" className="text-gray-600 hover:text-gray-900">
                                Triage
                            </Link>
                            <Link href="/clinic/analytics" className="text-blue-600 font-medium">
                                Analytics
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
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Analytics & Insights</h1>
                    <p className="text-gray-600 mt-1">Overview of referral system performance</p>
                </div>

                {stats && (
                    <>
                        {/* Key Metrics */}
                        <div className="grid md:grid-cols-4 gap-6 mb-8">
                            <Card>
                                <CardContent className="pt-6">
                                    <div className="text-4xl font-bold text-blue-600">{stats.totalReferrals}</div>
                                    <div className="text-sm text-gray-600 mt-1">Total Referrals</div>
                                    <div className="mt-3 text-xs text-gray-500">All time</div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="pt-6">
                                    <div className="text-4xl font-bold text-purple-600">{stats.totalSchools}</div>
                                    <div className="text-sm text-gray-600 mt-1">Active Schools</div>
                                    <div className="mt-3 text-xs text-gray-500">Partner institutions</div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="pt-6">
                                    <div className="text-4xl font-bold text-green-600">{stats.totalStudents}</div>
                                    <div className="text-sm text-gray-600 mt-1">Students</div>
                                    <div className="mt-3 text-xs text-gray-500">Tracked in system</div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="pt-6">
                                    <div className="text-4xl font-bold text-orange-600">{stats.avgResponseTime}</div>
                                    <div className="text-sm text-gray-600 mt-1">Avg Response Time</div>
                                    <div className="mt-3 text-xs text-gray-500">From submission to review</div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Referral Status Breakdown */}
                        <div className="grid md:grid-cols-2 gap-6 mb-8">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Referral Status</CardTitle>
                                    <CardDescription>Current distribution by status</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                                <span className="text-gray-700">New</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-2xl font-bold text-gray-900">{stats.newReferrals}</span>
                                                <span className="text-sm text-gray-500">
                                                    {((stats.newReferrals / stats.totalReferrals) * 100).toFixed(0)}%
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                                                <span className="text-gray-700">In Review</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-2xl font-bold text-gray-900">{stats.inReview}</span>
                                                <span className="text-sm text-gray-500">
                                                    {((stats.inReview / stats.totalReferrals) * 100).toFixed(0)}%
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                                <span className="text-gray-700">Completed</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-2xl font-bold text-gray-900">{stats.completed}</span>
                                                <span className="text-sm text-gray-500">
                                                    {((stats.completed / stats.totalReferrals) * 100).toFixed(0)}%
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Priority Distribution</CardTitle>
                                    <CardDescription>Referrals by priority level</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                                <span className="text-gray-700">Urgent</span>
                                            </div>
                                            <span className="text-2xl font-bold text-red-600">{stats.urgent}</span>
                                        </div>
                                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                            <p className="text-sm text-red-800">
                                                {stats.urgent} case{stats.urgent !== 1 ? 's' : ''} require{stats.urgent === 1 ? 's' : ''} immediate attention
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Quick Actions */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Quick Actions</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid md:grid-cols-3 gap-4">
                                    <Link href="/clinic/triage">
                                        <Button variant="outline" className="w-full">
                                            View Triage Queue
                                        </Button>
                                    </Link>
                                    <Link href="/schools">
                                        <Button variant="outline" className="w-full">
                                            Manage Schools
                                        </Button>
                                    </Link>
                                    <Link href="/referrals">
                                        <Button variant="outline" className="w-full">
                                            All Referrals
                                        </Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    </>
                )}
            </div>
        </div>
    );
}
