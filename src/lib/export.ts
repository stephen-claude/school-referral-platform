/**
 * Export utilities for generating PDFs and printable documents
 */

interface ExportReferralData {
    caseNumber: string;
    studentName: string;
    dateOfBirth: string;
    grade: string;
    teacherName: string;
    schoolName: string;
    submittedDate: string;
    status: string;
    priority: string;
    questionnaire: any;
    riskScore?: any;
}

/**
 * Generate HTML template for PDF export
 */
export function generateReferralHTML(data: ExportReferralData): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Referral ${data.caseNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 40px; color: #1f2937; }
    .header { border-bottom: 3px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
    .header h1 { font-size: 28px; color: #1f2937; margin-bottom: 8px; }
    .header .subtitle { color: #6b7280; font-size: 14px; }
    .section { margin-bottom: 30px; page-break-inside: avoid; }
    .section-title { font-size: 18px; font-weight: 600; color: #1f2937; margin-bottom: 12px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .info-item { margin-bottom: 12px; }
    .info-label { font-size: 12px; font-weight: 500; color: #6b7280; text-transform: uppercase; margin-bottom: 4px; }
    .info-value { font-size: 14px; color: #1f2937; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 11px; font-weight: 600; text-transform: uppercase; }
    .badge-urgent { background: #fee2e2; color: #991b1b; }
    .badge-high { background: #fed7aa; color: #9a3412; }
    .badge-medium { background: #fef3c7; color: #92400e; }
    .badge-low { background: #dbeafe; color: #1e40af; }
    .list-item { margin-left: 20px; margin-bottom: 8px; color: #4b5563; }
    .notes-box { background: #f9fafb; border-left: 4px solid #2563eb; padding: 16px; margin-top: 12px; }
    .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 12px; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>Vision Referral Assessment</h1>
    <div class="subtitle">Case Number: ${data.caseNumber}</div>
  </div>

  <div class="section">
    <div class="section-title">Case Information</div>
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">Student Name</div>
        <div class="info-value">${data.studentName}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Grade</div>
        <div class="info-value">${data.grade}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Date of Birth</div>
        <div class="info-value">${data.dateOfBirth}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Submitted Date</div>
        <div class="info-value">${data.submittedDate}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Teacher</div>
        <div class="info-value">${data.teacherName}</div>
      </div>
      <div class="info-item">
        <div class="info-label">School</div>
        <div class="info-value">${data.schoolName}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Priority Level</div>
        <div class="info-value">
          <span class="badge badge-${data.priority}">${data.priority.toUpperCase()}</span>
        </div>
      </div>
      <div class="info-item">
        <div class="info-label">Status</div>
        <div class="info-value">${data.status.replace('_', ' ').toUpperCase()}</div>
      </div>
    </div>
  </div>

  ${data.riskScore ? `
  <div class="section">
    <div class="section-title">Risk Assessment</div>
    <div class="info-item">
      <div class="info-label">Overall Risk Score</div>
      <div class="info-value">${data.riskScore.overall}/100 - ${data.riskScore.category.toUpperCase()}</div>
    </div>
    ${data.riskScore.flags.length > 0 ? `
      <div class="info-item">
        <div class="info-label">Risk Flags</div>
        <ul>
          ${data.riskScore.flags.map((flag: string) => `<li class="list-item">${flag}</li>`).join('')}
        </ul>
      </div>
    ` : ''}
    <div class="notes-box">
      <strong>Recommendation:</strong> ${data.riskScore.recommendation}
    </div>
  </div>
  ` : ''}

  ${data.questionnaire?.readingPerformance ? `
  <div class="section">
    <div class="section-title">Reading Performance</div>
    ${data.questionnaire.readingPerformance.otherNotes ? `
      <div class="notes-box">${data.questionnaire.readingPerformance.otherNotes}</div>
    ` : '<p class="info-value">No specific concerns noted.</p>'}
  </div>
  ` : ''}

  ${data.questionnaire?.visualSymptoms ? `
  <div class="section">
    <div class="section-title">Visual Symptoms</div>
    ${data.questionnaire.visualSymptoms.otherNotes ? `
      <div class="notes-box">${data.questionnaire.visualSymptoms.otherNotes}</div>
    ` : '<p class="info-value">No symptoms reported.</p>'}
  </div>
  ` : ''}

  ${data.questionnaire?.teacherSummary ? `
  <div class="section">
    <div class="section-title">Teacher Summary</div>
    <div class="notes-box">${typeof data.questionnaire.teacherSummary === 'string' ? data.questionnaire.teacherSummary : data.questionnaire.teacherSummary.description || ''}</div>
  </div>
  ` : ''}

  <div class="footer">
    <p>This document was generated by the School Referral Platform</p>
    <p>Generated on ${new Date().toLocaleString()}</p>
  </div>
</body>
</html>
  `;
}

/**
 * Trigger browser print dialog
 */
export function printReferral(htmlContent: string) {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.focus();

        // Wait for content to load then print
        setTimeout(() => {
            printWindow.print();
        }, 250);
    }
}

/**
 * Download as HTML file
 */
export function downloadReferralHTML(htmlContent: string, caseNumber: string) {
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `referral-${caseNumber}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
