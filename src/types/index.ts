// User roles and permissions types

export type UserRole = 'clinic_admin' | 'school_admin' | 'teacher';

export interface CustomClaims {
    role: UserRole;
    schoolId?: string; // Required for school_admin and teacher
}

export interface UserProfile {
    uid: string;
    email: string;
    displayName: string;
    role: UserRole;
    schoolId?: string;
    createdAt: Date;
    updatedAt?: Date;
}

export interface School {
    id: string;
    name: string;
    address?: string;
    contactPhone?: string;
    contactEmail?: string;
    adminIds: string[]; // Array of school admin user IDs
    createdAt: Date;
    updatedAt?: Date;
}

export interface Teacher {
    id: string;
    userId: string; // Links to users collection
    schoolId: string;
    firstName: string;
    lastName: string;
    email: string;
    grade?: string;
    subject?: string;
    phoneNumber?: string;
    createdAt: Date;
    updatedAt?: Date;
}

export interface Student {
    id: string;
    schoolId: string;
    teacherId: string; // Primary teacher who created the student
    firstName: string;
    lastName: string;
    dateOfBirth?: Date;
    grade?: string;
    parentName?: string;
    parentEmail?: string;
    parentPhone?: string;
    consentFlags: {
        shareSensitiveInfo: boolean;
        allowPhotos: boolean;
        allowContactParent: boolean;
    };
    createdAt: Date;
    updatedAt?: Date;
}

export interface Referral {
    id: string;
    caseNumber: string; // Human-readable unique ID
    schoolId: string;
    teacherId: string;
    studentId: string;

    status: 'new' | 'in_review' | 'waiting_info' | 'waiting_consent' | 'urgent' | 'closed';
    priority: 'low' | 'medium' | 'high' | 'urgent';

    questionnaireId: string; // Links to questionnaires collection
    triageResultId?: string; // Links to triageResults collection

    outcome?: {
        decision: 'full_exam' | 'visual_therapy' | 'refer_to_ot' | 'refer_to_psych' |
        'refer_to_speech' | 'refer_to_other' | 'monitor_only' | 'urgent_escalation';
        reasoning: string;
        nextSteps: string;
        decidedBy: string; // Clinic admin UID
        decidedAt: Date;
    };

    emailThreadId?: string;
    attachments: string[]; // Array of Cloud Storage paths

    createdAt: Date;
    createdBy: string; // Teacher UID
    updatedAt?: Date;
    closedAt?: Date;
}

export interface Questionnaire {
    id: string;
    referralId: string;

    // Reading performance
    readingPerformance: {
        losesPlace: boolean;
        slowReading: boolean;
        poorComprehension: boolean;
        skipsWords: boolean;
        reReadsLines: boolean;
        avoidsReading: boolean;
        otherNotes?: string;
    };

    // Attention & behavior
    attentionBehavior: {
        distractedDuringReading: boolean;
        fidgetsWhileReading: boolean;
        difficultyFocusing: boolean;
        showsFatigue: boolean;
        performanceDeclines: boolean;
        otherNotes?: string;
    };

    // Visual symptoms
    visualSymptoms: {
        headaches: boolean;
        eyeStrain: boolean;
        doubleVision: boolean;
        closesOneEye: boolean;
        rubsEyes: boolean;
        squints: boolean;
        otherNotes?: string;
    };

    // Motor & posture
    motorPosture: {
        poorPosture: boolean;
        tiltsHead: boolean;
        movesClose: boolean;
        handwritingIssues: boolean;
        clumsiness: boolean;
        otherNotes?: string;
    };

    // Classroom observations
    classroomObservations: string;

    // Past interventions
    pastInterventions: {
        ot: boolean;
        tutoring: boolean;
        psychology: boolean;
        speech: boolean;
        other: boolean;
        otherDetails?: string;
    };

    // Teacher summary
    teacherSummary: string;

    createdAt: Date;
}
