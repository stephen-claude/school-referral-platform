'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';

interface RiskScore {
    overall: number;
    category: 'low' | 'medium' | 'high' | 'urgent';
    flags: string[];
    recommendation: string;
    confidence: number;
}

interface RiskScoringDisplayProps {
    score?: RiskScore;
}

export function RiskScoringDisplay({ score }: RiskScoringDisplayProps) {
    if (!score) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Risk Assessment</CardTitle>
                    <CardDescription>Algorithm-based risk scoring</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-gray-500">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <p>Risk assessment not yet generated</p>
                        <p className="text-sm mt-1">Algorithm will run upon referral submission</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    const categoryColors = {
        low: {
            bg: 'bg-green-50',
            border: 'border-green-200',
            text: 'text-green-800',
            badge: 'bg-green-100',
        },
        medium: {
            bg: 'bg-yellow-50',
            border: 'border-yellow-200',
            text: 'text-yellow-800',
            badge: 'bg-yellow-100',
        },
        high: {
            bg: 'bg-orange-50',
            border: 'border-orange-200',
            text: 'text-orange-800',
            badge: 'bg-orange-100',
        },
        urgent: {
            bg: 'bg-red-50',
            border: 'border-red-200',
            text: 'text-red-800',
            badge: 'bg-red-100',
        },
    };

    const colors = categoryColors[score.category];

    return (
        <Card className={`${colors.bg} border-2 ${colors.border}`}>
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div>
                        <CardTitle>Risk Assessment</CardTitle>
                        <CardDescription>Algorithm-generated analysis</CardDescription>
                    </div>
                    <span className={`px-3 py-1.5 text-sm font-bold ${colors.badge} ${colors.text} rounded-full uppercase`}>
                        {score.category}
                    </span>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Risk Score Gauge */}
                <div>
                    <div className="flex items-end justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Overall Risk Score</span>
                        <span className={`text-3xl font-bold ${colors.text}`}>{score.overall}/100</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4">
                        <div
                            className={`h-4 rounded-full transition-all ${score.category === 'low' ? 'bg-green-500' :
                                    score.category === 'medium' ? 'bg-yellow-500' :
                                        score.category === 'high' ? 'bg-orange-500' :
                                            'bg-red-500'
                                }`}
                            style={{ width: `${score.overall}%` }}
                        />
                    </div>
                </div>

                {/* Risk Flags */}
                {score.flags.length > 0 && (
                    <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Risk Flags Detected</h4>
                        <div className="space-y-2">
                            {score.flags.map((flag, idx) => (
                                <div key={idx} className="flex items-start gap-2">
                                    <div className={`w-2 h-2 ${colors.bg} ${colors.border} border-2 rounded-full mt-1.5`} />
                                    <span className="text-sm text-gray-700">{flag}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Recommendation */}
                <div className={`p-4 ${colors.bg} border ${colors.border} rounded-lg`}>
                    <h4 className={`text-sm font-semibold ${colors.text} mb-2`}>Recommendation</h4>
                    <p className="text-sm text-gray-700">{score.recommendation}</p>
                </div>

                {/* Confidence */}
                <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Algorithm Confidence:</span>
                    <span className="font-semibold text-gray-900">{score.confidence}%</span>
                </div>
            </CardContent>
        </Card>
    );
}

// Demo/mock function for generating risk scores
export function generateMockRiskScore(questionnaireData: any): RiskScore {
    // Simple mock algorithm - in production, this would be more sophisticated
    let score = 30; // Base score
    const flags: string[] = [];

    // Reading performance
    if (questionnaireData?.readingPerformance?.struggles?.length > 3) {
        score += 20;
        flags.push('Multiple reading difficulties reported');
    }

    // Visual symptoms
    if (questionnaireData?.visualSymptoms?.symptoms?.length > 2) {
        score += 25;
        flags.push('Significant visual symptoms present');
    }

    // Determine category
    let category: 'low' | 'medium' | 'high' | 'urgent';
    if (score < 40) category = 'low';
    else if (score < 65) category = 'medium';
    else if (score < 85) category = 'high';
    else category = 'urgent';

    // Generate recommendation
    const recommendations = {
        low: 'Monitor student progress. Implement basic classroom accommodations.',
        medium: 'Recommend vision screening. Consider functional vision assessment.',
        high: 'Strongly recommend comprehensive vision examination. Priority scheduling advised.',
        urgent: 'Immediate functional binocular vision examination required. Contact parent/guardian urgently.',
    };

    return {
        overall: score,
        category,
        flags,
        recommendation: recommendations[category],
        confidence: 78 + Math.floor(Math.random() * 15), // 78-93%
    };
}
