// Vision Triage Protocol — Algorithm Engine
// Implements the Master Triage Algorithm from the Educational Vision Triage Protocol

import { TriageData, TriageResult, TriagePath, SurveyType } from '@/types';
import { interpretScore, getSurveyDefinition, getMaxScore } from './triage-surveys';

// ============================================
// Bypass (Fast Pass) Conditions
// ============================================

interface BypassCheck {
    condition: boolean;
    reason: string;
    clinicalNote: string;
}

const BYPASS_EXPLANATIONS: Record<string, string> = {
    ADHD: 'Children with ADHD/ADD have a 3x higher comorbidity rate with Convergence Insufficiency (Granet, 2005). A functional vision evaluation is strongly recommended.',
    Dyslexia: 'Dyslexia has an 80% comorbidity rate with functional vision deficits. Visual processing issues can compound reading difficulties.',
    TBI: 'Traumatic Brain Injury and concussion frequently cause binocular vision dysfunction, accommodative disorders, and oculomotor deficits requiring specialized evaluation.',
    IEP: 'An existing IEP for Reading Efficiency indicates documented academic struggles that may have a functional vision component requiring evaluation.',
};

/**
 * Check if medical history triggers a bypass (Fast Pass) to Path A
 */
export function checkBypass(medicalHistory: TriageData['medicalHistory']): {
    triggered: boolean;
    reasons: string[];
    explanations: string[];
} {
    const checks: BypassCheck[] = [
        {
            condition: medicalHistory.hasADHD,
            reason: 'Diagnosed ADHD/ADD',
            clinicalNote: BYPASS_EXPLANATIONS.ADHD,
        },
        {
            condition: medicalHistory.hasDyslexia,
            reason: 'Diagnosed Dyslexia',
            clinicalNote: BYPASS_EXPLANATIONS.Dyslexia,
        },
        {
            condition: medicalHistory.hasTBI,
            reason: 'Traumatic Brain Injury / Concussion',
            clinicalNote: BYPASS_EXPLANATIONS.TBI,
        },
        {
            condition: medicalHistory.hasIEPReading,
            reason: 'Existing IEP for Reading Efficiency',
            clinicalNote: BYPASS_EXPLANATIONS.IEP,
        },
    ];

    const triggered = checks.filter(c => c.condition);

    return {
        triggered: triggered.length > 0,
        reasons: triggered.map(c => c.reason),
        explanations: triggered.map(c => c.clinicalNote),
    };
}

// ============================================
// Main Triage Path Determination
// ============================================

/**
 * Determines the referral path based on all collected triage data.
 * Follows the Master Triage Algorithm flowchart.
 */
export function determinePath(triageData: TriageData): TriageResult {
    const flags: string[] = [];

    // 1. Check Bypass (Fast Pass) — already checked but verify
    if (triageData.bypassTriggered) {
        if (triageData.medicalHistory.hasADHD) flags.push('ADHD/ADD diagnosis (3x CI comorbidity)');
        if (triageData.medicalHistory.hasDyslexia) flags.push('Dyslexia diagnosis (80% vision comorbidity)');
        if (triageData.medicalHistory.hasTBI) flags.push('TBI/Concussion history');
        if (triageData.medicalHistory.hasIEPReading) flags.push('IEP for Reading Efficiency');

        return {
            path: 'PATH_A',
            reason: `Fast Pass triggered: ${flags.join('; ')}. These historical factors bypass symptom scoring and indicate immediate need for a Comprehensive Functional Vision Evaluation.`,
            priority: 'urgent',
            providerType: triageData.medicalHistory.hasTBI
                ? 'Neuro-Optometrist'
                : 'Behavioral / Developmental Optometrist (FCOVD)',
            orderType: 'Comprehensive Functional Vision Evaluation (Binocularity, Oculomotor, Processing)',
            flags,
        };
    }

    // 2. Collect observation flags
    const obsAppearance = triageData.observations.appearance;
    const obsBehavior = triageData.observations.behavior;
    const obsComplaints = triageData.observations.complaints;

    if (obsAppearance.length > 0) flags.push(`Appearance concerns: ${obsAppearance.length} items noted`);
    if (obsBehavior.length > 0) flags.push(`Behavioral signs: ${obsBehavior.length} items noted`);
    if (obsComplaints.length > 0) flags.push(`Student complaints: ${obsComplaints.length} items reported`);

    // Check for specific high-risk complaints that independently suggest Path A
    const hasDoubleVision = obsComplaints.includes('doubleVision');
    const hasWordsMoving = obsComplaints.includes('wordsSwimMove');
    if (hasDoubleVision) flags.push('Complaint: Double vision reported');
    if (hasWordsMoving) flags.push('Complaint: Words swimming/moving reported');

    // 3. Distance Vision Check → Path B if ONLY blurry distance
    if (triageData.distanceVisionBlurry) {
        flags.push('Distance vision difficulty noted');
    }

    // 4. Survey Score Evaluation
    const score = triageData.surveyScore;
    const surveyType = triageData.surveyType;
    const interpretation = interpretScore(surveyType, score);
    const survey = getSurveyDefinition(surveyType);
    const maxScore = getMaxScore(surveyType);

    flags.push(`${surveyType} Score: ${score}/${maxScore} (${interpretation.label})`);

    // Determine path based on survey scores
    if (interpretation.level === 'high') {
        // High score → Path A (Functional)
        return {
            path: 'PATH_A',
            reason: buildReason('PATH_A', surveyType, score, survey.thresholds.high, flags, triageData),
            priority: 'urgent',
            providerType: surveyType === 'BIVSS'
                ? 'Neuro-Optometrist'
                : 'Behavioral / Developmental Optometrist (FCOVD)',
            orderType: 'Comprehensive Functional Vision Evaluation (Binocularity, Oculomotor, Processing)',
            flags,
        };
    }

    // Double vision or skipping lines complaints can independently trigger Path A
    if (hasDoubleVision || hasWordsMoving) {
        return {
            path: 'PATH_A',
            reason: buildReason('PATH_A', surveyType, score, survey.thresholds.high, flags, triageData),
            priority: 'high',
            providerType: 'Behavioral / Developmental Optometrist (FCOVD)',
            orderType: 'Comprehensive Functional Vision Evaluation (Binocularity, Oculomotor, Processing)',
            flags,
        };
    }

    // Distance vision blurry + low survey scores → Path B
    if (triageData.distanceVisionBlurry && interpretation.level === 'low') {
        return {
            path: 'PATH_B',
            reason: buildReason('PATH_B', surveyType, score, survey.thresholds.low, flags, triageData),
            priority: 'medium',
            providerType: 'Primary Care Optometrist',
            orderType: 'Routine Eye Exam with Binocular Emphasis',
            flags,
        };
    }

    // Distance vision blurry + moderate scores → still could be Path A
    if (triageData.distanceVisionBlurry && interpretation.level === 'moderate') {
        return {
            path: 'PATH_A',
            reason: buildReason('PATH_A', surveyType, score, survey.thresholds.high, flags, triageData),
            priority: 'high',
            providerType: 'Behavioral / Developmental Optometrist (FCOVD)',
            orderType: 'Comprehensive Functional Vision Evaluation (Binocularity, Oculomotor, Processing)',
            flags,
        };
    }

    // Moderate score without distance issues → Path A with lower priority
    if (interpretation.level === 'moderate') {
        return {
            path: 'PATH_A',
            reason: buildReason('PATH_A', surveyType, score, survey.thresholds.high, flags, triageData),
            priority: 'medium',
            providerType: 'Behavioral / Developmental Optometrist (FCOVD)',
            orderType: 'Comprehensive Functional Vision Evaluation (Binocularity, Oculomotor, Processing)',
            flags,
        };
    }

    // Low score, no distance issues → Monitor
    return {
        path: 'MONITOR',
        reason: buildReason('MONITOR', surveyType, score, survey.thresholds.low, flags, triageData),
        priority: 'low',
        providerType: 'Continue classroom monitoring',
        orderType: 'Rescreen in 6 weeks. If symptoms persist, upgrade to Path A.',
        flags,
    };
}

function buildReason(
    path: TriagePath,
    surveyType: SurveyType,
    score: number,
    threshold: number,
    flags: string[],
    triageData: TriageData
): string {
    const parts: string[] = [];

    if (path === 'PATH_A') {
        parts.push('REFERRAL PATH A: Comprehensive Functional Vision Evaluation recommended.');
        parts.push(`The ${surveyType} symptom survey yielded a score of ${score}, which ${score > threshold ? `exceeds the clinical threshold of ${threshold}` : 'combined with observational findings, indicates functional vision concerns'}.`);
        if (triageData.distanceVisionBlurry) {
            parts.push('Distance vision difficulty was also noted, suggesting possible refractive error in addition to functional concerns.');
        }
    } else if (path === 'PATH_B') {
        parts.push('REFERRAL PATH B: Routine Binocular Assessment recommended.');
        parts.push(`Distance vision difficulty was noted, but the ${surveyType} score of ${score} falls within the low-risk range (below ${threshold}).`);
        parts.push('This pattern suggests a primarily refractive issue (needing glasses). Rescreen in 6 weeks — if symptoms persist, upgrade to Path A.');
    } else {
        parts.push('MONITORING RECOMMENDED: No immediate referral indicated at this time.');
        parts.push(`The ${surveyType} score of ${score} is within normal range (below ${threshold}), and no critical observational flags were noted.`);
        parts.push('Continue classroom monitoring and rescreen in 6 weeks.');
    }

    if (flags.length > 0) {
        parts.push(`\nKey findings: ${flags.join('; ')}.`);
    }

    return parts.join(' ');
}

// ============================================
// Clinical Referral Letter Generator
// ============================================

export function generateReferralLetter(
    triageData: TriageData,
    result: TriageResult,
    studentInfo: { firstName: string; lastName: string; grade?: string; dateOfBirth?: any },
    teacherInfo: { displayName: string; email: string },
    caseNumber: string
): string {
    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const survey = getSurveyDefinition(triageData.surveyType);
    const maxScore = getMaxScore(triageData.surveyType);

    const pathLabel = result.path === 'PATH_A'
        ? 'Path A — Comprehensive Functional Vision Evaluation'
        : result.path === 'PATH_B'
            ? 'Path B — Routine Binocular Assessment'
            : 'Monitoring — No Immediate Referral';

    const pathColor = result.path === 'PATH_A' ? '#dc2626' : result.path === 'PATH_B' ? '#2563eb' : '#16a34a';

    // ABC observation labels
    const appearanceLabels: Record<string, string> = {
        redWateryEyes: 'Red/watery eyes',
        droopingLids: 'Drooping lids (ptosis)',
        mismatchedPupils: 'Mismatched pupil sizes',
        eyeTurning: 'One eye turning in/out',
    };
    const behaviorLabels: Record<string, string> = {
        skipsLines: 'Skips lines/words',
        usesFingerToTrack: 'Uses finger to track',
        extremeHeadTilt: 'Extreme head tilt',
        coversOneEye: 'Covers one eye to read',
        writesUpDownhill: 'Writes "uphill/downhill"',
        clumsy: 'Clumsy',
    };
    const complaintLabels: Record<string, string> = {
        wordsSwimMove: 'Words swim/move on page',
        doubleVision: 'Double vision (diplopia)',
        headachesAfterReading: 'Headaches after reading',
        nauseaDizziness: 'Nausea/dizziness after near work',
        lightSensitivity: 'Light sensitivity',
    };

    const formatChecked = (items: string[], labels: Record<string, string>) =>
        items.length > 0
            ? items.map(i => labels[i] || i).join(', ')
            : 'None noted';

    return `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; color: #1f2937;">
    <!-- Header -->
    <div style="border-bottom: 3px solid ${pathColor}; padding-bottom: 20px; margin-bottom: 30px;">
        <h1 style="margin: 0; font-size: 24px; color: #111827;">Educational Vision Triage — Clinical Referral Report</h1>
        <p style="margin: 8px 0 0 0; color: #6b7280; font-size: 14px;">Case #${caseNumber} | Generated ${today}</p>
    </div>

    <!-- Recommendation Banner -->
    <div style="background: ${pathColor}10; border-left: 4px solid ${pathColor}; padding: 20px; margin-bottom: 30px; border-radius: 4px;">
        <h2 style="margin: 0 0 8px 0; color: ${pathColor}; font-size: 18px;">${pathLabel}</h2>
        <p style="margin: 0; font-size: 14px;"><strong>Recommended Provider:</strong> ${result.providerType}</p>
        <p style="margin: 4px 0 0 0; font-size: 14px;"><strong>Recommended Evaluation:</strong> ${result.orderType}</p>
        <p style="margin: 4px 0 0 0; font-size: 14px;"><strong>Priority:</strong> ${result.priority.toUpperCase()}</p>
    </div>

    <!-- Patient Information -->
    <div style="margin-bottom: 24px;">
        <h3 style="color: #374151; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px;">Patient Information</h3>
        <table style="width: 100%; font-size: 14px;">
            <tr><td style="padding: 4px 0; color: #6b7280; width: 180px;">Student Name:</td><td style="font-weight: 600;">${studentInfo.firstName} ${studentInfo.lastName}</td></tr>
            <tr><td style="padding: 4px 0; color: #6b7280;">Grade:</td><td>${studentInfo.grade || 'Not specified'}</td></tr>
            <tr><td style="padding: 4px 0; color: #6b7280;">Referring Teacher:</td><td>${teacherInfo.displayName}</td></tr>
            <tr><td style="padding: 4px 0; color: #6b7280;">Date of Triage:</td><td>${today}</td></tr>
        </table>
    </div>

    <!-- Algorithm Reasoning -->
    <div style="margin-bottom: 24px;">
        <h3 style="color: #374151; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px;">Algorithm Reasoning</h3>
        <p style="font-size: 14px; line-height: 1.6;">${result.reason}</p>
    </div>

    <!-- Medical History -->
    <div style="margin-bottom: 24px;">
        <h3 style="color: #374151; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px;">1. Medical History ${triageData.bypassTriggered ? '<span style="color: #dc2626; font-size: 12px; font-weight: 600;">[FAST PASS TRIGGERED]</span>' : ''}</h3>
        <table style="width: 100%; font-size: 14px;">
            <tr><td style="padding: 4px 0; color: #6b7280; width: 250px;">ADHD/ADD:</td><td>${triageData.medicalHistory.hasADHD ? '✅ Yes' : '❌ No'}</td></tr>
            <tr><td style="padding: 4px 0; color: #6b7280;">Dyslexia:</td><td>${triageData.medicalHistory.hasDyslexia ? '✅ Yes' : '❌ No'}</td></tr>
            <tr><td style="padding: 4px 0; color: #6b7280;">TBI / Concussion:</td><td>${triageData.medicalHistory.hasTBI ? '✅ Yes' : '❌ No'}</td></tr>
            <tr><td style="padding: 4px 0; color: #6b7280;">IEP for Reading Efficiency:</td><td>${triageData.medicalHistory.hasIEPReading ? '✅ Yes' : '❌ No'}</td></tr>
        </table>
        ${triageData.medicalHistory.notes ? `<p style="font-size: 13px; color: #6b7280; margin-top: 8px;"><em>Notes: ${triageData.medicalHistory.notes}</em></p>` : ''}
    </div>

    ${!triageData.bypassTriggered ? `
    <!-- ABC Observations -->
    <div style="margin-bottom: 24px;">
        <h3 style="color: #374151; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px;">2. ABC Observational Checklist</h3>
        <table style="width: 100%; font-size: 14px;">
            <tr><td style="padding: 6px 0; color: #6b7280; width: 140px; vertical-align: top;"><strong>A — Appearance:</strong></td><td>${formatChecked(triageData.observations.appearance, appearanceLabels)}</td></tr>
            <tr><td style="padding: 6px 0; color: #6b7280; vertical-align: top;"><strong>B — Behavior:</strong></td><td>${formatChecked(triageData.observations.behavior, behaviorLabels)}</td></tr>
            <tr><td style="padding: 6px 0; color: #6b7280; vertical-align: top;"><strong>C — Complaints:</strong></td><td>${formatChecked(triageData.observations.complaints, complaintLabels)}</td></tr>
        </table>
        ${triageData.observations.notes ? `<p style="font-size: 13px; color: #6b7280; margin-top: 8px;"><em>Notes: ${triageData.observations.notes}</em></p>` : ''}
    </div>

    <!-- Distance Vision -->
    <div style="margin-bottom: 24px;">
        <h3 style="color: #374151; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px;">3. Distance Vision Screen</h3>
        <p style="font-size: 14px;">Difficulty seeing board/distance: <strong>${triageData.distanceVisionBlurry ? 'Yes' : 'No'}</strong></p>
    </div>

    <!-- Symptom Survey -->
    <div style="margin-bottom: 24px;">
        <h3 style="color: #374151; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px;">4. Symptom Survey: ${survey.name}</h3>
        <p style="font-size: 13px; color: #6b7280; margin-bottom: 12px;">${survey.fullName} — ${survey.reference}</p>
        <div style="background: #f9fafb; padding: 16px; border-radius: 8px; text-align: center;">
            <div style="font-size: 36px; font-weight: 700; color: ${pathColor};">${triageData.surveyScore}</div>
            <div style="font-size: 14px; color: #6b7280;">out of ${maxScore} possible</div>
            <div style="margin-top: 8px; font-size: 13px;">
                Threshold for referral: <strong>${survey.thresholds.high}</strong>
            </div>
        </div>
    </div>
    ` : ''}

    <!-- Key Findings -->
    <div style="margin-bottom: 24px;">
        <h3 style="color: #374151; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px;">Key Findings</h3>
        <ul style="font-size: 14px; padding-left: 20px;">
            ${result.flags.map(f => `<li style="margin-bottom: 6px;">${f}</li>`).join('')}
        </ul>
    </div>

    <!-- Footer -->
    <div style="border-top: 2px solid #e5e7eb; padding-top: 20px; margin-top: 30px; font-size: 12px; color: #9ca3af;">
        <p>This report was generated using the Educational Vision Triage Protocol — a diagnostic bridge algorithm for identifying functional vision deficits in the classroom (no equipment required).</p>
        <p>Protocol references: Maples et al. (2006), Borsting/CITT Group (2003), Laukkanen, Granet (2005), Scheiman & Wick (2008).</p>
        <p style="font-style: italic;">⚠️ Standard 20-minute eye exams often overlook functional vision deficits. A comprehensive functional vision evaluation includes binocularity, oculomotor, and visual processing testing.</p>
    </div>
</div>`;
}
