// Vision Triage Protocol — Path-Specific Email Templates

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

const emailStyles = `
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      margin: 0;
      padding: 0;
      background-color: #f3f4f6;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .header {
      padding: 40px 30px;
      text-align: center;
    }
    .header h1 {
      color: #ffffff;
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .header p {
      color: rgba(255,255,255,0.85);
      margin: 8px 0 0 0;
      font-size: 14px;
    }
    .content {
      padding: 40px 30px;
    }
    .info-box {
      background: #f9fafb;
      border-left: 4px solid #2563eb;
      padding: 20px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .info-box strong {
      color: #111827;
      display: block;
      margin-bottom: 4px;
    }
    .badge {
      display: inline-block;
      padding: 6px 16px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      margin: 10px 0;
    }
    .button {
      display: inline-block;
      padding: 14px 28px;
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      margin: 20px 0;
      text-align: center;
    }
    .footer {
      padding: 30px;
      text-align: center;
      background: #f9fafb;
      border-top: 1px solid #e5e7eb;
    }
    .footer p {
      color: #6b7280;
      font-size: 13px;
      margin: 5px 0;
    }
    .divider {
      height: 1px;
      background: #e5e7eb;
      margin: 30px 0;
    }
    h2 {
      color: #111827;
      font-size: 20px;
      margin: 0 0 16px 0;
    }
    p {
      color: #4b5563;
      margin: 0 0 16px 0;
    }
    ul {
      margin: 0 0 16px 0;
      padding-left: 20px;
    }
    li {
      color: #4b5563;
      margin-bottom: 8px;
    }
  </style>
`;

interface TriageEmailData {
    teacherEmail: string;
    teacherName: string;
    studentName: string;
    caseNumber: string;
    triagePath: string;
    providerType: string;
    orderType: string;
    surveyType: string;
    surveyScore: number;
    flags: string[];
}

// ============================================
// Path A — Functional Vision Evaluation (Urgent)
// ============================================

export function getTriagePathAEmail(data: TriageEmailData) {
    return {
        subject: `🔴 URGENT Vision Triage: ${data.studentName} — Functional Evaluation Needed (${data.caseNumber})`,
        html: `
            <!DOCTYPE html>
            <html>
                <head>${emailStyles}</head>
                <body>
                    <div class="email-container">
                        <div class="header" style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);">
                            <h1>🔴 Path A: Functional Vision Evaluation</h1>
                            <p>Vision Triage Protocol — Urgent Referral</p>
                        </div>
                        <div class="content">
                            <h2>Hi ${data.teacherName},</h2>
                            <p>The Vision Triage Protocol has determined that <strong>${data.studentName}</strong> should be referred for a <strong>Comprehensive Functional Vision Evaluation</strong>.</p>

                            <div class="info-box" style="border-left-color: #dc2626; background: #fef2f2;">
                                <strong>Case Number:</strong> ${data.caseNumber}<br>
                                <strong>Student:</strong> ${data.studentName}<br>
                                <strong>Referral Path:</strong> Path A — Functional Vision Evaluation<br>
                                <strong>Priority:</strong> <span class="badge" style="background: #fee2e2; color: #991b1b;">URGENT</span><br>
                                <strong>Recommended Provider:</strong> ${data.providerType}<br>
                                <strong>Evaluation Type:</strong> ${data.orderType}
                            </div>

                            ${data.surveyScore > 0 ? `
                                <div class="info-box">
                                    <strong>Survey Results:</strong>
                                    <p style="margin: 8px 0 0 0;">${data.surveyType} Score: <strong>${data.surveyScore}</strong></p>
                                </div>
                            ` : ''}

                            <h2>Key Findings:</h2>
                            <ul>
                                ${data.flags.map(flag => `<li>${flag}</li>`).join('')}
                            </ul>

                            <div class="divider"></div>

                            <h2>What This Means</h2>
                            <p>This student shows signs of possible functional vision deficits that go beyond what a standard eye exam measures. A comprehensive evaluation will assess binocularity, oculomotor function, and visual processing.</p>
                            <p style="font-size: 14px; color: #991b1b; font-weight: 600;">⚠️ Standard 20-minute eye exams often overlook these deficits. Please ensure the evaluation is with a Behavioral/Developmental Optometrist.</p>

                            <p style="text-align: center;">
                                <a href="${APP_URL}/referrals/${data.caseNumber}" class="button" style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);">
                                    View Full Referral Report
                                </a>
                            </p>
                        </div>
                        <div class="footer">
                            <p><strong>School Referral Platform — Vision Triage</strong></p>
                            <p>Educational Vision Triage Protocol</p>
                        </div>
                    </div>
                </body>
            </html>
        `,
    };
}

// ============================================
// Path B — Routine Binocular Assessment
// ============================================

export function getTriagePathBEmail(data: TriageEmailData) {
    return {
        subject: `🔵 Vision Triage: ${data.studentName} — Routine Eye Exam Recommended (${data.caseNumber})`,
        html: `
            <!DOCTYPE html>
            <html>
                <head>${emailStyles}</head>
                <body>
                    <div class="email-container">
                        <div class="header" style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);">
                            <h1>🔵 Path B: Routine Binocular Assessment</h1>
                            <p>Vision Triage Protocol — Standard Referral</p>
                        </div>
                        <div class="content">
                            <h2>Hi ${data.teacherName},</h2>
                            <p>The Vision Triage Protocol recommends that <strong>${data.studentName}</strong> receive a <strong>Routine Eye Exam with Binocular Emphasis</strong>.</p>

                            <div class="info-box">
                                <strong>Case Number:</strong> ${data.caseNumber}<br>
                                <strong>Student:</strong> ${data.studentName}<br>
                                <strong>Referral Path:</strong> Path B — Routine Binocular Assessment<br>
                                <strong>Recommended Provider:</strong> ${data.providerType}<br>
                                <strong>Evaluation Type:</strong> ${data.orderType}
                            </div>

                            <h2>Key Findings:</h2>
                            <ul>
                                ${data.flags.map(flag => `<li>${flag}</li>`).join('')}
                            </ul>

                            <div class="divider"></div>

                            <h2>What This Means</h2>
                            <p>Distance vision difficulty was the primary finding, suggesting a possible refractive error (needing glasses). The symptom scores were within the low-risk range for functional vision issues.</p>

                            <div class="info-box" style="border-left-color: #f59e0b; background: #fffbeb;">
                                <strong>Follow-up Plan:</strong>
                                <p style="margin: 8px 0 0 0;">Correct refractive error (glasses). Rescreen in 6 weeks. If symptoms persist after correction, upgrade to Path A (Functional Evaluation).</p>
                            </div>

                            <p style="text-align: center;">
                                <a href="${APP_URL}/referrals/${data.caseNumber}" class="button" style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);">
                                    View Referral Details
                                </a>
                            </p>
                        </div>
                        <div class="footer">
                            <p><strong>School Referral Platform — Vision Triage</strong></p>
                            <p>Educational Vision Triage Protocol</p>
                        </div>
                    </div>
                </body>
            </html>
        `,
    };
}

// ============================================
// Monitor — No Immediate Referral
// ============================================

export function getTriageMonitorEmail(data: TriageEmailData) {
    return {
        subject: `🟢 Vision Triage: ${data.studentName} — Continue Monitoring (${data.caseNumber})`,
        html: `
            <!DOCTYPE html>
            <html>
                <head>${emailStyles}</head>
                <body>
                    <div class="email-container">
                        <div class="header" style="background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);">
                            <h1>🟢 Continue Monitoring</h1>
                            <p>Vision Triage Protocol — No Immediate Referral</p>
                        </div>
                        <div class="content">
                            <h2>Hi ${data.teacherName},</h2>
                            <p>The Vision Triage Protocol has been completed for <strong>${data.studentName}</strong>. Based on the assessment, no immediate referral is indicated at this time.</p>

                            <div class="info-box" style="border-left-color: #16a34a; background: #f0fdf4;">
                                <strong>Case Number:</strong> ${data.caseNumber}<br>
                                <strong>Student:</strong> ${data.studentName}<br>
                                <strong>Result:</strong> Continue Monitoring<br>
                                <strong>Rescreen:</strong> In 6 weeks
                            </div>

                            ${data.surveyScore > 0 ? `
                                <div class="info-box">
                                    <strong>Survey Results:</strong>
                                    <p style="margin: 8px 0 0 0;">${data.surveyType} Score: <strong>${data.surveyScore}</strong> (within normal range)</p>
                                </div>
                            ` : ''}

                            <div class="divider"></div>

                            <h2>What This Means</h2>
                            <p>The student's symptom scores fall within the normal range, and no critical observational flags were identified. However, continue to monitor for any changes.</p>

                            <h2>Recommended Next Steps:</h2>
                            <ul>
                                <li>Continue classroom observations over the next 6 weeks</li>
                                <li>If symptoms worsen or new concerns arise, re-run the triage</li>
                                <li>A routine eye exam is still recommended if not done recently</li>
                            </ul>

                            <p style="text-align: center;">
                                <a href="${APP_URL}/referrals/${data.caseNumber}" class="button" style="background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);">
                                    View Triage Report
                                </a>
                            </p>
                        </div>
                        <div class="footer">
                            <p><strong>School Referral Platform — Vision Triage</strong></p>
                            <p>Educational Vision Triage Protocol</p>
                        </div>
                    </div>
                </body>
            </html>
        `,
    };
}
