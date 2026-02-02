'use client';

import { useState, useEffect } from 'react';

export const dynamicParams = true;
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { School, Teacher } from '@/types';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';

export default function SchoolDetailPage() {
    const params = useParams();
    const schoolId = params.id as string;
    const { userProfile, loading } = useRequireAuth(['clinic_admin']);
    const [school, setSchool] = useState<School | null>(null);
    const [teachers, setTeachers] = useState<(Teacher & { id: string })[]>([]);
    const [loadingData, setLoadingData] = useState(true);

    useEffect(() => {
        if (!loading && userProfile && schoolId) {
            fetchSchoolData();
        }
    }, [loading, userProfile, schoolId]);

    const fetchSchoolData = async () => {
        try {
            // Fetch school
            const schoolDoc = await getDoc(doc(db, 'schools', schoolId));
            if (schoolDoc.exists()) {
                setSchool({
                    id: schoolDoc.id,
                    ...schoolDoc.data(),
                    createdAt: schoolDoc.data().createdAt?.toDate(),
                    updatedAt: schoolDoc.data().updatedAt?.toDate(),
                } as School);
            }

            // Fetch teachers
            const teachersQuery = query(
                collection(db, 'teachers'),
                where('schoolId', '==', schoolId)
            );
            const teachersSnapshot = await getDocs(teachersQuery);
            const teachersData = teachersSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate(),
                updatedAt: doc.data().updatedAt?.toDate(),
            })) as (Teacher & { id: string })[];
            setTeachers(teachersData);
        } catch (error) {
            console.error('Error fetching school data:', error);
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

    if (!school) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Card>
                    <CardContent className="py-12 text-center">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">School Not Found</h2>
                        <p className="text-gray-600 mb-6">The school you're looking for doesn't exist.</p>
                        <Link href="/schools">
                            <Button>Back to Schools</Button>
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
                        <Link href="/schools" className="text-blue-600 hover:text-blue-700 flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Back to Schools
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* School Info Card */}
                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle className="text-3xl">{school.name}</CardTitle>
                        <CardDescription>{school.address || 'No address provided'}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid md:grid-cols-3 gap-6">
                            <div>
                                <h4 className="text-sm font-medium text-gray-500 mb-1">Contact Email</h4>
                                <p className="text-gray-900">{school.contactEmail || 'Not provided'}</p>
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-gray-500 mb-1">Contact Phone</h4>
                                <p className="text-gray-900">{school.contactPhone || 'Not provided'}</p>
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-gray-500 mb-1">Created</h4>
                                <p className="text-gray-900">{formatDate(school.createdAt)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Teachers Section */}
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Teachers</h2>
                    <Link href={`/teachers/new?schoolId=${schoolId}`}>
                        <Button className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Add Teacher
                        </Button>
                    </Link>
                </div>

                {teachers.length === 0 ? (
                    <Card>
                        <CardContent className="py-12">
                            <div className="text-center">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">No teachers yet</h3>
                                <p className="text-gray-600 mb-6">Add teachers to enable them to submit referrals.</p>
                                <Link href={`/teachers/new?schoolId=${schoolId}`}>
                                    <Button>Add First Teacher</Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {teachers.map((teacher) => (
                            <Card key={teacher.id} hover>
                                <CardContent className="py-4">
                                    <div className="flex items-start gap-3">
                                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                            <span className="text-blue-600 font-semibold text-lg">
                                                {teacher.firstName[0]}{teacher.lastName[0]}
                                            </span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-gray-900 truncate">
                                                {teacher.firstName} {teacher.lastName}
                                            </h3>
                                            <p className="text-sm text-gray-600 truncate">{teacher.email}</p>
                                            {teacher.grade && (
                                                <p className="text-xs text-gray-500 mt-1">Grade {teacher.grade}</p>
                                            )}
                                        </div>
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
