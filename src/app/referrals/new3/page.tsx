'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { collection, addDoc, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Textarea } from '@/components/ui/FormInputs';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { generateCaseNumber } from '@/lib/utils';

// ============================================
// Category Definitions
// ============================================

interface FlagItem {
    value: string;
    label: string;
    description?: string;
}

const CATEGORY_A_FLAGS: FlagItem[] = [
    { value: 'squintingAtBoard', label: 'Squinting at the board', description: 'Narrows eyes or squints when looking at distance content' },
    { value: 'distanceBlur', label: 'Complains of distance blur', description: 'Reports that the board or distant objects are blurry' },
    { value: 'holdingMaterialCloseOrFar', label: 'Holding material too close or too far', description: 'Unusual working distance when reading or writing' },
];

const CATEGORY_B_FLAGS: FlagItem[] = [
    { value: 'headachesAfterNearWork', label: 'Headaches after near work', description: 'Reports headaches during or after reading, writing, or screen use' },
    { value: 'doubleVision', label: 'Double vision', description: 'Reports seeing two of things, or words overlapping' },
    { value: 'coveringClosingOneEye', label: 'Covering or closing one eye', description: 'Shuts or covers one eye when reading or doing close work' },
    { value: 'eyeRubbingHeadTilting', label: 'Eye rubbing or head tilting', description: 'Frequently rubs eyes or tilts head to one side during visual tasks' },
];

const CATEGORY_C_FLAGS: FlagItem[] = [
    { value: 'trackingSkippingLines', label: 'Tracking / Skipping lines', description: 'Loses place, skips lines, or needs a finger to track when reading' },
    { value: 'readingBelowGradeLevel', label: 'Reading below grade level', description: 'Reads significantly below expected level for their age/grade' },
    { value: 'wordsMoving', label: 'Words moving on the page', description: 'Reports that words swim, jump, or move around when reading' },
];

// ============================================
// Referral Types
// ============================================

type ReferralOutcome = 'FULL_FUNCTIONAL' | 'BINOCULAR_ASSESSMENT' | 'MONITOR';

interface TriageOutcome {
    type: ReferralOutcome;
    title: string;
    subtitle: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    providerType: string;
    orderType: string;
    color: string;
    bgClass: string;
    borderClass: string;
    textClass: string;
    badgeBg: string;
    icon: string;
    description: string;
    includes: string[];
    triggerCategory: string;
    flags: string[];
}

function determineOutcome(
    categoryA: string[],
    categoryB: string[],
    categoryC: string[]
): TriageOutcome {
    const allALabels = categoryA.map(v => CATEGORY_A_FLAGS.find(f => f.value === v)?.label || v);
    const allBLabels = categoryB.map(v => CATEGORY_B_FLAGS.find(f => f.value === v)?.label || v);
    const allCLabels = categoryC.map(v => CATEGORY_C_FLAGS.find(f => f.value === v)?.label || v);

    // Priority 1: Category C → Full Functional Vision Evaluation
    if (categoryC.length > 0) {
        return {
            type: 'FULL_FUNCTIONAL',
            title: 'Full Functional Vision Evaluation',
            subtitle: 'Category C flags detected — Complex/Neuro concerns',
            priority: 'urgent',
            providerType: 'Behavioral / Developmental Optometrist (FCOVD)',
            orderType: 'Comprehensive Functional Vision Evaluation',
            color: '#dc2626',
            bgClass: 'bg-red-50',
            borderClass: 'border-red-200',
            textClass: 'text-red-700',
            badgeBg: 'bg-red-600',
            icon: '🔴',
            description: 'This student shows signs of complex visual processing or neuro-visual deficits that require a full functional vision evaluation. This goes beyond a standard eye exam and includes neuro-cognitive testing, visual processing assessment, and eye tracking analysis.',
            includes: [
                'Neuro-cognitive visual testing',
                'Visual processing assessment',
                'Eye tracking analysis (Visagraph/Tobii)',
                'Binocularity and oculomotor evaluation',
            ],
            triggerCategory: 'Category C (Complex/Neuro)',
            flags: [...allCLabels, ...allBLabels, ...allALabels],
        };
    }

    // Priority 2: Category A or B → Binocular Vision Assessment
    if (categoryB.length > 0 || categoryA.length > 0) {
        const triggerCat = categoryB.length > 0 ? 'Category B (Binocular Efficiency)' : 'Category A (Visual Acuity/Refraction)';
        return {
            type: 'BINOCULAR_ASSESSMENT',
            title: 'Binocular Vision Assessment',
            subtitle: categoryB.length > 0
                ? 'Category B flags detected — Binocular efficiency concerns'
                : 'Category A flags detected — Visual acuity/refraction concerns',
            priority: categoryB.length > 0 ? 'high' : 'medium',
            providerType: 'Developmental Optometrist',
            orderType: 'Binocular Vision Assessment with Refractive Evaluation',
            color: '#f59e0b',
            bgClass: 'bg-amber-50',
            borderClass: 'border-amber-200',
            textClass: 'text-amber-700',
            badgeBg: 'bg-amber-500',
            icon: '🟠',
            description: categoryB.length > 0
                ? 'This student shows signs of binocular efficiency issues that may affect reading and learning. A binocular vision assessment will evaluate eye teaming, accommodation, and convergence.'
                : 'This student shows signs of possible refractive error (visual acuity concerns). A binocular vision assessment with refractive evaluation will determine if glasses or further intervention is needed.',
            includes: [
                'Eye teaming efficiency evaluation',
                'Accommodation testing',
                'Convergence sufficiency assessment',
                'Visual acuity and refraction check',
            ],
            triggerCategory: triggerCat,
            flags: [...allBLabels, ...allALabels],
        };
    }

    // No flags → Monitor
    return {
        type: 'MONITOR',
        title: 'Monitor / Rescreen in 6 Months',
        subtitle: 'No red flags identified at this time',
        priority: 'low',
        providerType: 'Continue classroom monitoring',
        orderType: 'Rescreen in 6 months',
        color: '#16a34a',
        bgClass: 'bg-green-50',
        borderClass: 'border-green-200',
        textClass: 'text-green-700',
        badgeBg: 'bg-green-600',
        icon: '🟢',
        description: 'No visual red flags were identified in this screening. Continue to monitor the student and rescreen in 6 months, or sooner if new concerns arise.',
        includes: [
            'Continue regular classroom observation',
            'Rescreen in 6 months',
            'Re-refer if new symptoms emerge',
        ],
        triggerCategory: 'None',
        flags: [],
    };
}

// ============================================
// Referral Letter Generator
// ============================================

function generateReferralLetter(
    outcome: TriageOutcome,
    categoryA: string[],
    categoryB: string[],
    categoryC: string[],
    additionalNotes: string,
    studentInfo: any,
    teacherInfo: any,
    caseNumber: string
): string {
    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    const flagLabel = (items: string[], flags: FlagItem[]) =>
        items.map(v => flags.find(f => f.value === v)?.label || v);

    const catALabels = flagLabel(categoryA, CATEGORY_A_FLAGS);
    const catBLabels = flagLabel(categoryB, CATEGORY_B_FLAGS);
    const catCLabels = flagLabel(categoryC, CATEGORY_C_FLAGS);

    return `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; color: #1f2937;">
    <div style="border-bottom: 3px solid ${outcome.color}; padding-bottom: 20px; margin-bottom: 30px;">
        <h1 style="margin: 0; font-size: 24px; color: #111827;">School Vision Referral — Triage Report</h1>
        <p style="margin: 8px 0 0 0; color: #6b7280; font-size: 14px;">Case #${caseNumber} | Generated ${today}</p>
    </div>

    <div style="background: ${outcome.color}10; border-left: 4px solid ${outcome.color}; padding: 20px; margin-bottom: 30px; border-radius: 4px;">
        <h2 style="margin: 0 0 8px 0; color: ${outcome.color}; font-size: 18px;">${outcome.icon} ${outcome.title}</h2>
        <p style="margin: 0; font-size: 14px;"><strong>Recommended Provider:</strong> ${outcome.providerType}</p>
        <p style="margin: 4px 0 0 0; font-size: 14px;"><strong>Evaluation Type:</strong> ${outcome.orderType}</p>
        <p style="margin: 4px 0 0 0; font-size: 14px;"><strong>Priority:</strong> ${outcome.priority.toUpperCase()}</p>
    </div>

    <div style="margin-bottom: 24px;">
        <h3 style="color: #374151; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px;">Patient Information</h3>
        <table style="width: 100%; font-size: 14px;">
            <tr><td style="padding: 4px 0; color: #6b7280; width: 180px;">Student Name:</td><td style="font-weight: 600;">${studentInfo.firstName} ${studentInfo.lastName}</td></tr>
            <tr><td style="padding: 4px 0; color: #6b7280;">Grade:</td><td>${studentInfo.grade || 'Not specified'}</td></tr>
            <tr><td style="padding: 4px 0; color: #6b7280;">Referring Teacher:</td><td>${teacherInfo.displayName}</td></tr>
            <tr><td style="padding: 4px 0; color: #6b7280;">Date of Screening:</td><td>${today}</td></tr>
        </table>
    </div>

    <div style="margin-bottom: 24px;">
        <h3 style="color: #374151; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px;">Screening Flags Identified</h3>

        <div style="margin-bottom: 16px;">
            <h4 style="margin: 0 0 8px 0; font-size: 14px;">
                <span style="display: inline-block; width: 12px; height: 12px; border-radius: 50%; background: #dc2626; margin-right: 8px;"></span>
                Category C — Complex/Neuro ${categoryC.length > 0 ? '⚠️' : ''}
            </h4>
            ${catCLabels.length > 0
            ? `<ul style="font-size: 14px; padding-left: 28px; margin: 0;">${catCLabels.map(l => `<li style="margin-bottom: 4px; color: #dc2626; font-weight: 500;">${l}</li>`).join('')}</ul>`
            : '<p style="font-size: 14px; color: #9ca3af; padding-left: 28px; margin: 0;">None noted</p>'}
        </div>

        <div style="margin-bottom: 16px;">
            <h4 style="margin: 0 0 8px 0; font-size: 14px;">
                <span style="display: inline-block; width: 12px; height: 12px; border-radius: 50%; background: #f59e0b; margin-right: 8px;"></span>
                Category B — Binocular Efficiency ${categoryB.length > 0 ? '⚠️' : ''}
            </h4>
            ${catBLabels.length > 0
            ? `<ul style="font-size: 14px; padding-left: 28px; margin: 0;">${catBLabels.map(l => `<li style="margin-bottom: 4px; color: #b45309; font-weight: 500;">${l}</li>`).join('')}</ul>`
            : '<p style="font-size: 14px; color: #9ca3af; padding-left: 28px; margin: 0;">None noted</p>'}
        </div>

        <div style="margin-bottom: 16px;">
            <h4 style="margin: 0 0 8px 0; font-size: 14px;">
                <span style="display: inline-block; width: 12px; height: 12px; border-radius: 50%; background: #eab308; margin-right: 8px;"></span>
                Category A — Visual Acuity/Refraction ${categoryA.length > 0 ? '⚠️' : ''}
            </h4>
            ${catALabels.length > 0
            ? `<ul style="font-size: 14px; padding-left: 28px; margin: 0;">${catALabels.map(l => `<li style="margin-bottom: 4px; color: #a16207; font-weight: 500;">${l}</li>`).join('')}</ul>`
            : '<p style="font-size: 14px; color: #9ca3af; padding-left: 28px; margin: 0;">None noted</p>'}
        </div>
    </div>

    <div style="margin-bottom: 24px;">
        <h3 style="color: #374151; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px;">Triage Decision</h3>
        <p style="font-size: 14px; line-height: 1.6;">${outcome.description}</p>
        <h4 style="font-size: 14px; margin: 16px 0 8px 0;">This evaluation includes:</h4>
        <ul style="font-size: 14px; padding-left: 20px;">
            ${outcome.includes.map(i => `<li style="margin-bottom: 4px;">${i}</li>`).join('')}
        </ul>
    </div>

    ${additionalNotes ? `
    <div style="margin-bottom: 24px;">
        <h3 style="color: #374151; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px;">Teacher Notes</h3>
        <p style="font-size: 14px; line-height: 1.6; color: #4b5563;">${additionalNotes}</p>
    </div>
    ` : ''}

    <div style="border-top: 2px solid #e5e7eb; padding-top: 20px; margin-top: 30px; font-size: 12px; color: #9ca3af;">
        <p>This report was generated using the School Vision Referral Triage Algorithm. Please consult a Developmental Optometrist for professional evaluation.</p>
        <p style="font-style: italic;">⚠️ This screening is not a diagnosis. A comprehensive vision evaluation by a qualified provider is required for definitive assessment.</p>
    </div>
</div>`;
}

// ============================================
// Main Component
// ============================================

function ScreeningWizardContent() {
    const { userProfile, loading } = useRequireAuth(['teacher', 'school_admin']);
    const router = useRouter();
    const searchParams = useSearchParams();
    const preSelectedStudentId = searchParams.get('studentId');

    const [submitting, setSubmitting] = useState(false);
    const [studentId, setStudentId] = useState(preSelectedStudentId || '');
    const [studentInfo, setStudentInfo] = useState<any>(null);

    const [categoryA, setCategoryA] = useState<string[]>([]);
    const [categoryB, setCategoryB] = useState<string[]>([]);
    const [categoryC, setCategoryC] = useState<string[]>([]);
    const [additionalNotes, setAdditionalNotes] = useState('');

    const [submitted, setSubmitted] = useState(false);
    const [outcome, setOutcome] = useState<TriageOutcome | null>(null);
    const [referralLetterHtml, setReferralLetterHtml] = useState('');
    const [caseNumber, setCaseNumber] = useState('');

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

    // Live outcome preview
    const liveOutcome = determineOutcome(categoryA, categoryB, categoryC);
    const hasAnyFlags = categoryA.length > 0 || categoryB.length > 0 || categoryC.length > 0;

    const handleSubmit = async () => {
        if (!studentId || !userProfile?.schoolId) {
            toast.error('Please select a student first');
            return;
        }

        setSubmitting(true);

        try {
            const newCaseNumber = generateCaseNumber();
            setCaseNumber(newCaseNumber);

            const result = determineOutcome(categoryA, categoryB, categoryC);
            setOutcome(result);

            const letter = generateReferralLetter(
                result, categoryA, categoryB, categoryC,
                additionalNotes, studentInfo, userProfile, newCaseNumber
            );
            setReferralLetterHtml(letter);

            // Save questionnaire
            const questionnaireRef = await addDoc(collection(db, 'questionnaires'), {
                type: 'vision_screening',
                screeningData: {
                    categoryA,
                    categoryB,
                    categoryC,
                    additionalNotes,
                    outcome: result.type,
                    outcomeTitle: result.title,
                    priority: result.priority,
                },
                referralLetterHtml: letter,
                createdAt: serverTimestamp(),
            });

            // Save referral
            await addDoc(collection(db, 'referrals'), {
                caseNumber: newCaseNumber,
                schoolId: userProfile.schoolId,
                teacherId: userProfile.uid,
                studentId,
                status: result.type === 'FULL_FUNCTIONAL' ? 'urgent' : result.type === 'BINOCULAR_ASSESSMENT' ? 'new' : 'new',
                priority: result.priority,
                questionnaireId: questionnaireRef.id,
                wizardVersion: 'v3',
                triagePath: result.type,
                attachments: [],
                createdAt: serverTimestamp(),
                createdBy: userProfile.uid,
                updatedAt: serverTimestamp(),
            });

            // Send email
            const emailType = result.type === 'FULL_FUNCTIONAL'
                ? 'triage_path_a'
                : result.type === 'BINOCULAR_ASSESSMENT'
                    ? 'triage_path_b'
                    : 'triage_monitor';

            try {
                await fetch('/api/send-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: emailType,
                        data: {
                            teacherEmail: userProfile.email,
                            teacherName: userProfile.displayName,
                            studentName: `${studentInfo.firstName} ${studentInfo.lastName}`,
                            caseNumber: newCaseNumber,
                            triagePath: result.type,
                            providerType: result.providerType,
                            orderType: result.orderType,
                            surveyType: 'Screening Checklist',
                            surveyScore: 0,
                            flags: result.flags,
                        },
                    }),
                });
            } catch (emailError) {
                console.error('Failed to send email:', emailError);
            }

            setSubmitted(true);
            toast.success(`Screening complete! Case #${newCaseNumber}`);
        } catch (error: any) {
            console.error('Error creating screening referral:', error);
            toast.error(error.message || 'Failed to submit screening');
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

    // ─────────────── POST-SUBMISSION VIEW ───────────────
    if (submitted && outcome) {
        return (
            <div className="min-h-screen bg-gray-50">
                <nav className="bg-white border-b border-gray-200">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between h-16">
                            <Link href="/dashboard" className="text-blue-600 hover:text-blue-700 flex items-center gap-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                                Back to Dashboard
                            </Link>
                            <span className="text-sm font-medium text-gray-500">Case #{caseNumber}</span>
                        </div>
                    </div>
                </nav>

                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
                    {/* Result Banner */}
                    <div className={`rounded-2xl border-2 p-8 text-center ${outcome.bgClass} ${outcome.borderClass}`}>
                        <div className="text-5xl mb-4">{outcome.icon}</div>
                        <h1 className={`text-2xl font-bold ${outcome.textClass}`}>{outcome.title}</h1>
                        <p className="text-gray-600 mt-2">{outcome.subtitle}</p>
                        <div className="mt-4 flex justify-center gap-4 text-sm">
                            <span className="font-medium">Provider: {outcome.providerType}</span>
                            <span className="text-gray-300">|</span>
                            <span className="font-medium">Priority: {outcome.priority.toUpperCase()}</span>
                        </div>
                    </div>

                    {/* Referral Letter */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Clinical Referral Letter</CardTitle>
                            <CardDescription>This letter will be attached to the referral case</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="border rounded-lg overflow-hidden">
                                <div className="bg-gray-100 px-4 py-2 border-b flex items-center gap-2">
                                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <span className="text-sm font-medium text-gray-700">Referral Report</span>
                                </div>
                                <div
                                    className="p-6 bg-white max-h-[500px] overflow-y-auto"
                                    dangerouslySetInnerHTML={{ __html: referralLetterHtml }}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex gap-4">
                        <Link href="/dashboard" className="flex-1">
                            <Button variant="outline" className="w-full">Return to Dashboard</Button>
                        </Link>
                        <Link href="/referrals" className="flex-1">
                            <Button className="w-full">View All Referrals</Button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // ─────────────── MAIN SCREENING VIEW ───────────────
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navigation */}
            <nav className="bg-white border-b border-gray-200">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <Link href="/dashboard" className="text-blue-600 hover:text-blue-700 flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Cancel
                        </Link>
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-gradient-to-br from-amber-500 to-red-500 rounded flex items-center justify-center">
                                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                            </div>
                            <span className="text-sm font-semibold text-gray-700">Vision Screening</span>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
                {/* Student Selection */}
                <Card>
                    <CardHeader>
                        <CardTitle>Student</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {studentInfo ? (
                            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                                        <span className="text-white font-semibold">
                                            {studentInfo.firstName[0]}{studentInfo.lastName[0]}
                                        </span>
                                    </div>
                                    <div>
                                        <div className="font-semibold text-gray-900">{studentInfo.firstName} {studentInfo.lastName}</div>
                                        <div className="text-sm text-gray-600">Grade {studentInfo.grade}</div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <p className="text-gray-600 mb-3">Select a student to screen</p>
                                <Link href="/students">
                                    <Button size="sm">Select Student</Button>
                                </Link>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Screening Checklist */}
                {studentInfo && (
                    <>
                        {/* CATEGORY C — Highest Priority */}
                        <Card className="border-l-4 border-l-red-500">
                            <CardHeader>
                                <div className="flex items-center gap-3">
                                    <span className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-red-600 text-sm font-bold">C</span>
                                    <div>
                                        <CardTitle className="text-lg">Complex / Neuro</CardTitle>
                                        <CardDescription>Highest priority — triggers Full Functional Vision Evaluation</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {CATEGORY_C_FLAGS.map(flag => (
                                        <label key={flag.value} className="flex items-start gap-3 cursor-pointer group p-3 rounded-lg hover:bg-red-50 transition-colors">
                                            <input
                                                type="checkbox"
                                                checked={categoryC.includes(flag.value)}
                                                onChange={(e) => {
                                                    if (e.target.checked) setCategoryC([...categoryC, flag.value]);
                                                    else setCategoryC(categoryC.filter(v => v !== flag.value));
                                                }}
                                                className="mt-1 rounded text-red-600 focus:ring-2 focus:ring-red-500 h-5 w-5"
                                            />
                                            <div className="flex-1">
                                                <div className="font-medium text-gray-900 group-hover:text-red-600 transition-colors">{flag.label}</div>
                                                {flag.description && <div className="text-sm text-gray-500 mt-0.5">{flag.description}</div>}
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* CATEGORY B — Medium Priority */}
                        <Card className="border-l-4 border-l-amber-500">
                            <CardHeader>
                                <div className="flex items-center gap-3">
                                    <span className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 text-sm font-bold">B</span>
                                    <div>
                                        <CardTitle className="text-lg">Binocular Efficiency</CardTitle>
                                        <CardDescription>Medium priority — triggers Binocular Vision Assessment</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {CATEGORY_B_FLAGS.map(flag => (
                                        <label key={flag.value} className="flex items-start gap-3 cursor-pointer group p-3 rounded-lg hover:bg-amber-50 transition-colors">
                                            <input
                                                type="checkbox"
                                                checked={categoryB.includes(flag.value)}
                                                onChange={(e) => {
                                                    if (e.target.checked) setCategoryB([...categoryB, flag.value]);
                                                    else setCategoryB(categoryB.filter(v => v !== flag.value));
                                                }}
                                                className="mt-1 rounded text-amber-600 focus:ring-2 focus:ring-amber-500 h-5 w-5"
                                            />
                                            <div className="flex-1">
                                                <div className="font-medium text-gray-900 group-hover:text-amber-600 transition-colors">{flag.label}</div>
                                                {flag.description && <div className="text-sm text-gray-500 mt-0.5">{flag.description}</div>}
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* CATEGORY A — Baseline Priority */}
                        <Card className="border-l-4 border-l-yellow-400">
                            <CardHeader>
                                <div className="flex items-center gap-3">
                                    <span className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-600 text-sm font-bold">A</span>
                                    <div>
                                        <CardTitle className="text-lg">Visual Acuity / Refraction</CardTitle>
                                        <CardDescription>Baseline priority — triggers Binocular Vision Assessment</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {CATEGORY_A_FLAGS.map(flag => (
                                        <label key={flag.value} className="flex items-start gap-3 cursor-pointer group p-3 rounded-lg hover:bg-yellow-50 transition-colors">
                                            <input
                                                type="checkbox"
                                                checked={categoryA.includes(flag.value)}
                                                onChange={(e) => {
                                                    if (e.target.checked) setCategoryA([...categoryA, flag.value]);
                                                    else setCategoryA(categoryA.filter(v => v !== flag.value));
                                                }}
                                                className="mt-1 rounded text-yellow-600 focus:ring-2 focus:ring-yellow-500 h-5 w-5"
                                            />
                                            <div className="flex-1">
                                                <div className="font-medium text-gray-900 group-hover:text-yellow-600 transition-colors">{flag.label}</div>
                                                {flag.description && <div className="text-sm text-gray-500 mt-0.5">{flag.description}</div>}
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Additional Notes */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Additional Notes</CardTitle>
                                <CardDescription>Any other observations or context (optional)</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Textarea
                                    placeholder="Describe specific examples, when symptoms are most noticeable, how long you've observed them..."
                                    value={additionalNotes}
                                    onChange={(e) => setAdditionalNotes(e.target.value)}
                                    rows={3}
                                />
                            </CardContent>
                        </Card>

                        {/* Live Result Preview */}
                        <div className={`rounded-2xl border-2 p-6 transition-all duration-300 ${liveOutcome.bgClass} ${liveOutcome.borderClass}`}>
                            <div className="flex items-center gap-4">
                                <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white text-2xl font-bold ${liveOutcome.badgeBg}`}>
                                    {liveOutcome.type === 'FULL_FUNCTIONAL' ? 'F' : liveOutcome.type === 'BINOCULAR_ASSESSMENT' ? 'B' : '✓'}
                                </div>
                                <div className="flex-1">
                                    <h3 className={`text-lg font-bold ${liveOutcome.textClass}`}>
                                        {liveOutcome.icon} {liveOutcome.title}
                                    </h3>
                                    <p className="text-sm text-gray-600">{liveOutcome.subtitle}</p>
                                    {hasAnyFlags && (
                                        <p className="text-sm text-gray-500 mt-1">
                                            {liveOutcome.flags.length} flag{liveOutcome.flags.length !== 1 ? 's' : ''} identified • Priority: {liveOutcome.priority.toUpperCase()}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Submit */}
                        <Button
                            onClick={handleSubmit}
                            disabled={!studentId || submitting}
                            loading={submitting}
                            className="w-full py-4 text-lg"
                        >
                            {hasAnyFlags ? `Submit Referral — ${liveOutcome.title}` : 'Submit Screening — No Flags (Monitor)'}
                        </Button>
                    </>
                )}
            </div>
        </div>
    );
}

// ============================================
// Page Export
// ============================================

export default function VisionScreeningPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        }>
            <ScreeningWizardContent />
        </Suspense>
    );
}
