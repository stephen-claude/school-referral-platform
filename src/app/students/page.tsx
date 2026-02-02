'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Student } from '@/types';
import Link from 'next/link';

export default function StudentsPage() {
    const { userProfile, loading } = useRequireAuth(['teacher', 'school_admin', 'clinic_admin']);
    const [students, setStudents] = useState<(Student & { id: string })[]>([]);
    const [loadingStudents, setLoadingStudents] = useState(true);

    useEffect(() => {
        if (!loading && userProfile) {
            fetchStudents();
        }
    }, [loading, userProfile]);

    const fetchStudents = async () => {
        if (!userProfile) return;

        try {
            let q;
            if (userProfile.role === 'clinic_admin') {
                // Clinic admin sees all students
                q = query(collection(db, 'students'), orderBy('createdAt', 'desc'));
            } else if (userProfile.schoolId) {
                // School admin and teachers see only their school's students
                q = query(
                    collection(db, 'students'),
                    where('schoolId', '==', userProfile.schoolId),
                    orderBy('createdAt', 'desc')
                );
            } else {
                setLoadingStudents(false);
                return;
            }

            const snapshot = await getDocs(q);
            const studentsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate(),
                updatedAt: doc.data().updatedAt?.toDate(),
                dateOfBirth: doc.data().dateOfBirth?.toDate(),
            })) as (Student & { id: string })[];
            setStudents(studentsData);
        } catch (error) {
            console.error('Error fetching students:', error);
        } finally {
            setLoadingStudents(false);
        }
    };

    if (loading || loadingStudents) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <p className="mt-4 text-gray-600">Loading students...</p>
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
                            <Link href="/students/new">
                                <Button className="flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    Add Student
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Students</h1>
                    <p className="text-gray-600 mt-1">Manage student profiles and referrals</p>
                </div>

                {students.length === 0 ? (
                    <Card>
                        <CardContent className="py-12">
                            <div className="text-center">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">No students yet</h3>
                                <p className="text-gray-600 mb-6">Get started by adding your first student profile.</p>
                                {(userProfile?.role === 'teacher' || userProfile?.role === 'school_admin') && (
                                    <Link href="/students/new">
                                        <Button>Add First Student</Button>
                                    </Link>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {students.map((student) => (
                            <Card key={student.id} hover>
                                <CardContent className="py-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                                                <span className="text-white font-bold">
                                                    {student.firstName[0]}{student.lastName[0]}
                                                </span>
                                            </div>
                                            <div>
                                                <Link href={`/students/${student.id}`}>
                                                    <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                                                        {student.firstName} {student.lastName}
                                                    </h3>
                                                </Link>
                                                <p className="text-sm text-gray-600">Grade {student.grade}</p>
                                            </div>
                                        </div>
                                        <Link href={`/students/${student.id}`}>
                                            <Button size="sm">View Profile</Button>
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
