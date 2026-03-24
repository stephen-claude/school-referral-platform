'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { collection, addDoc, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Textarea, CheckboxGroup } from '@/components/ui/FormInputs';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { generateCaseNumber } from '@/lib/utils';
import { TriageData, TriageResult } from '@/types';
import {
    getSurveyForStudent,
    scoreSurvey,
    getSurveyDefinition,
    getMaxScore,
    interpretScore,
    SurveyDefinition,
} from '@/lib/triage-surveys';
import { checkBypass, determinePath, generateReferralLetter } from '@/lib/triage-engine';

// ============================================
// ABC Observation Options
// ============================================

const APPEARANCE_OPTIONS = [
    { value: 'redWateryEyes', label: 'Red or watery eyes' },
    { value: 'droopingLids', label: 'Drooping lids (ptosis)' },
    { value: 'mismatchedPupils', label: 'Mismatched pupil sizes' },
    { value: 'eyeTurning', label: 'One eye turning in or out' },
];

const BEHAVIOR_OPTIONS = [
    { value: 'skipsLines', label: 'Skips lines or words while reading' },
    { value: 'usesFingerToTrack', label: 'Uses finger to keep place when reading' },
    { value: 'extremeHeadTilt', label: 'Extreme head tilt while reading' },
    { value: 'coversOneEye', label: 'Covers one eye to read' },
    { value: 'writesUpDownhill', label: 'Writes "uphill" or "downhill"' },
    { value: 'clumsy', label: 'General clumsiness or poor coordination' },
];

const COMPLAINT_OPTIONS = [
    { value: 'wordsSwimMove', label: 'Says words swim, move, or jump on the page' },
    { value: 'doubleVision', label: 'Reports seeing double (diplopia)' },
    { value: 'headachesAfterReading', label: 'Headaches after reading or near work' },
    { value: 'nauseaDizziness', label: 'Nausea or dizziness after near work' },
    { value: 'lightSensitivity', label: 'Light sensitivity' },
];

// ============================================
// Step Definitions
// ============================================

type WizardStep =
    | 'SELECT_STUDENT'
    | 'MEDICAL_HISTORY'
    | 'BYPASS_RESULT'
    | 'ABC_OBSERVATIONS'
    | 'DISTANCE_VISION'
    | 'SYMPTOM_SURVEY'
    | 'RESULTS'
    | 'REVIEW_SUBMIT';

function getStepNumber(step: WizardStep, isBypass: boolean): number {
    if (isBypass) {
        const bypassSteps: WizardStep[] = ['SELECT_STUDENT', 'MEDICAL_HISTORY', 'BYPASS_RESULT', 'REVIEW_SUBMIT'];
        return bypassSteps.indexOf(step);
    }
    const normalSteps: WizardStep[] = ['SELECT_STUDENT', 'MEDICAL_HISTORY', 'ABC_OBSERVATIONS', 'DISTANCE_VISION', 'SYMPTOM_SURVEY', 'RESULTS', 'REVIEW_SUBMIT'];
    return normalSteps.indexOf(step);
}

function getTotalSteps(isBypass: boolean): number {
    return isBypass ? 4 : 7;
}

// ============================================
// Main Wizard Component
// ============================================

function TriageWizardContent() {
    const { userProfile, loading } = useRequireAuth(['teacher', 'school_admin']);
    const router = useRouter();
    const searchParams = useSearchParams();
    const preSelectedStudentId = searchParams.get('studentId');

    // Core state
    const [step, setStep] = useState<WizardStep>('SELECT_STUDENT');
    const [submitting, setSubmitting] = useState(false);
    const [studentId, setStudentId] = useState(preSelectedStudentId || '');
    const [studentInfo, setStudentInfo] = useState<any>(null);

    // Triage state
    const [medicalHistory, setMedicalHistory] = useState({
        hasADHD: false,
        hasDyslexia: false,
        hasTBI: false,
        hasIEPReading: false,
        notes: '',
    });

    const [bypassInfo, setBypassInfo] = useState<{
        triggered: boolean;
        reasons: string[];
        explanations: string[];
    }>({ triggered: false, reasons: [], explanations: [] });

    const [isBypassPath, setIsBypassPath] = useState(false);

    const [observations, setObservations] = useState({
        appearance: [] as string[],
        behavior: [] as string[],
        complaints: [] as string[],
        notes: '',
    });

    const [distanceVisionBlurry, setDistanceVisionBlurry] = useState(false);

    // Survey state
    const [selectedSurvey, setSelectedSurvey] = useState<SurveyDefinition | null>(null);
    const [surveyResponses, setSurveyResponses] = useState<number[]>([]);

    // Result state
    const [triageResult, setTriageResult] = useState<TriageResult | null>(null);
    const [referralLetterHtml, setReferralLetterHtml] = useState('');

    // Fetch student
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

    // ============================================
    // Navigation Logic
    // ============================================

    const handleNext = () => {
        switch (step) {
            case 'SELECT_STUDENT':
                setStep('MEDICAL_HISTORY');
                break;

            case 'MEDICAL_HISTORY': {
                const bypass = checkBypass(medicalHistory);
                setBypassInfo(bypass);
                if (bypass.triggered) {
                    setStep('BYPASS_RESULT');
                } else {
                    setStep('ABC_OBSERVATIONS');
                }
                break;
            }

            case 'BYPASS_RESULT':
                // "Generate Referral" — skip to review
                setIsBypassPath(true);
                computeResult(true);
                setStep('REVIEW_SUBMIT');
                break;

            case 'ABC_OBSERVATIONS': {
                setStep('DISTANCE_VISION');
                break;
            }

            case 'DISTANCE_VISION': {
                // Determine which survey to show
                const survey = getSurveyForStudent(medicalHistory, observations.complaints);
                setSelectedSurvey(survey);
                setSurveyResponses(new Array(survey.questions.length).fill(-1));
                setStep('SYMPTOM_SURVEY');
                break;
            }

            case 'SYMPTOM_SURVEY':
                computeResult(false);
                setStep('RESULTS');
                break;

            case 'RESULTS':
                setStep('REVIEW_SUBMIT');
                break;

            default:
                break;
        }
    };

    const handleBack = () => {
        switch (step) {
            case 'MEDICAL_HISTORY':
                setStep('SELECT_STUDENT');
                break;
            case 'BYPASS_RESULT':
                setStep('MEDICAL_HISTORY');
                break;
            case 'ABC_OBSERVATIONS':
                setStep('MEDICAL_HISTORY');
                break;
            case 'DISTANCE_VISION':
                setStep('ABC_OBSERVATIONS');
                break;
            case 'SYMPTOM_SURVEY':
                setStep('DISTANCE_VISION');
                break;
            case 'RESULTS':
                setStep('SYMPTOM_SURVEY');
                break;
            case 'REVIEW_SUBMIT':
                if (isBypassPath) {
                    setStep('BYPASS_RESULT');
                } else {
                    setStep('RESULTS');
                }
                break;
        }
    };

    const handleContinueFromBypass = () => {
        // Teacher wants to continue assessment despite bypass
        setIsBypassPath(false);
        setStep('ABC_OBSERVATIONS');
    };

    // ============================================
    // Compute Result
    // ============================================

    const computeResult = (bypass: boolean) => {
        const score = bypass ? 0 : scoreSurvey(surveyResponses.map(r => r === -1 ? 0 : r));
        const surveyType = selectedSurvey?.type || 'COVD-QOL';

        const triageData: TriageData = {
            medicalHistory,
            observations,
            distanceVisionBlurry,
            surveyType,
            surveyResponses: bypass ? [] : surveyResponses,
            surveyScore: score,
            triagePath: 'MONITOR', // will be overwritten
            triageReason: '',
            bypassTriggered: bypass && bypassInfo.triggered,
            bypassReason: bypass ? bypassInfo.reasons.join('; ') : undefined,
        };

        const result = determinePath(triageData);
        triageData.triagePath = result.path;
        triageData.triageReason = result.reason;

        setTriageResult(result);

        // Generate the referral letter
        if (studentInfo && userProfile) {
            const caseNum = generateCaseNumber();
            const letter = generateReferralLetter(triageData, result, studentInfo, userProfile, caseNum);
            setReferralLetterHtml(letter);
        }
    };

    // ============================================
    // Submit
    // ============================================

    const handleSubmit = async () => {
        if (!studentId || !userProfile?.schoolId || !triageResult) {
            toast.error('Missing required information');
            return;
        }

        setSubmitting(true);

        try {
            const caseNumber = generateCaseNumber();
            const score = isBypassPath ? 0 : scoreSurvey(surveyResponses.map(r => r === -1 ? 0 : r));
            const surveyType = selectedSurvey?.type || 'COVD-QOL';

            const triageData: TriageData = {
                medicalHistory,
                observations,
                distanceVisionBlurry,
                surveyType,
                surveyResponses: isBypassPath ? [] : surveyResponses,
                surveyScore: score,
                triagePath: triageResult.path,
                triageReason: triageResult.reason,
                bypassTriggered: isBypassPath && bypassInfo.triggered,
                bypassReason: isBypassPath ? bypassInfo.reasons.join('; ') : undefined,
            };

            // Create questionnaire (triage version)
            const questionnaireRef = await addDoc(collection(db, 'questionnaires'), {
                type: 'vision_triage',
                triageData,
                referralLetterHtml,
                createdAt: serverTimestamp(),
            });

            // Create referral
            await addDoc(collection(db, 'referrals'), {
                caseNumber,
                schoolId: userProfile.schoolId,
                teacherId: userProfile.uid,
                studentId,
                status: triageResult.path === 'PATH_A' ? 'urgent' : 'new',
                priority: triageResult.priority,
                questionnaireId: questionnaireRef.id,
                wizardVersion: 'v2',
                triagePath: triageResult.path,
                attachments: [],
                createdAt: serverTimestamp(),
                createdBy: userProfile.uid,
                updatedAt: serverTimestamp(),
            });

            // Send path-specific email
            const emailType = triageResult.path === 'PATH_A'
                ? 'triage_path_a'
                : triageResult.path === 'PATH_B'
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
                            studentName: studentInfo ? `${studentInfo.firstName} ${studentInfo.lastName}` : 'Student',
                            caseNumber,
                            triagePath: triageResult.path,
                            providerType: triageResult.providerType,
                            orderType: triageResult.orderType,
                            surveyType,
                            surveyScore: score,
                            flags: triageResult.flags,
                        },
                    }),
                });
            } catch (emailError) {
                console.error('Failed to send triage email:', emailError);
            }

            const pathLabel = triageResult.path === 'PATH_A' ? 'Functional Evaluation' : triageResult.path === 'PATH_B' ? 'Binocular Assessment' : 'Monitoring';
            toast.success(`Triage complete! Case #${caseNumber} — ${pathLabel}`);
            router.push('/dashboard');
        } catch (error: any) {
            console.error('Error creating triage referral:', error);
            toast.error(error.message || 'Failed to submit triage');
        } finally {
            setSubmitting(false);
        }
    };

    // ============================================
    // Validation
    // ============================================

    const canProceed = () => {
        switch (step) {
            case 'SELECT_STUDENT':
                return studentId && studentInfo;
            case 'SYMPTOM_SURVEY':
                return surveyResponses.every(r => r >= 0);
            default:
                return true;
        }
    };

    // ============================================
    // Loading State
    // ============================================

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    const currentStepNum = getStepNumber(step, isBypassPath);
    const totalSteps = getTotalSteps(isBypassPath);

    // ============================================
    // Render Steps
    // ============================================

    const renderStep = () => {
        switch (step) {
            // ─────────────── SELECT STUDENT ───────────────
            case 'SELECT_STUDENT':
                return (
                    <Card>
                        <CardHeader>
                            <CardTitle>Select Student</CardTitle>
                            <CardDescription>Choose the student for this vision triage assessment</CardDescription>
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
                                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                    </div>
                                    <p className="text-gray-600 mb-4">No student selected</p>
                                    <Link href="/students">
                                        <Button>Select a Student</Button>
                                    </Link>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                );

            // ─────────────── MEDICAL HISTORY ───────────────
            case 'MEDICAL_HISTORY':
                return (
                    <Card>
                        <CardHeader>
                            <CardTitle>Medical & Academic History</CardTitle>
                            <CardDescription>
                                These conditions are strongly correlated with functional vision deficits.
                                If any apply, the student may qualify for an immediate referral (Fast Pass).
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-5">
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-2">
                                <p className="text-sm text-amber-800 font-medium">
                                    ⚡ Fast Pass Protocol: If any of these conditions are present, the student qualifies for an immediate Functional Vision Evaluation referral — no symptom scoring needed.
                                </p>
                            </div>

                            {[
                                { key: 'hasADHD' as const, label: 'Diagnosed ADHD / ADD', desc: '3x comorbidity with Convergence Insufficiency (Granet, 2005)' },
                                { key: 'hasDyslexia' as const, label: 'Diagnosed Dyslexia', desc: '80% comorbidity with functional vision deficits' },
                                { key: 'hasTBI' as const, label: 'Traumatic Brain Injury / Concussion', desc: 'Frequently causes binocular vision and oculomotor disorders' },
                                { key: 'hasIEPReading' as const, label: 'Existing IEP for Reading Efficiency', desc: 'Documented reading struggles may have a vision component' },
                            ].map(item => (
                                <label key={item.key} className="flex items-start gap-3 cursor-pointer group p-3 rounded-lg hover:bg-gray-50 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={medicalHistory[item.key]}
                                        onChange={(e) => setMedicalHistory({ ...medicalHistory, [item.key]: e.target.checked })}
                                        className="mt-1 rounded text-blue-600 focus:ring-2 focus:ring-blue-500 h-5 w-5"
                                    />
                                    <div className="flex-1">
                                        <div className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                                            {item.label}
                                        </div>
                                        <div className="text-sm text-gray-500 mt-0.5">{item.desc}</div>
                                    </div>
                                </label>
                            ))}

                            <Textarea
                                label="Additional History Notes (Optional)"
                                placeholder="Any other relevant medical, developmental, or academic history..."
                                value={medicalHistory.notes}
                                onChange={(e) => setMedicalHistory({ ...medicalHistory, notes: e.target.value })}
                                rows={3}
                            />
                        </CardContent>
                    </Card>
                );

            // ─────────────── BYPASS RESULT ───────────────
            case 'BYPASS_RESULT':
                return (
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                </div>
                                <div>
                                    <CardTitle className="text-red-700">Fast Pass Triggered</CardTitle>
                                    <CardDescription>Immediate Functional Vision Evaluation recommended</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="bg-red-50 border border-red-200 rounded-lg p-5">
                                <h3 className="font-semibold text-red-800 mb-3">
                                    Based on this student&apos;s history, they qualify for an immediate referral:
                                </h3>
                                <ul className="space-y-3">
                                    {bypassInfo.reasons.map((reason, i) => (
                                        <li key={i} className="flex items-start gap-2">
                                            <span className="text-red-500 mt-0.5">●</span>
                                            <div>
                                                <div className="font-medium text-red-900">{reason}</div>
                                                <div className="text-sm text-red-700 mt-1">{bypassInfo.explanations[i]}</div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-5 border">
                                <h3 className="font-semibold text-gray-900 mb-2">Recommendation</h3>
                                <p className="text-gray-700">
                                    <strong>Path A — Comprehensive Functional Vision Evaluation</strong> with a
                                    Behavioral / Developmental Optometrist (FCOVD). This includes testing for binocularity,
                                    oculomotor function, and visual processing.
                                </p>
                            </div>

                            <div className="flex gap-3">
                                <Button onClick={handleNext} className="flex-1 bg-red-600 hover:bg-red-700">
                                    Generate Referral Now
                                </Button>
                                <Button variant="outline" onClick={handleContinueFromBypass} className="flex-1">
                                    Continue Assessment Anyway
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                );

            // ─────────────── ABC OBSERVATIONS ───────────────
            case 'ABC_OBSERVATIONS':
                return (
                    <Card>
                        <CardHeader>
                            <CardTitle>ABC Observational Checklist</CardTitle>
                            <CardDescription>
                                Teacher observations of Appearance, Behavior, and Complaints. Check all that apply — no medical equipment needed.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-8">
                            {/* A — Appearance */}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
                                    <span className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 text-sm font-bold">A</span>
                                    Appearance
                                </h3>
                                <p className="text-sm text-gray-500 mb-3 ml-10">Physical signs visible to the observer</p>
                                <div className="ml-10">
                                    <CheckboxGroup
                                        name="appearance"
                                        options={APPEARANCE_OPTIONS}
                                        value={observations.appearance}
                                        onChange={(value) => setObservations({ ...observations, appearance: value })}
                                    />
                                </div>
                            </div>

                            {/* B — Behavior */}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
                                    <span className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-700 text-sm font-bold">B</span>
                                    Behavior
                                </h3>
                                <p className="text-sm text-gray-500 mb-3 ml-10">Observable actions during reading and near work</p>
                                <div className="ml-10">
                                    <CheckboxGroup
                                        name="behavior"
                                        options={BEHAVIOR_OPTIONS}
                                        value={observations.behavior}
                                        onChange={(value) => setObservations({ ...observations, behavior: value })}
                                    />
                                </div>
                            </div>

                            {/* C — Complaints */}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
                                    <span className="w-8 h-8 bg-rose-100 rounded-full flex items-center justify-center text-rose-700 text-sm font-bold">C</span>
                                    Complaints
                                </h3>
                                <p className="text-sm text-gray-500 mb-3 ml-10">Symptoms the student has reported</p>
                                <div className="ml-10">
                                    <CheckboxGroup
                                        name="complaints"
                                        options={COMPLAINT_OPTIONS}
                                        value={observations.complaints}
                                        onChange={(value) => setObservations({ ...observations, complaints: value })}
                                    />
                                </div>
                            </div>

                            <Textarea
                                label="Additional Observation Notes (Optional)"
                                placeholder="Describe any other observations, specific examples, or context..."
                                value={observations.notes}
                                onChange={(e) => setObservations({ ...observations, notes: e.target.value })}
                                rows={3}
                            />
                        </CardContent>
                    </Card>
                );

            // ─────────────── DISTANCE VISION ───────────────
            case 'DISTANCE_VISION':
                return (
                    <Card>
                        <CardHeader>
                            <CardTitle>Distance Vision Screen</CardTitle>
                            <CardDescription>
                                This checks for basic refractive issues (needing glasses) vs. functional vision problems.
                                No Snellen chart or equipment required — just your classroom observation.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <p className="text-sm text-blue-800">
                                    💡 <strong>What to look for:</strong> Does the student squint at the board? Struggle to read projected text?
                                    Ask to sit closer to the front? Complain that the board is blurry?
                                </p>
                            </div>

                            <div className="space-y-3">
                                <p className="font-medium text-gray-900">
                                    Has this student been noted to have difficulty seeing the board, projected content, or other distance objects?
                                </p>
                                <div className="flex gap-4">
                                    <label className={`flex-1 cursor-pointer rounded-xl border-2 p-5 text-center transition-all ${distanceVisionBlurry ? 'border-blue-600 bg-blue-50 shadow-sm' : 'border-gray-200 hover:border-gray-300'}`}>
                                        <input
                                            type="radio"
                                            name="distanceVision"
                                            checked={distanceVisionBlurry}
                                            onChange={() => setDistanceVisionBlurry(true)}
                                            className="sr-only"
                                        />
                                        <div className="text-2xl mb-2">👁️</div>
                                        <div className={`font-semibold ${distanceVisionBlurry ? 'text-blue-700' : 'text-gray-700'}`}>Yes</div>
                                        <div className="text-sm text-gray-500 mt-1">Has difficulty with distance</div>
                                    </label>
                                    <label className={`flex-1 cursor-pointer rounded-xl border-2 p-5 text-center transition-all ${!distanceVisionBlurry ? 'border-blue-600 bg-blue-50 shadow-sm' : 'border-gray-200 hover:border-gray-300'}`}>
                                        <input
                                            type="radio"
                                            name="distanceVision"
                                            checked={!distanceVisionBlurry}
                                            onChange={() => setDistanceVisionBlurry(false)}
                                            className="sr-only"
                                        />
                                        <div className="text-2xl mb-2">✅</div>
                                        <div className={`font-semibold ${!distanceVisionBlurry ? 'text-blue-700' : 'text-gray-700'}`}>No</div>
                                        <div className="text-sm text-gray-500 mt-1">No distance issues noted</div>
                                    </label>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                );

            // ─────────────── SYMPTOM SURVEY ───────────────
            case 'SYMPTOM_SURVEY':
                if (!selectedSurvey) return null;
                const answeredCount = surveyResponses.filter(r => r >= 0).length;
                const totalQuestions = selectedSurvey.questions.length;

                return (
                    <Card>
                        <CardHeader>
                            <CardTitle>Symptom Survey: {selectedSurvey.name}</CardTitle>
                            <CardDescription>{selectedSurvey.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {/* Why this survey was selected */}
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                                <p className="text-sm text-blue-800">
                                    <strong>Why this survey?</strong>{' '}
                                    {selectedSurvey.type === 'BIVSS'
                                        ? 'This student has a history of brain injury/concussion, so we\'re using the specialized BIVSS assessment.'
                                        : selectedSurvey.type === 'CISS'
                                            ? 'This student has complaints of words moving or double vision, so we\'re using the CISS which targets convergence issues.'
                                            : 'This is the standard general functional vision screening for classroom populations.'}
                                </p>
                            </div>

                            <p className="text-sm text-gray-600 mb-4">{selectedSurvey.instructions}</p>

                            {/* Progress */}
                            <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                                <span>{answeredCount} of {totalQuestions} answered</span>
                                <span>{Math.round((answeredCount / totalQuestions) * 100)}% complete</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5 mb-6">
                                <div
                                    className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                                    style={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
                                />
                            </div>

                            {/* Questions */}
                            <div className="space-y-4">
                                {selectedSurvey.questions.map((q, idx) => {
                                    const prevCategory = idx > 0 ? selectedSurvey.questions[idx - 1].category : null;
                                    const showCategory = q.category && q.category !== prevCategory;

                                    return (
                                        <div key={q.id}>
                                            {showCategory && (
                                                <h4 className="font-semibold text-gray-800 mt-6 mb-3 text-sm uppercase tracking-wide border-b pb-2">
                                                    {q.category}
                                                </h4>
                                            )}
                                            <div className={`p-4 rounded-lg border transition-colors ${surveyResponses[idx] >= 0 ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`}>
                                                <p className="text-sm font-medium text-gray-900 mb-3">
                                                    <span className="text-gray-400 mr-2">{q.id}.</span>
                                                    {q.text}
                                                </p>
                                                <div className="flex gap-1 sm:gap-2">
                                                    {selectedSurvey.likertLabels.map((label, val) => (
                                                        <label
                                                            key={val}
                                                            className={`flex-1 cursor-pointer rounded-lg border px-1 sm:px-2 py-2 text-center transition-all text-xs sm:text-sm ${
                                                                surveyResponses[idx] === val
                                                                    ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                                                                    : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-gray-600'
                                                            }`}
                                                        >
                                                            <input
                                                                type="radio"
                                                                name={`q-${q.id}`}
                                                                value={val}
                                                                checked={surveyResponses[idx] === val}
                                                                onChange={() => {
                                                                    const newResponses = [...surveyResponses];
                                                                    newResponses[idx] = val;
                                                                    setSurveyResponses(newResponses);
                                                                }}
                                                                className="sr-only"
                                                            />
                                                            <div className="font-semibold">{val}</div>
                                                            <div className="hidden sm:block mt-0.5 leading-tight">{label}</div>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                );

            // ─────────────── RESULTS ───────────────
            case 'RESULTS':
                if (!triageResult || !selectedSurvey) return null;
                const score = scoreSurvey(surveyResponses.map(r => r === -1 ? 0 : r));
                const maxScore = getMaxScore(selectedSurvey.type);
                const interpretation = interpretScore(selectedSurvey.type, score);
                const pathColor = triageResult.path === 'PATH_A' ? 'red' : triageResult.path === 'PATH_B' ? 'blue' : 'green';
                const pathBgClass = triageResult.path === 'PATH_A' ? 'bg-red-50 border-red-200' : triageResult.path === 'PATH_B' ? 'bg-blue-50 border-blue-200' : 'bg-green-50 border-green-200';
                const pathTextClass = triageResult.path === 'PATH_A' ? 'text-red-700' : triageResult.path === 'PATH_B' ? 'text-blue-700' : 'text-green-700';

                return (
                    <Card>
                        <CardHeader>
                            <CardTitle>Triage Results</CardTitle>
                            <CardDescription>Algorithm analysis complete — here is the recommendation</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Score Display */}
                            <div className="text-center py-6">
                                <div className="text-6xl font-bold" style={{ color: interpretation.color === 'red' ? '#dc2626' : interpretation.color === 'yellow' ? '#d97706' : '#16a34a' }}>
                                    {score}
                                </div>
                                <div className="text-gray-500 mt-1">out of {maxScore} on the {selectedSurvey.name}</div>
                                <div className={`inline-block mt-3 px-4 py-1.5 rounded-full text-sm font-semibold ${
                                    interpretation.color === 'red' ? 'bg-red-100 text-red-700' :
                                        interpretation.color === 'yellow' ? 'bg-yellow-100 text-yellow-700' :
                                            'bg-green-100 text-green-700'
                                }`}>
                                    {interpretation.label}
                                </div>
                                <p className="text-sm text-gray-600 mt-3 max-w-md mx-auto">{interpretation.description}</p>
                            </div>

                            {/* Score Gauge */}
                            <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden">
                                <div className="absolute inset-0 flex">
                                    <div className="bg-green-400 h-full" style={{ width: `${(selectedSurvey.thresholds.low / maxScore) * 100}%` }} />
                                    <div className="bg-yellow-400 h-full" style={{ width: `${((selectedSurvey.thresholds.high - selectedSurvey.thresholds.low) / maxScore) * 100}%` }} />
                                    <div className="bg-red-400 h-full flex-1" />
                                </div>
                                <div
                                    className="absolute top-0 w-1 h-full bg-gray-900 rounded"
                                    style={{ left: `${Math.min((score / maxScore) * 100, 100)}%` }}
                                />
                            </div>
                            <div className="flex justify-between text-xs text-gray-500">
                                <span>0 (Low)</span>
                                <span>Threshold: {selectedSurvey.thresholds.high}</span>
                                <span>{maxScore} (Max)</span>
                            </div>

                            {/* Path Recommendation */}
                            <div className={`rounded-lg border p-5 ${pathBgClass}`}>
                                <h3 className={`font-bold text-lg ${pathTextClass}`}>
                                    {triageResult.path === 'PATH_A' && '🔴 Referral Path A: Functional Vision Evaluation'}
                                    {triageResult.path === 'PATH_B' && '🔵 Referral Path B: Routine Binocular Assessment'}
                                    {triageResult.path === 'MONITOR' && '🟢 Continue Monitoring'}
                                </h3>
                                <div className="mt-3 text-sm space-y-2">
                                    <p><strong>Provider:</strong> {triageResult.providerType}</p>
                                    <p><strong>Recommended Action:</strong> {triageResult.orderType}</p>
                                    <p><strong>Priority:</strong> <span className="uppercase font-semibold">{triageResult.priority}</span></p>
                                </div>
                            </div>

                            {/* Key Findings */}
                            <div>
                                <h4 className="font-semibold text-gray-900 mb-2">Key Findings</h4>
                                <ul className="space-y-1">
                                    {triageResult.flags.map((flag, i) => (
                                        <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0" />
                                            {flag}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Distance Vision Note */}
                            {distanceVisionBlurry && triageResult.path === 'PATH_B' && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <p className="text-sm text-blue-800">
                                        <strong>Note:</strong> Distance vision difficulty was the primary finding. If symptoms persist
                                        after glasses correction, rescreen in 6 weeks and consider upgrading to Path A.
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                );

            // ─────────────── REVIEW & SUBMIT ───────────────
            case 'REVIEW_SUBMIT':
                return (
                    <Card>
                        <CardHeader>
                            <CardTitle>Review & Submit Referral</CardTitle>
                            <CardDescription>
                                Review the clinical referral letter below, then submit to generate the referral case.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Referral Letter Preview */}
                            <div className="border rounded-lg overflow-hidden">
                                <div className="bg-gray-100 px-4 py-2 border-b flex items-center gap-2">
                                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <span className="text-sm font-medium text-gray-700">Clinical Referral Letter Preview</span>
                                </div>
                                <div
                                    className="p-6 bg-white max-h-[600px] overflow-y-auto"
                                    dangerouslySetInnerHTML={{ __html: referralLetterHtml }}
                                />
                            </div>

                            {/* Summary */}
                            {triageResult && (
                                <div className={`rounded-lg border p-4 ${
                                    triageResult.path === 'PATH_A' ? 'bg-red-50 border-red-200' :
                                        triageResult.path === 'PATH_B' ? 'bg-blue-50 border-blue-200' :
                                            'bg-green-50 border-green-200'
                                }`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                                            triageResult.path === 'PATH_A' ? 'bg-red-600' :
                                                triageResult.path === 'PATH_B' ? 'bg-blue-600' : 'bg-green-600'
                                        }`}>
                                            {triageResult.path === 'PATH_A' ? 'A' : triageResult.path === 'PATH_B' ? 'B' : 'M'}
                                        </div>
                                        <div>
                                            <div className="font-semibold text-gray-900">
                                                {triageResult.path === 'PATH_A' && 'Path A — Functional Vision Evaluation'}
                                                {triageResult.path === 'PATH_B' && 'Path B — Routine Binocular Assessment'}
                                                {triageResult.path === 'MONITOR' && 'Monitoring — Rescreen in 6 Weeks'}
                                            </div>
                                            <div className="text-sm text-gray-600">
                                                Priority: {triageResult.priority.toUpperCase()} | Provider: {triageResult.providerType}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                );

            default:
                return null;
        }
    };

    // ============================================
    // Main Render
    // ============================================

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
                            <div className="w-6 h-6 bg-gradient-to-br from-blue-600 to-purple-600 rounded flex items-center justify-center">
                                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                            </div>
                            <span className="text-sm font-semibold text-gray-700">Vision Triage</span>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Progress Bar */}
            {step !== 'BYPASS_RESULT' && (
                <div className="bg-white border-b border-gray-200">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">
                                Step {currentStepNum + 1} of {totalSteps}
                            </span>
                            <span className="text-sm text-gray-500">
                                {Math.round(((currentStepNum + 1) / totalSteps) * 100)}% complete
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${((currentStepNum + 1) / totalSteps) * 100}%` }}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {renderStep()}

                {/* Navigation Buttons — don't show for bypass result (it has its own buttons) */}
                {step !== 'BYPASS_RESULT' && (
                    <div className="flex gap-4 mt-8">
                        {step !== 'SELECT_STUDENT' && (
                            <Button variant="outline" onClick={handleBack} className="flex-1">
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                                Back
                            </Button>
                        )}
                        {step !== 'REVIEW_SUBMIT' ? (
                            <Button onClick={handleNext} disabled={!canProceed()} className="flex-1">
                                Next
                                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </Button>
                        ) : (
                            <Button
                                onClick={handleSubmit}
                                disabled={submitting}
                                loading={submitting}
                                className="flex-1"
                            >
                                Submit Triage Referral
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

// ============================================
// Page Export
// ============================================

export default function VisionTriagePage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        }>
            <TriageWizardContent />
        </Suspense>
    );
}
