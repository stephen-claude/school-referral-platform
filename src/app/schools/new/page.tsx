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

export default function NewSchoolPage() {
    const { userProfile, loading } = useRequireAuth(['clinic_admin']);
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        address: '',
        contactPhone: '',
        contactEmail: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const schoolData = {
                ...formData,
                adminIds: [], // Will be populated when school admins are added
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            };

            const docRef = await addDoc(collection(db, 'schools'), schoolData);
            toast.success('School created successfully!');
            router.push(`/schools/${docRef.id}`);
        } catch (error: any) {
            console.error('Error creating school:', error);
            toast.error(error.message || 'Failed to create school');
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
                        <Link href="/dashboard" className="text-blue-600 hover:text-blue-700 flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Back to Dashboard
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <Card>
                    <CardHeader>
                        <CardTitle>Create New School</CardTitle>
                        <CardDescription>
                            Add a new school to the platform. Teachers from this school will be able to submit referrals.
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <Input
                                label="School Name *"
                                type="text"
                                placeholder="Lincoln Elementary School"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />

                            <Input
                                label="Address"
                                type="text"
                                placeholder="123 Main St, City, State 12345"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            />

                            <div className="grid md:grid-cols-2 gap-4">
                                <Input
                                    label="Contact Phone"
                                    type="tel"
                                    placeholder="(555) 123-4567"
                                    value={formData.contactPhone}
                                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                                />

                                <Input
                                    label="Contact Email"
                                    type="email"
                                    placeholder="contact@school.edu"
                                    value={formData.contactEmail}
                                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <Button type="submit" loading={submitting} className="flex-1">
                                    Create School
                                </Button>
                                <Link href="/schools">
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
