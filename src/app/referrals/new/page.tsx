'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { collection, addDoc, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea, CheckboxGroup } from '@/components/ui/FormInputs';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { generateCaseNumber } from '@/lib/utils';

interface QuestionnaireData {
    readingPerformance: {
        struggles: string[];
        notes: string;
    };
    attentionBehavior: {
        issues: string[];
        notes: string;
    };
    visualSymptoms: {
        symptoms: string[];
        notes: string;
    };
    motorPosture: {
        issues: string[];
        notes: string;
    };
    classroomObservations: {
        patterns: string[];
        notes: string;
    };
    pastInterventions: {
        received: string[];
        notes: string;
    };
    relevantHistory: string;
    teacherSummary: {
        description: string;
        duration: string;
    };
}

const READING_OPTIONS = [
    { value: 'struggles', label: 'Struggles with reading assignments' },
    { value: 'losesPlace', label: 'Loses place while reading' },
    { value: 'slowSpeed', label: 'Slow reading speed compared to peers' },
    { value: 'poorComprehension', label: 'Poor reading comprehension' },
    { value: 'avoids', label: 'Actively avoids reading tasks' },
    { value: 'skipsWords', label: 'Skips words or lines' },
];

const ATTENTION_OPTIONS = [
    { value: 'distracted', label: 'Easily distracted during reading tasks' },
    { value: 'fidgets', label: 'Fidgets or moves excessively while reading' },
    { value: 'difficulty Focusing', label: 'Difficulty maintaining focus on visual tasks' },
    { value: 'fatigue', label: 'Shows fatigue after sustained reading' },
    { value: 'performanceDeclines', label: 'Performance declines over time' },
];

const VISUAL_SYMPTOM_OPTIONS = [
    { value: 'headaches', label: 'Complains of headaches (especially after reading)' },
    { value: 'eyeStrain', label: 'Reports eye strain or tired eyes' },
    { value: 'doubleVision', label: 'Mentions seeing double or blurred vision' },
    { value: 'closesEye', label: 'Covers or closes one eye during tasks' },
    { value: 'rubsEyes', label: 'Rubs eyes frequently' },
];

const MOTOR_POSTURE_OPTIONS = [
    { value: 'poorPosture', label: 'Poor posture while reading or writing' },
    { value: 'tiltsHead', label: 'Tilts head to one side' },
    { value: 'movesClose', label: 'Moves unusually close to page or screen' },
    { value: 'handwritingIssues', label: 'Handwriting difficulties' },
    { value: 'clumsiness', label: 'General clumsiness or coordination issues' },
];

const CLASSROOM_PATTERNS = [
    { value: 'declinesOverDay', label: 'Performance declines over the course of the day' },
    { value: 'morningBetter', label: 'Better performance in morning vs. afternoon' },
    { value: 'needsBreaks', label: 'Needs frequent movement breaks' },
];

const INTERVENTION_OPTIONS = [
    { value: 'ot', label: 'Occupational therapy (OT)' },
    { value: 'tutoring', label: 'Tutoring or reading support' },
    { value: 'psychology', label: 'Psychological evaluation' },
    { value: 'speech', label: 'Speech therapy' },
];

function WizardContent() {
    const { userProfile, loading } = useRequireAuth(['teacher', 'school_admin']);
    const router = useRouter();
    const searchParams = useSearchParams();
    const preSelectedStudentId = searchParams.get('studentId');

    const [step, setStep] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [studentId, setStudentId] = useState(preSelectedStudentId || '');
    const [studentInfo, setStudentInfo] = useState<any>(null);

    const [formData, setFormData] = useState<QuestionnaireData>({
        readingPerformance: { struggles: [], notes: '' },
        attentionBehavior: { issues: [], notes: '' },
        visualSymptoms: { symptoms: [], notes: '' },
        motorPosture: { issues: [], notes: '' },
        classroomObservations: { patterns: [], notes: '' },
        pastInterventions: { received: [], notes: '' },
        relevantHistory: '',
        teacherSummary: { description: '', duration: '' },
    });

    useEffect(() => {
        if (preSelectedStudentId) {
            fetchStudentInfo(preSelectedStudentId);
        }
    }, [preSelectedStudentId]);

    const fetchStudentInfo = async (id: string) => {
        try {
            const studentDoc = await getDoc(doc(db, 'students', id));
            if (studentDoc.exists()) {
                setStudentInfo({ id: studentDoc.id, ...studentDoc.data() });
            }
        } catch (error) {
            console.error('Error fetching student:', error);
        }
    };

    const handleNext = () => {
        if (step < 8) setStep(step + 1);
    };

    const handleBack = () => {
        if (step > 0) setStep(step - 1);
    };

    const handleSubmit = async () => {
        if (!studentId || !userProfile?.schoolId) {
            toast.error('Missing required information');
            return;
        }

        setSubmitting(true);

        try {
            const caseNumber = generateCaseNumber();

            // Create questionnaire
            const questionnaireRef = await addDoc(collection(db, 'questionnaires'), {
                ...formData,
                createdAt: serverTimestamp(),
            });

            // Create referral
            await addDoc(collection(db, 'referrals'), {
                caseNumber,
                schoolId: userProfile.schoolId,
                teacherId: userProfile.uid,
                studentId,
                status: 'new',
                priority: 'medium',
                questionnaireId: questionnaireRef.id,
                attachments: [],
                createdAt: serverTimestamp(),
                createdBy: userProfile.uid,
                updatedAt: serverTimestamp(),
            });

            // Send confirmation email to teacher
            try {
                await fetch('/api/send-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: 'referral_submitted',
                        data: {
                            teacherEmail: userProfile.email,
                            teacherName: userProfile.displayName,
                            studentName: studentInfo ? `${studentInfo.firstName} ${studentInfo.lastName}` : 'Student',
                            caseNumber,
                        },
                    }),
                });
            } catch (emailError) {
                console.error('Failed to send confirmation email:', emailError);
                // Don't fail the referral submission if email fails
            }

            toast.success(`Referral submitted! Case #${caseNumber}`);
            router.push('/dashboard');
        } catch (error: any) {
            console.error('Error creating referral:', error);
            toast.error(error.message || 'Failed to submit referral');
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

    const renderStep = () => {
        switch (step) {
            case 0:
                return (
                    <Card>
                        <CardHeader>
                            <CardTitle>Step 1: Select Student</CardTitle>
                            <CardDescription>Choose the student for this referral</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {studentInfo ? (
                                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                                            <span className="text-white font-semibold text-lg">
                                                {studentInfo.firstName[0]}{studentInfo.lastName[0]}
                                            </span>
                                        </div>
                                        <div>
                                            <div className="font-semibold text-gray-900">
                                                {studentInfo.firstName} {studentInfo.lastName}
                                            </div>
                                            <div className="text-sm text-gray-600">Grade {studentInfo.grade}</div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <p className="text-gray-600 mb-4">No student selected</p>
                                    <Link href="/students">
                                        <Button>Select a Student</Button>
                                    </Link>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                );

            case 1:
                return (
                    <Card>
                        <CardHeader>
                            <CardTitle>Step 2: Reading Performance</CardTitle>
                            <CardDescription>Select all that apply to this student</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <CheckboxGroup
                                name="readingPerformance"
                                options={READING_OPTIONS}
                                value={formData.readingPerformance.struggles}
                                onChange={(value) =>
                                    setFormData({
                                        ...formData,
                                        readingPerformance: { ...formData.readingPerformance, struggles: value },
                                    })
                                }
                            />
                            <Textarea
                                label="Additional Notes (Optional)"
                                placeholder="Describe specific examples or patterns you've observed..."
                                value={formData.readingPerformance.notes}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        readingPerformance: { ...formData.readingPerformance, notes: e.target.value },
                                    })
                                }
                                rows={4}
                            />
                        </CardContent>
                    </Card>
                );

            case 2:
                return (
                    <Card>
                        <CardHeader>
                            <CardTitle>Step 3: Attention & Behavior</CardTitle>
                            <CardDescription>Observe attention patterns during visual tasks</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <CheckboxGroup
                                name="attentionBehavior"
                                options={ATTENTION_OPTIONS}
                                value={formData.attentionBehavior.issues}
                                onChange={(value) =>
                                    setFormData({
                                        ...formData,
                                        attentionBehavior: { ...formData.attentionBehavior, issues: value },
                                    })
                                }
                            />
                            <Textarea
                                label="Additional Observations (Optional)"
                                placeholder="Describe specific behavioral patterns..."
                                value={formData.attentionBehavior.notes}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        attentionBehavior: { ...formData.attentionBehavior, notes: e.target.value },
                                    })
                                }
                                rows={4}
                            />
                        </CardContent>
                    </Card>
                );

            case 3:
                return (
                    <Card>
                        <CardHeader>
                            <CardTitle>Step 4: Visual Symptoms</CardTitle>
                            <CardDescription>Physical symptoms the student has reported or displayed</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <CheckboxGroup
                                name="visualSymptoms"
                                options={VISUAL_SYMPTOM_OPTIONS}
                                value={formData.visualSymptoms.symptoms}
                                onChange={(value) =>
                                    setFormData({
                                        ...formData,
                                        visualSymptoms: { ...formData.visualSymptoms, symptoms: value },
                                    })
                                }
                            />
                            <Textarea
                                label="Specific Symptoms Reported (Optional)"
                                placeholder="When do symptoms occur? How does the student describe them?"
                                value={formData.visualSymptoms.notes}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        visualSymptoms: { ...formData.visualSymptoms, notes: e.target.value },
                                    })
                                }
                                rows={4}
                            />
                        </CardContent>
                    </Card>
                );

            case 4:
                return (
                    <Card>
                        <CardHeader>
                            <CardTitle>Step 5: Motor & Posture</CardTitle>
                            <CardDescription>Physical positioning and motor skills during visual tasks</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <CheckboxGroup
                                name="motorPosture"
                                options={MOTOR_POSTURE_OPTIONS}
                                value={formData.motorPosture.issues}
                                onChange={(value) =>
                                    setFormData({
                                        ...formData,
                                        motorPosture: { ...formData.motorPosture, issues: value },
                                    })
                                }
                            />
                            <Textarea
                                label="Additional Observations (Optional)"
                                placeholder="Describe specific posture or motor patterns..."
                                value={formData.motorPosture.notes}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        motorPosture: { ...formData.motorPosture, notes: e.target.value },
                                    })
                                }
                                rows={4}
                            />
                        </CardContent>
                    </Card>
                );

            case 5:
                return (
                    <Card>
                        <CardHeader>
                            <CardTitle>Step 6: Classroom Observations</CardTitle>
                            <CardDescription>Patterns and triggers observed in classroom settings</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <CheckboxGroup
                                name="classroomObservations"
                                options={CLASSROOM_PATTERNS}
                                value={formData.classroomObservations.patterns}
                                onChange={(value) =>
                                    setFormData({
                                        ...formData,
                                        classroomObservations: { ...formData.classroomObservations, patterns: value },
                                    })
                                }
                            />
                            <Textarea
                                label="Specific Triggers or Patterns * (Required, minimum 50 characters)"
                                placeholder="Describe when issues are most prominent, what seems to help or worsen them..."
                                value={formData.classroomObservations.notes}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        classroomObservations: { ...formData.classroomObservations, notes: e.target.value },
                                    })
                                }
                                rows={5}
                                characterCount={{ current: formData.classroomObservations.notes.length, min: 50 }}
                                required
                            />
                        </CardContent>
                    </Card>
                );

            case 6:
                return (
                    <Card>
                        <CardHeader>
                            <CardTitle>Step 7: Past Interventions</CardTitle>
                            <CardDescription>Services the student has previously received</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <CheckboxGroup
                                name="pastInterventions"
                                options={INTERVENTION_OPTIONS}
                                value={formData.pastInterventions.received}
                                onChange={(value) =>
                                    setFormData({
                                        ...formData,
                                        pastInterventions: { ...formData.pastInterventions, received: value },
                                    })
                                }
                            />
                            <Textarea
                                label="Other Interventions and Outcomes (Optional)"
                                placeholder="Describe any other interventions and what the outcomes were..."
                                value={formData.pastInterventions.notes}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        pastInterventions: { ...formData.pastInterventions, notes: e.target.value },
                                    })
                                }
                                rows={4}
                            />
                        </CardContent>
                    </Card>
                );

            case 7:
                return (
                    <Card>
                        <CardHeader>
                            <CardTitle>Step 8: Relevant History</CardTitle>
                            <CardDescription>Medical or developmental history (requires parental consent)</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                <p className="text-sm text-yellow-800">
                                    ⚠️ Make sure you have parental consent before sharing medical or family history information.
                                </p>
                            </div>
                            <Textarea
                                label="Relevant Medical or Developmental History (Optional)"
                                placeholder="Glasses/contacts, eye exams, family history of vision issues, developmental milestones..."
                                value={formData.relevantHistory}
                                onChange={(e) => setFormData({ ...formData, relevantHistory: e.target.value })}
                                rows={5}
                            />
                        </CardContent>
                    </Card>
                );

            case 8:
                return (
                    <Card>
                        <CardHeader>
                            <CardTitle>Step 9: Teacher Summary</CardTitle>
                            <CardDescription>Your overall assessment and main concerns</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <Textarea
                                label="Main Concerns * (Required, minimum 100 characters)"
                                placeholder="Describe your main concerns and provide specific examples of when you've observed these issues. What prompted you to make this referral?"
                                value={formData.teacherSummary.description}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        teacherSummary: { ...formData.teacherSummary, description: e.target.value },
                                    })
                                }
                                rows={6}
                                characterCount={{ current: formData.teacherSummary.description.length, min: 100 }}
                                required
                            />

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    How long have you observed these patterns? *
                                </label>
                                <select
                                    value={formData.teacherSummary.duration}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            teacherSummary: { ...formData.teacherSummary, duration: e.target.value },
                                        })
                                    }
                                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                >
                                    <option value="">Select duration...</option>
                                    <option value="<1month">Less than 1 month</option>
                                    <option value="1-3months">1-3 months</option>
                                    <option value="3-6months">3-6 months</option>
                                    <option value="6+months">6+ months</option>
                                </select>
                            </div>
                        </CardContent>
                    </Card>
                );

            default:
                return null;
        }
    };

    const canProceed = () => {
        switch (step) {
            case 0:
                return studentId && studentInfo;
            case 5:
                return formData.classroomObservations.notes.length >= 50;
            case 8:
                return formData.teacherSummary.description.length >= 100 && formData.teacherSummary.duration;
            default:
                return true;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navigation */}
            <nav className="bg-white border-b border-gray-200">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center h-16">
                        <Link href="/dashboard" className="text-blue-600 hover:text-blue-700 flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Cancel
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Progress Bar */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Step {step + 1} of 9</span>
                        <span className="text-sm text-gray-500">{Math.round(((step + 1) / 9) * 100)}% complete</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${((step + 1) / 9) * 100}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {renderStep()}

                {/* Navigation Buttons */}
                <div className="flex gap-4 mt-8">
                    {step > 0 && (
                        <Button variant="outline" onClick={handleBack} className="flex-1">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            Back
                        </Button>
                    )}
                    {step < 8 ? (
                        <Button onClick={handleNext} disabled={!canProceed()} className="flex-1">
                            Next
                            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </Button>
                    ) : (
                        <Button
                            onClick={handleSubmit}
                            disabled={!canProceed() || submitting}
                            loading={submitting}
                            className="flex-1"
                        >
                            Submit Referral
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function NewReferralPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        }>
            <WizardContent />
        </Suspense>
    );
}
