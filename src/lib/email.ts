import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.EMAIL_FROM || 'School Referral Platform <onboarding@resend.dev>';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// Email template styles - consistent across all emails
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
      background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
      padding: 40px 30px;
      text-align: center;
    }
    .header h1 {
      color: #ffffff;
      margin: 0;
      font-size: 28px;
      font-weight: 600;
    }
    .header p {
      color: #e0e7ff;
      margin: 8px 0 0 0;
      font-size: 14px;
    }
    .content {
      padding: 40px 30px;
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
    .badge-new { background: #dbeafe; color: #1e40af; }
    .badge-urgent { background: #fee2e2; color: #991b1b; }
    .badge-completed { background: #d1fae5; color: #065f46; }
    .badge-in-review { background: #fef3c7; color: #92400e; }
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
      margin-bottom: 8px;
    }
    .button {
      display: inline-block;
      padding: 14px 28px;
      background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      margin: 20px 0;
      text-align: center;
    }
    .button:hover {
      opacity: 0.9;
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

// Template: Referral Submitted (to Teacher)
export function getReferralSubmittedEmail(data: {
  teacherName: string;
  studentName: string;
  caseNumber: string;
  submittedDate: string;
}) {
  return {
    subject: `✅ Referral Submitted: ${data.studentName} - ${data.caseNumber}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>${emailStyles}</head>
        <body>
          <div class="email-container">
            <div class="header">
              <h1>🎓 Referral Submitted Successfully</h1>
              <p>School Referral Platform</p>
            </div>
            <div class="content">
              <h2>Hi ${data.teacherName},</h2>
              <p>Your vision referral for <strong>${data.studentName}</strong> has been successfully submitted to the clinic for review.</p>
              
              <div class="info-box">
                <strong>Case Number:</strong> ${data.caseNumber}<br>
                <strong>Student:</strong> ${data.studentName}<br>
                <strong>Submitted:</strong> ${data.submittedDate}<br>
                <span class="badge badge-new">New Referral</span>
              </div>

              <h2>What Happens Next?</h2>
              <ul>
                <li><strong>Clinic Review:</strong> Our clinic team will review the referral within 2-3 business days</li>
                <li><strong>Risk Assessment:</strong> An algorithm will analyze the case and assign a priority level</li>
                <li><strong>Status Updates:</strong> You'll receive email notifications as the case progresses</li>
                <li><strong>Parent Contact:</strong> The clinic may reach out to the parent/guardian directly</li>
              </ul>

              <div class="divider"></div>

              <p style="text-align: center;">
                <a href="${APP_URL}/referrals/${data.caseNumber}" class="button">
                  View Referral Details
                </a>
              </p>

              <p style="font-size: 14px; color: #6b7280;">
                💡 <strong>Tip:</strong> You can track this referral's progress anytime from your dashboard.
              </p>
            </div>
            <div class="footer">
              <p><strong>School Referral Platform</strong></p>
              <p>Improving vision care access in schools</p>
              <p style="font-size: 12px; color: #9ca3af; margin-top: 15px;">
                This is an automated notification. Please do not reply to this email.
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
  };
}

// Template: Status Update (to Teacher)
export function getStatusUpdateEmail(data: {
  teacherName: string;
  studentName: string;
  caseNumber: string;
  oldStatus: string;
  newStatus: string;
  message?: string;
}) {
  const statusBadge = data.newStatus === 'completed' ? 'badge-completed' :
    data.newStatus === 'urgent' ? 'badge-urgent' :
      data.newStatus === 'in_review' ? 'badge-in-review' : 'badge-new';

  return {
    subject: `📋 Case Update: ${data.studentName} - ${data.caseNumber}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>${emailStyles}</head>
        <body>
          <div class="email-container">
            <div class="header">
              <h1>📋 Referral Status Updated</h1>
              <p>School Referral Platform</p>
            </div>
            <div class="content">
              <h2>Hi ${data.teacherName},</h2>
              <p>The status of your referral for <strong>${data.studentName}</strong> has been updated by the clinic team.</p>
              
              <div class="info-box">
                <strong>Case Number:</strong> ${data.caseNumber}<br>
                <strong>Student:</strong> ${data.studentName}<br>
                <strong>Status Change:</strong> ${data.oldStatus.replace('_', ' ')} → ${data.newStatus.replace('_', ' ')}<br>
                <span class="badge ${statusBadge}">${data.newStatus.replace('_', ' ').toUpperCase()}</span>
              </div>

              ${data.message ? `
                <h2>Message from Clinic:</h2>
                <div class="info-box" style="border-left-color: #7c3aed;">
                  <p style="margin: 0;">${data.message}</p>
                </div>
              ` : ''}

              <div class="divider"></div>

              <p style="text-align: center;">
                <a href="${APP_URL}/referrals/${data.caseNumber}" class="button">
                  View Full Case Details
                </a>
              </p>
            </div>
            <div class="footer">
              <p><strong>School Referral Platform</strong></p>
              <p>Improving vision care access in schools</p>
              <p style="font-size: 12px; color: #9ca3af; margin-top: 15px;">
                This is an automated notification. Please do not reply to this email.
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
  };
}

// Template: Urgent Case Alert (to Clinic)
export function getUrgentCaseEmail(data: {
  studentName: string;
  caseNumber: string;
  teacherName: string;
  schoolName: string;
  riskScore: number;
  flags: string[];
}) {
  return {
    subject: `🚨 URGENT: New High-Priority Referral - ${data.caseNumber}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>${emailStyles}</head>
        <body>
          <div class="email-container">
            <div class="header" style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);">
              <h1>🚨 Urgent Referral Alert</h1>
              <p>Immediate Attention Required</p>
            </div>
            <div class="content">
              <h2>High-Priority Case Submitted</h2>
              <p>A new referral has been flagged as <strong>URGENT</strong> by the risk assessment algorithm and requires immediate review.</p>
              
              <div class="info-box" style="border-left-color: #dc2626; background: #fef2f2;">
                <strong>Case Number:</strong> ${data.caseNumber}<br>
                <strong>Student:</strong> ${data.studentName}<br>
                <strong>Teacher:</strong> ${data.teacherName}<br>
                <strong>School:</strong> ${data.schoolName}<br>
                <strong>Risk Score:</strong> ${data.riskScore}/100<br>
                <span class="badge badge-urgent">URGENT</span>
              </div>

              <h2>Risk Flags Detected:</h2>
              <ul>
                ${data.flags.map(flag => `<li style="color: #991b1b; font-weight: 500;">${flag}</li>`).join('')}
              </ul>

              <div class="divider"></div>

              <p style="text-align: center;">
                <a href="${APP_URL}/clinic/cases/${data.caseNumber}" class="button" style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);">
                  Review Case Immediately
                </a>
              </p>

              <p style="font-size: 14px; color: #991b1b; font-weight: 600; text-align: center;">
                ⚠️ Please review this case within 24 hours
              </p>
            </div>
            <div class="footer">
              <p><strong>School Referral Platform</strong></p>
              <p>Clinic Admin Portal</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };
}

// Template: Parent Notification
export function getParentNotificationEmail(data: {
  parentName: string;
  studentName: string;
  teacherName: string;
  schoolName: string;
  caseNumber: string;
  concerns: string[];
}) {
  return {
    subject: `Vision Assessment Referral for ${data.studentName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>${emailStyles}</head>
        <body>
          <div class="email-container">
            <div class="header">
              <h1>👁️ Vision Assessment Referral</h1>
              <p>School Referral Platform</p>
            </div>
            <div class="content">
              <h2>Dear ${data.parentName},</h2>
              <p>Your child's teacher, ${data.teacherName}, has submitted a referral for ${data.studentName} to receive a functional vision assessment.</p>
              
              <div class="info-box">
                <strong>Student:</strong> ${data.studentName}<br>
                <strong>School:</strong> ${data.schoolName}<br>
                <strong>Teacher:</strong> ${data.teacherName}<br>
                <strong>Reference Number:</strong> ${data.caseNumber}
              </div>

              <h2>Areas of Concern:</h2>
              <p>The teacher has observed the following:</p>
              <ul>
                ${data.concerns.map(concern => `<li>${concern}</li>`).join('')}
              </ul>

              <h2>Next Steps:</h2>
              <p>A vision clinic specialist will review this referral and may contact you to schedule an assessment. This evaluation will help determine if ${data.studentName} would benefit from vision therapy or other interventions.</p>

              <div class="divider"></div>

              <p style="font-size: 14px; color: #6b7280; background: #f3f4f6; padding: 15px; border-radius: 8px;">
                <strong>📞 Questions?</strong><br>
                Please contact ${data.teacherName} or your school's administrative office for more information about this referral.
              </p>
            </div>
            <div class="footer">
              <p><strong>School Referral Platform</strong></p>
              <p>Supporting student vision health</p>
              <p style="font-size: 12px; color: #9ca3af; margin-top: 15px;">
                This notification is for informational purposes. A clinic representative may contact you directly.
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
  };
}

// Template: Weekly Digest (to Clinic)
export function getWeeklyDigestEmail(data: {
  weekStart: string;
  weekEnd: string;
  stats: {
    newReferrals: number;
    completedCases: number;
    urgentCases: number;
    avgResponseTime: string;
  };
  topSchools: Array<{ name: string; count: number }>;
}) {
  return {
    subject: `📊 Weekly Digest: ${data.weekStart} - ${data.weekEnd}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>${emailStyles}</head>
        <body>
          <div class="email-container">
            <div class="header">
              <h1>📊 Weekly Performance Digest</h1>
              <p>${data.weekStart} - ${data.weekEnd}</p>
            </div>
            <div class="content">
              <h2>Week in Review</h2>
              <p>Here's a summary of referral activity for the past week:</p>
              
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 30px 0;">
                <div style="background: #eff6ff; padding: 20px; border-radius: 8px; text-align: center;">
                  <div style="font-size: 36px; font-weight: 700; color: #2563eb;">${data.stats.newReferrals}</div>
                  <div style="color: #1e40af; font-size: 14px; font-weight: 600;">New Referrals</div>
                </div>
                <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; text-align: center;">
                  <div style="font-size: 36px; font-weight: 700; color: #16a34a;">${data.stats.completedCases}</div>
                  <div style="color: #166534; font-size: 14px; font-weight: 600;">Completed</div>
                </div>
                <div style="background: #fef2f2; padding: 20px; border-radius: 8px; text-align: center;">
                  <div style="font-size: 36px; font-weight: 700; color: #dc2626;">${data.stats.urgentCases}</div>
                  <div style="color: #991b1b; font-size: 14px; font-weight: 600;">Urgent Cases</div>
                </div>
                <div style="background: #fef3c7; padding: 20px; border-radius: 8px; text-align: center;">
                  <div style="font-size: 24px; font-weight: 700; color: #d97706;">${data.stats.avgResponseTime}</div>
                  <div style="color: #92400e; font-size: 14px; font-weight: 600;">Avg Response</div>
                </div>
              </div>

              ${data.topSchools.length > 0 ? `
                <h2>Top Referring Schools:</h2>
                <ul>
                  ${data.topSchools.map(school => `
                    <li><strong>${school.name}</strong>: ${school.count} referral${school.count !== 1 ? 's' : ''}</li>
                  `).join('')}
                </ul>
              ` : ''}

              <div class="divider"></div>

              <p style="text-align: center;">
                <a href="${APP_URL}/clinic/analytics" class="button">
                  View Full Analytics
                </a>
              </p>
            </div>
            <div class="footer">
              <p><strong>School Referral Platform</strong></p>
              <p>Weekly Performance Report</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };
}

// Main send function
export async function sendEmail(type: string, data: any) {
  let emailContent;

  switch (type) {
    case 'referral_submitted':
      emailContent = getReferralSubmittedEmail(data);
      break;
    case 'status_update':
      emailContent = getStatusUpdateEmail(data);
      break;
    case 'urgent_case':
      emailContent = getUrgentCaseEmail(data);
      break;
    case 'parent_notification':
      emailContent = getParentNotificationEmail(data);
      break;
    case 'weekly_digest':
      emailContent = getWeeklyDigestEmail(data);
      break;
    default:
      throw new Error(`Unknown email type: ${type}`);
  }

  const result = await resend.emails.send({
    from: FROM_EMAIL,
    to: data.to || data.teacherEmail || data.parentEmail,
    subject: emailContent.subject,
    html: emailContent.html,
  });

  return result;
}
