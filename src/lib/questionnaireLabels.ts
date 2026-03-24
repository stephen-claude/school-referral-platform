// Questionnaire response label mappings

export const QUESTIONNAIRE_LABELS = {
    readingPerformance: {
        losesPlace: 'Loses place frequently when reading',
        avoids: 'Avoids reading tasks or complains about reading',
        slowReader: 'Slower reading pace compared to peers',
        skipWords: 'Skips words or lines when reading',
        poorComprehension: 'Poor reading comprehension',
        rereads: 'Frequently has to re-read text',
    },
    attentionBehavior: {
        fatigue: 'Shows signs of fatigue during visual tasks',
        distracted: 'Easily distracted or loses focus',
        shortAttention: 'Short attention span for near work',
        fidgety: 'Fidgety or restless during desk work',
        daydreams: 'Daydreams or "zones out" frequently',
    },
    visualSymptoms: {
        closesEye: 'Closes or covers one eye',
        squints: 'Squints or frowns when focusing',
        headaches: 'Frequent headaches, especially after reading',
        eyeRubbing: 'Rubs eyes frequently',
        blurred: 'Complaints of blurred or double vision',
        watery: 'Watery or red eyes',
    },
    writingHandwriting: {
        poorSpacing: 'Poor spacing between words or letters',
        irregular: 'Irregular letter sizes',
        slowWriter: 'Slow writing pace',
        poorCopying: 'Difficulty copying from board',
        sloppyWork: 'Sloppy or messy work',
        avoidWriting: 'Avoids writing tasks',
    },
    motorSkills: {
        clumsy: 'Clumsy or bumps into things',
        poorSports: 'Difficulty with ball sports',
        balance: 'Poor balance or coordination',
        fineMotor: 'Struggles with fine motor tasks (cutting, tying)',
        messyEating: 'Messy eating habits',
    },
    classroomObservations: {
        declines: 'Performance declines over the course of the day',
        morningBetter: 'Better performance in morning vs. afternoon',
        movementBreaks: 'Needs frequent movement breaks',
        sitsClose: 'Sits too close to board or holds book too close',
        tiltsHead: 'Tilts head or body when reading/writing',
    },
};

export function getQuestionnaireLabel(category: keyof typeof QUESTIONNAIRE_LABELS, key: string): string {
    const labels = QUESTIONNAIRE_LABELS[category];
    if (!labels) return key;

    // @ts-ignore - dynamic key access
    return labels[key] || key;
}
