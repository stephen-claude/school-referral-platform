'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function DashboardPage() {
    const { user, userProfile, loading, signOut } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/auth/login');
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    if (!user || !userProfile) {
        return null;
    }

    const handleSignOut = async () => {
        await signOut();
        router.push('/auth/login');
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Top Navigation */}
            <nav className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                                <span className="text-white font-bold text-xl">SR</span>
                            </div>
                            <span className="text-xl font-bold text-gray-900">School Referral Platform</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-gray-600">{user.email}</span>
                            <Button variant="outline" size="sm" onClick={handleSignOut}>
                                Sign Out
                            </Button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Welcome Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Welcome back, {userProfile.displayName}!</h1>
                    <p className="text-gray-600 mt-1">
                        Role: <span className="font-medium capitalize">{userProfile.role.replace('_', ' ')}</span>
                    </p>
                </div>

                {/* Dashboard Cards */}
                <div className="grid md:grid-cols-3 gap-6">
                    <Card hover className="cursor-pointer">
                        <CardHeader>
                            <CardTitle className="text-lg">Students</CardTitle>
                            <CardDescription> View and manage students</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-bold text-blue-600">0</div>
                            <p className=" text-sm text-gray-500 mt-2">Total students</p>
                        </CardContent>
                    </Card>

                    <Card hover className="cursor-pointer">
                        <CardHeader>
                            <CardTitle className="text-lg">Referrals</CardTitle>
                            <CardDescription>Active referral cases</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-bold text-purple-600">0</div>
                            <p className="text-sm text-gray-500 mt-2">Pending referrals</p>
                        </CardContent>
                    </Card>

                    <Card hover className="cursor-pointer">
                        <CardHeader>
                            <CardTitle className="text-lg">Notifications</CardTitle>
                            <CardDescription>Recent updates</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-bold text-green-600">0</div>
                            <p className="text-sm text-gray-500 mt-2">Unread notifications</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Quick Actions */}
                <div className="mt-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Quick Actions</CardTitle>
                            <CardDescription>Get started with common tasks</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                {userProfile.role === 'clinic_admin' ? (
                                    <>
                                        <Link href="/clinic/triage">
                                            <Button variant="outline" className="w-full h-auto py-6 flex flex-col items-center gap-2">
                                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                                </svg>
                                                <span>Triage Queue</span>
                                            </Button>
                                        </Link>
                                        <Link href="/schools">
                                            <Button variant="outline" className="w-full h-auto py-6 flex flex-col items-center gap-2">
                                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                </svg>
                                                <span>Manage Schools</span>
                                            </Button>
                                        </Link>
                                        <Link href="/referrals">
                                            <Button variant="outline" className="w-full h-auto py-6 flex flex-col items-center gap-2">
                                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                                <span>All Referrals</span>
                                            </Button>
                                        </Link>
                                    </>
                                ) : (
                                    <>
                                        <Link href="/students">
                                            <Button variant="outline" className="w-full h-auto py-6 flex flex-col items-center gap-2">
                                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                </svg>
                                                <span>Add Student</span>
                                            </Button>
                                        </Link>
                                        <Link href="/referrals/new">
                                            <Button variant="outline" className="w-full h-auto py-6 flex flex-col items-center gap-2">
                                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                                <span>Submit Referral</span>
                                            </Button>
                                        </Link>
                                        <Link href="/referrals/new2">
                                            <Button variant="outline" className="w-full h-auto py-6 flex flex-col items-center gap-2">
                                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                                <span>Vision Triage</span>
                                            </Button>
                                        </Link>
                                        <Link href="/referrals/new3">
                                            <Button variant="outline" className="w-full h-auto py-6 flex flex-col items-center gap-2">
                                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                                </svg>
                                                <span>Vision Screening</span>
                                            </Button>
                                        </Link>
                                        <Link href="/referrals">
                                            <Button variant="outline" className="w-full h-auto py-6 flex flex-col items-center gap-2">
                                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                </svg>
                                                <span>View Referrals</span>
                                            </Button>
                                        </Link>
                                    </>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Role-specific Message */}
                <div className="mt-8">
                    <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
                        <CardContent className="py-6">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-1">Getting Started</h3>
                                    {userProfile.role === 'teacher' && (
                                        <p className="text-gray-700">
                                            You can now start adding students and submitting referrals for vision assessment.
                                            Our clinic team will review each case and provide feedback with classroom strategies.
                                        </p>
                                    )}
                                    {userProfile.role === 'school_admin' && (
                                        <p className="text-gray-700">
                                            As a school administrator, you can manage teachers, view all referrals for your school,
                                            and track progress across your student population.
                                        </p>
                                    )}
                                    {userProfile.role === 'clinic_admin' && (
                                        <p className="text-gray-700">
                                            Welcome to the clinic dashboard. You have full access to triage referrals, manage cases,
                                            configure templates, and collaborate with schools and therapists.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
