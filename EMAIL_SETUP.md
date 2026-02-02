# Email Integration Setup

## Overview
The platform uses [Resend](https://resend.com) for transactional emails.

## Setup Steps

### 1. Get Resend API Key
1. Go to [resend.com](https://resend.com) and sign up
2. Create a new API key
3. Copy the API key (starts with `re_`)

### 2. Configure Environment Variables
Add to your `.env.local`:

```bash
RESEND_API_KEY=re_your_api_key_here
EMAIL_FROM="School Referral Platform <onboarding@resend.dev>"
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**For Production:**
- Use a custom domain in Resend
- Update `EMAIL_FROM` to use your domain: `"School Referral <noreply@yourdomain.com>"`
- Update `NEXT_PUBLIC_APP_URL` to your production URL

### 3. Verify Domain (Production Only)
1. In Resend dashboard, add your domain
2. Add DNS records (SPF, DKIM, DMARC)
3. Verify domain ownership
4. Update `EMAIL_FROM` in `.env.local`

## Email Types

### 1. Referral Submitted
Sent to teacher when they submit a referral.
- **Trigger**: Referral creation
- **Recipient**: Teacher
- **Includes**: Case number, student name, dashboard link

### 2. Status Update
Sent to teacher when referral status changes.
- **Trigger**: Status change
- **Recipient**: Teacher
- **Includes**: Old/new status, optional message, referral link

### 3. Clinic Notification
Sent to clinic admin when new referral arrives.
- **Trigger**: New referral
- **Recipient**: Clinic admin
- **Includes**: Student, teacher, school, triage link

## Usage Example

```typescript
// In your server-side code or API route
import { sendEmail, emailTemplates } from '@/lib/email';

// Send referral submitted email
await sendEmail({
  to: 'teacher@school.edu',
  ...emailTemplates.referralSubmitted({
    teacherName: 'John Doe',
    studentName: 'Jane Smith',
    caseNumber: 'REF-2026-001234',
  }),
});
```

## API Route

Use the `/api/send-email` endpoint:

```typescript
const response = await fetch('/api/send-email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'referral_submitted',
    data: {
      teacherEmail: 'teacher@school.edu',
      teacherName: 'John Doe',
      studentName: 'Jane Smith',
      caseNumber: 'REF-2026-001234',
    },
  }),
});
```

## Testing

### Development
Resend's free tier allows:
- 100 emails/day
- Test mode available
- Email verification required for recipients

### Test Email
```bash
curl -X POST http://localhost:3000/api/send-email \
  -H "Content-Type: application/json" \
  -d '{
    "type": "referral_submitted",
    "data": {
      "teacherEmail": "your@email.com",
      "teacherName": "Test Teacher",
      "studentName": "Test Student",
      "caseNumber": "REF-2026-000001"
    }
  }'
```

## Customizing Templates

Edit `/src/lib/email.ts` to customize email templates:
- HTML structure
- Styling (inline CSS)
- Content
- Brand colors

## Troubleshooting

### Emails not sending
1. Check API key is correct
2. Verify `RESEND_API_KEY` is in `.env.local`
3. Check Resend dashboard for errors
4. Ensure recipient email is verified (in development)

### Emails going to spam
1. Verify domain ownership
2. Set up SPF, DKIM, DMARC records
3. Use custom domain (not resend.dev)
4. Warm up domain gradually

## Rate Limits

### Free Tier
- 100 emails/day
- 3,000 emails/month

### Paid Plans
- Starts at $20/month for 50,000 emails

## Best Practices
1. Always use templates for consistency
2. Include unsubscribe links (for marketing emails)
3. Track email delivery in Resend dashboard
4. Log email sends in your database
5. Handle failures gracefully (retry logic)
