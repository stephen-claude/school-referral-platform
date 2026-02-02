'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';
import Link from 'next/link';

function NewTeacherForm() {
    const { userProfile, loading } = useRequireAuth(['clinic_admin']);
    const router = useRouter();
    const searchParams = useSearchParams();
    const preSelectedSchoolId = searchParams.get('schoolId');

    const [submitting, setSubmitting] = useState(false);
    const [schoolName, setSchoolName] = useState('');

    const [formData, setFormData] = useState({
        schoolId: preSelectedSchoolId || '',
        firstName: '',
        lastName: '',
        email: '',
        grade: '',
        subject: '',
        phoneNumber: '',
        password: '',
    });

    useEffect(() => {
        if (preSelectedSchoolId) {
            fetchSchoolName(preSelectedSchoolId);
        }
    }, [preSelectedSchoolId]);

    const fetchSchoolName = async (schoolId: string) => {
        try {
            const schoolDoc = await getDoc(doc(db, 'schools', schoolId));
            if (schoolDoc.exists()) {
                setSchoolName(schoolDoc.data().name);
            }
        } catch (error) {
            console.error('Error fetching school:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            // Create Firebase Auth user
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                formData.email,
                formData.password
            );
            const userId = userCredential.user.uid;

            // Create user profile
            await addDoc(collection(db, 'users'), {
                uid: userId,
                email: formData.email,
                displayName: `${formData.firstName} ${formData.lastName}`,
                role: 'teacher',
                schoolId: formData.schoolId,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });

            // Create teacher profile
            await addDoc(collection(db, 'teachers'), {
                userId,
                schoolId: formData.schoolId,
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                grade: formData.grade,
                subject: formData.subject,
                phoneNumber: formData.phoneNumber,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });

            toast.success('Teacher added successfully!');
            router.push(`/schools/${formData.schoolId}`);
        } catch (error: any) {
            console.error('Error creating teacher:', error);
            toast.error(error.message || 'Failed to add teacher');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navigation */}
            <nav className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center h-16">
                        <Link
                            href={preSelectedSchoolId ? `/schools/${preSelectedSchoolId}` : '/schools'}
                            className="text-blue-600 hover:text-blue-700 flex items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Back
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <Card>
                    <CardHeader>
                        <CardTitle>Add New Teacher</CardTitle>
                        <CardDescription>
                            {schoolName ? `Adding teacher to ${schoolName}` : 'Create teacher account with credentials'}
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {!preSelectedSchoolId && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        School *
                                    </label>
                                    <p className="text-sm text-red-600">Please select a school first</p>
                                </div>
                            )}

                            <div className="grid md:grid-cols-2 gap-4">
                                <Input
                                    label="First Name *"
                                    type="text"
                                    placeholder="John"
                                    value={formData.firstName}
                                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                    required
                                />

                                <Input
                                    label="Last Name *"
                                    type="text"
                                    placeholder="Doe"
                                    value={formData.lastName}
                                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                    required
                                />
                            </div>

                            <Input
                                label="Email *"
                                type="email"
                                placeholder="john.doe@school.edu"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                            />

                            <Input
                                label="Temporary Password *"
                                type="password"
                                placeholder="Minimum 6 characters"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                required
                            />

                            <div className="grid md:grid-cols-2 gap-4">
                                <Input
                                    label="Grade"
                                    type="text"
                                    placeholder="3rd Grade"
                                    value={formData.grade}
                                    onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                                />

                                <Input
                                    label="Subject"
                                    type="text"
                                    placeholder="Math, English, etc."
                                    value={formData.subject}
                                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                />
                            </div>

                            <Input
                                label="Phone Number"
                                type="tel"
                                placeholder="(555) 123-4567"
                                value={formData.phoneNumber}
                                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                            />

                            <div className="flex gap-3 pt-4">
                                <Button
                                    type="submit"
                                    loading={submitting}
                                    className="flex-1"
                                    disabled={!preSelectedSchoolId}
                                >
                                    Add Teacher
                                </Button>
                                <Link href={preSelectedSchoolId ? `/schools/${preSelectedSchoolId}` : '/schools'}>
                                    <Button type="button" variant="outline">
                                        Cancel
                                    </Button>
                                </Link>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export default function NewTeacherPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        }>
            <NewTeacherForm />
        </Suspense>
    );
}
