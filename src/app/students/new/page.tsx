'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function NewStudentPage() {
    const { userProfile, loading } = useRequireAuth(['teacher', 'school_admin']);
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        grade: '',
        parentName: '',
        parentEmail: '',
        parentPhone: '',
        consentFlags: {
            shareSensitiveInfo: false,
            allowPhotos: false,
            allowContactParent: true,
        },
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userProfile?.schoolId) {
            toast.error('School ID not found');
            return;
        }

        setSubmitting(true);

        try {
            const studentData = {
                schoolId: userProfile.schoolId,
                teacherId: userProfile.uid,
                firstName: formData.firstName,
                lastName: formData.lastName,
                dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth) : null,
                grade: formData.grade,
                parentName: formData.parentName,
                parentEmail: formData.parentEmail,
                parentPhone: formData.parentPhone,
                consentFlags: formData.consentFlags,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            };

            const docRef = await addDoc(collection(db, 'students'), studentData);
            toast.success('Student added successfully!');
            router.push(`/students/${docRef.id}`);
        } catch (error: any) {
            console.error('Error creating student:', error);
            toast.error(error.message || 'Failed to add student');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navigation */}
            <nav className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center h-16">
                        <Link href="/students" className="text-blue-600 hover:text-blue-700 flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Back to Students
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <Card>
                    <CardHeader>
                        <CardTitle>Add New Student</CardTitle>
                        <CardDescription>Create a student profile to enable referral submission</CardDescription>
                    </CardHeader>

                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Student Info */}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Student Information</h3>
                                <div className="space-y-4">
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

                                    <div className="grid md:grid-cols-2 gap-4">
                                        <Input
                                            label="Date of Birth"
                                            type="date"
                                            value={formData.dateOfBirth}
                                            onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                                        />

                                        <Input
                                            label="Grade"
                                            type="text"
                                            placeholder="3rd Grade"
                                            value={formData.grade}
                                            onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Parent/Guardian Info */}
                            <div className="pt-6 border-t border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Parent/Guardian Information</h3>
                                <div className="space-y-4">
                                    <Input
                                        label="Parent/Guardian Name"
                                        type="text"
                                        placeholder="Jane Doe"
                                        value={formData.parentName}
                                        onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                                    />

                                    <div className="grid md:grid-cols-2 gap-4">
                                        <Input
                                            label="Parent Email"
                                            type="email"
                                            placeholder="parent@email.com"
                                            value={formData.parentEmail}
                                            onChange={(e) => setFormData({ ...formData, parentEmail: e.target.value })}
                                        />

                                        <Input
                                            label="Parent Phone"
                                            type="tel"
                                            placeholder="(555) 123-4567"
                                            value={formData.parentPhone}
                                            onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Consent Flags */}
                            <div className="pt-6 border-t border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Privacy & Consent</h3>
                                <div className="space-y-3">
                                    <label className="flex items-start gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="mt-1 rounded"
                                            checked={formData.consentFlags.shareSensitiveInfo}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                consentFlags: { ...formData.consentFlags, shareSensitiveInfo: e.target.checked }
                                            })}
                                        />
                                        <div>
                                            <div className="font-medium text-gray-900">Share sensitive information</div>
                                            <div className="text-sm text-gray-600">Allow sharing detailed case information with therapists and specialists</div>
                                        </div>
                                    </label>

                                    <label className="flex items-start gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="mt-1 rounded"
                                            checked={formData.consentFlags.allowPhotos}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                consentFlags: { ...formData.consentFlags, allowPhotos: e.target.checked }
                                            })}
                                        />
                                        <div>
                                            <div className="font-medium text-gray-900">Allow photos/videos</div>
                                            <div className="text-sm text-gray-600">Permit visual documentation for assessment purposes</div>
                                        </div>
                                    </label>

                                    <label className="flex items-start gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="mt-1 rounded"
                                            checked={formData.consentFlags.allowContactParent}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                consentFlags: { ...formData.consentFlags, allowContactParent: e.target.checked }
                                            })}
                                        />
                                        <div>
                                            <div className="font-medium text-gray-900">Allow parent contact</div>
                                            <div className="text-sm text-gray-600">Clinic may contact parent/guardian directly if needed</div>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <Button type="submit" loading={submitting} className="flex-1">
                                    Add Student
                                </Button>
                                <Link href="/students">
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
