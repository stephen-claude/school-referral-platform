// Vision Triage Protocol — Validated Symptom Surveys
// COVD-QOL, CISS (Convergence Insufficiency), BIVSS (Brain Injury)

import { SurveyType } from '@/types';

export interface SurveyQuestion {
    id: number;
    text: string;
    category?: string;
}

export interface SurveyDefinition {
    type: SurveyType;
    name: string;
    fullName: string;
    description: string;
    targetPopulation: string;
    instructions: string;
    questions: SurveyQuestion[];
    likertLabels: string[];
    thresholds: { low: number; moderate: number; high: number };
    reference: string;
}

// Likert scale used across all surveys
const LIKERT_LABELS = ['Never', 'Infrequently', 'Sometimes', 'Fairly Often', 'Always'];

// ============================================
// COVD-QOL — College of Optometrists in Vision Development
// Quality of Life Questionnaire (19-item version)
// Reference: Maples et al. (2006)
// ============================================
export const COVD_QOL: SurveyDefinition = {
    type: 'COVD-QOL',
    name: 'COVD-QOL',
    fullName: 'College of Optometrists in Vision Development Quality of Life Questionnaire',
    description: 'General functional vision screening for classroom populations',
    targetPopulation: 'General classroom students',
    instructions: 'Please rate how often the student experiences the following when reading or doing close work.',
    questions: [
        { id: 1, text: 'Do your eyes feel tired when reading or doing close work?' },
        { id: 2, text: 'Do your eyes feel uncomfortable when reading or doing close work?' },
        { id: 3, text: 'Do you have headaches when reading or doing close work?' },
        { id: 4, text: 'Do you feel sleepy when reading or doing close work?' },
        { id: 5, text: 'Do you lose concentration when reading or doing close work?' },
        { id: 6, text: 'Do you have trouble remembering what you have read?' },
        { id: 7, text: 'Do you have double vision when reading or doing close work?' },
        { id: 8, text: 'Do you see the words move, jump, swim, or appear to float on the page?' },
        { id: 9, text: 'Do you feel like you read slowly?' },
        { id: 10, text: 'Do your eyes ever hurt when reading or doing close work?' },
        { id: 11, text: 'Do your eyes ever feel sore when reading or doing close work?' },
        { id: 12, text: 'Do you feel a "pulling" feeling around your eyes when reading?' },
        { id: 13, text: 'Do you notice the words blurring or coming in and out of focus when reading?' },
        { id: 14, text: 'Do you lose your place while reading or doing close work?' },
        { id: 15, text: 'Do you have to re-read the same line of words when reading?' },
        { id: 16, text: 'Do you have difficulty copying from the board to paper?' },
        { id: 17, text: 'Do you tend to skip or omit small words when reading?' },
        { id: 18, text: 'Do you use your finger or a marker to keep your place when reading?' },
        { id: 19, text: 'Do you have difficulty completing assignments on time?' },
    ],
    likertLabels: LIKERT_LABELS,
    thresholds: {
        low: 15,      // 0-15: Monitor / Routine Exam (green)
        moderate: 20,  // 16-20: Suspect Functional Issue (yellow)
        high: 20,      // >20: Probable Functional Issue → Path A (red)
    },
    reference: 'Maples et al. (2006): COVD-QOL Validity & Scoring',
};

// ============================================
// CISS — Convergence Insufficiency Symptom Survey
// (15-item revised version)
// Reference: Borsting / CITT Group (2003)
// ============================================
export const CISS: SurveyDefinition = {
    type: 'CISS',
    name: 'CISS',
    fullName: 'Convergence Insufficiency Symptom Survey',
    description: 'Specific to reading fatigue, words moving, and eye-teaming failure',
    targetPopulation: 'Students complaining of words moving or double vision',
    instructions: 'Please answer the following questions about how your eyes feel when reading or doing close work. Rate each on a scale of Never to Always.',
    questions: [
        { id: 1, text: 'Do your eyes feel tired when reading or doing close work?' },
        { id: 2, text: 'Do your eyes feel uncomfortable when reading or doing close work?' },
        { id: 3, text: 'Do you have headaches when reading or doing close work?' },
        { id: 4, text: 'Do you feel sleepy when reading or doing close work?' },
        { id: 5, text: 'Do you lose concentration when reading or doing close work?' },
        { id: 6, text: 'Do you have trouble remembering what you have read?' },
        { id: 7, text: 'Do you have double vision when reading or doing close work?' },
        { id: 8, text: 'Do you see the words move, jump, swim, or appear to float on the page when reading or doing close work?' },
        { id: 9, text: 'Do you feel like you read slowly?' },
        { id: 10, text: 'Do your eyes ever hurt when reading or doing close work?' },
        { id: 11, text: 'Do your eyes ever feel sore when reading or doing close work?' },
        { id: 12, text: 'Do you feel a "pulling" feeling around your eyes when reading or doing close work?' },
        { id: 13, text: 'Do you notice the words blurring or coming in and out of focus when reading or doing close work?' },
        { id: 14, text: 'Do you lose your place while reading or doing close work?' },
        { id: 15, text: 'Do you have to re-read the same line of words when reading?' },
    ],
    likertLabels: LIKERT_LABELS,
    thresholds: {
        low: 10,       // 0-10: Normal range
        moderate: 15,  // 11-15: Borderline
        high: 16,      // ≥16: Suggestive of Convergence Insufficiency → Path A
    },
    reference: 'Borsting EJ, Rouse MW, Mitchell GL, et al. and the CITT Group (2003)',
};

// ============================================
// BIVSS — Brain Injury Vision Symptom Survey
// (28-item version)
// Reference: Laukkanen
// ============================================
export const BIVSS: SurveyDefinition = {
    type: 'BIVSS',
    name: 'BIVSS',
    fullName: 'Brain Injury Vision Symptom Survey',
    description: 'Specialized tool for students with history of concussion or head trauma',
    targetPopulation: 'Students with history of head injury, falls, or concussion',
    instructions: 'Please rate how often each behavior occurs. Circle the number that best matches your observations.',
    questions: [
        // Eyesight Clarity
        { id: 1, text: 'Distance vision blurred and not clear — even with lenses', category: 'Eyesight Clarity' },
        { id: 2, text: 'Near vision blurred and not clear — even with lenses', category: 'Eyesight Clarity' },
        { id: 3, text: 'Clarity of vision changes or fluctuates during the day', category: 'Eyesight Clarity' },
        { id: 4, text: 'Poor night vision / difficulty seeing well at night', category: 'Eyesight Clarity' },
        // Visual Comfort
        { id: 5, text: 'Eye discomfort / sore eyes / eyestrain', category: 'Visual Comfort' },
        { id: 6, text: 'Headaches or dizziness after using eyes', category: 'Visual Comfort' },
        { id: 7, text: 'Eye fatigue / very tired after using eyes all day', category: 'Visual Comfort' },
        { id: 8, text: 'Feel "pulling" around the eyes', category: 'Visual Comfort' },
        // Doubling
        { id: 9, text: 'Double vision — especially when tired', category: 'Doubling' },
        { id: 10, text: 'Have to close or cover one eye to see clearly', category: 'Doubling' },
        { id: 11, text: 'Print moves in and out of focus when reading', category: 'Doubling' },
        // Light Sensitivity
        { id: 12, text: 'Natural indoor lighting is uncomfortable — too much glare', category: 'Light Sensitivity' },
        { id: 13, text: 'Outdoor light too bright — have to use sunglasses', category: 'Light Sensitivity' },
        { id: 14, text: 'Indoor fluorescent lighting is bothersome or annoying', category: 'Light Sensitivity' },
        // Dry Eyes
        { id: 15, text: 'Eyes feel "dry" and sting', category: 'Dry Eyes' },
        { id: 16, text: '"Stare" into space without blinking', category: 'Dry Eyes' },
        { id: 17, text: 'Have to rub the eyes a lot', category: 'Dry Eyes' },
        // Depth Perception
        { id: 18, text: 'Clumsiness / misjudge where objects really are', category: 'Depth Perception' },
        { id: 19, text: 'Lack of confidence walking / missing steps / stumbling', category: 'Depth Perception' },
        { id: 20, text: 'Poor handwriting (spacing, size, legibility)', category: 'Depth Perception' },
        // Peripheral Vision
        { id: 21, text: 'Side vision distorted / objects move or change position', category: 'Peripheral Vision' },
        { id: 22, text: 'What looks straight ahead isn\'t always straight ahead', category: 'Peripheral Vision' },
        { id: 23, text: 'Avoid crowds / can\'t tolerate "visually-busy" places', category: 'Peripheral Vision' },
        // Reading
        { id: 24, text: 'Short attention span / easily distracted when reading', category: 'Reading' },
        { id: 25, text: 'Difficulty / slowness with reading and writing', category: 'Reading' },
        { id: 26, text: 'Poor reading comprehension / can\'t remember what was read', category: 'Reading' },
        { id: 27, text: 'Confusion of words / skip words during reading', category: 'Reading' },
        { id: 28, text: 'Lose place / have to use finger not to lose place when reading', category: 'Reading' },
    ],
    likertLabels: LIKERT_LABELS,
    thresholds: {
        low: 20,       // 0-20: Below threshold
        moderate: 30,  // 21-30: Moderate concern
        high: 31,      // ≥31: High probability of visual processing deficits related to TBI → Path A
    },
    reference: 'Laukkanen: BIVSS Scoring for TBI',
};

// ============================================
// Smart Survey Routing
// ============================================

/**
 * Determines which survey to administer based on history and observations.
 * Priority: BIVSS (TBI) > CISS (convergence complaints) > COVD-QOL (default)
 */
export function getSurveyForStudent(
    medicalHistory: { hasTBI: boolean },
    complaints: string[]
): SurveyDefinition {
    // Priority 1: TBI/Concussion history → BIVSS
    if (medicalHistory.hasTBI) {
        return BIVSS;
    }

    // Priority 2: Convergence-specific complaints → CISS
    const convergenceComplaints = ['wordsSwimMove', 'doubleVision'];
    const hasConvergenceComplaint = complaints.some(c => convergenceComplaints.includes(c));
    if (hasConvergenceComplaint) {
        return CISS;
    }

    // Default: General functional vision → COVD-QOL
    return COVD_QOL;
}

/**
 * Calculate total score from Likert responses
 */
export function scoreSurvey(responses: number[]): number {
    return responses.reduce((sum, val) => sum + val, 0);
}

/**
 * Interpret a survey score and return risk level + color
 */
export function interpretScore(
    surveyType: SurveyType,
    score: number
): { level: 'low' | 'moderate' | 'high'; color: string; label: string; description: string } {
    const survey = getSurveyDefinition(surveyType);

    if (score > survey.thresholds.high || (surveyType === 'CISS' && score >= survey.thresholds.high) || (surveyType === 'BIVSS' && score >= survey.thresholds.high)) {
        return {
            level: 'high',
            color: 'red',
            label: 'High Risk',
            description: surveyType === 'COVD-QOL'
                ? 'Probable functional vision issue — Immediate referral recommended'
                : surveyType === 'CISS'
                    ? 'Suggestive of Convergence Insufficiency — Functional evaluation recommended'
                    : 'High probability of visual processing deficits related to TBI — Neuro-Optometrist referral recommended',
        };
    }

    if (score > survey.thresholds.low) {
        return {
            level: 'moderate',
            color: 'yellow',
            label: 'Moderate Risk',
            description: 'Suspect functional issue — Further monitoring or evaluation recommended',
        };
    }

    return {
        level: 'low',
        color: 'green',
        label: 'Low Risk',
        description: 'Within normal range — Continue monitoring, routine exam recommended',
    };
}

/**
 * Get survey definition by type
 */
export function getSurveyDefinition(type: SurveyType): SurveyDefinition {
    switch (type) {
        case 'COVD-QOL': return COVD_QOL;
        case 'CISS': return CISS;
        case 'BIVSS': return BIVSS;
    }
}

/**
 * Get the maximum possible score for a survey
 */
export function getMaxScore(type: SurveyType): number {
    const survey = getSurveyDefinition(type);
    return survey.questions.length * 4; // Max Likert value is 4
}
