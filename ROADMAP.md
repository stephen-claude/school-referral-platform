# Development Roadmap

## Current Status: Project Initialized ✅

### What's Complete
- ✅ Next.js 16 project created
- ✅ TypeScript configured
- ✅ Tailwind CSS installed
- ✅ Firebase SDK installed (client + admin)
- ✅ React Hook Form + Zod for forms
- ✅ Framer Motion for animations
- ✅ Zustand for state management
- ✅ Project structure created
- ✅ TypeScript types defined (User, School, Teacher, Student, Referral, Questionnaire)
- ✅ Firebase initialization files created
- ✅ Environment variable template created

### What's Next: Firebase Configuration Required

**You must complete Firebase setup before we can continue development.**

Follow these steps:

1. **Read `FIREBASE_SETUP.md`** - Detailed guide for creating Firebase project
2. **Create Firebase project** in the console
3. **Enable services** (Auth, Firestore, Storage)
4. **Get credentials** (web config + service account)
5. **Create `.env.local`** with your credentials
6. **Notify me** that Firebase is configured

---

## Phase 1 Development Plan (After Firebase Setup)

### Week 1-2: Authentication & User Management
- [ ] Login page with email/password
- [ ] Google OAuth login
- [ ] Registration flow with role selection
- [ ] Custom claims implementation (clinic_admin, school_admin, teacher)
- [ ] Role-based route protection
- [ ] User profile management

### Week 3-4: School & Teacher Management
- [ ] School creation (clinic admin only)
- [ ] School list/grid with cards
- [ ] Teacher invitation system
- [ ] Teacher onboarding flow
- [ ] School dashboard
- [ ] Teacher dashboard

### Week 5-7: Student & Referral System
- [ ] Student profile creation
- [ ] Student list with card UI
- [ ] Multi-step referral wizard (10 steps)
- [ ] Autosave for draft referrals
- [ ] File upload for attachments
- [ ] Referral submission confirmation

### Week 8-10: Clinic Triage & Case Management
- [ ] Triage inbox with filters
- [ ] Referral card component (with status, priority badges)
- [ ] Case view with tabs (Questionnaire, Summary, Decision, Audit)
- [ ] Algorithm integration (risk scoring)
- [ ] Status change workflow
- [ ] Case notes (internal clinic notes)

### Week 11-12: Email & Templates
- [ ] Template management (create/edit templates)
- [ ] Outbound email via Cloud Functions
- [ ] Email composition with merge fields
- [ ] PDF letter generation
- [ ] Basic email confirmation to teachers

### Week 13-14: Notifications & Polish
- [ ] Notification system (in-app)
- [ ] Notification center UI
- [ ] Badge counts
- [ ] Toast notifications
- [ ] Audit trail implementation
- [ ] Performance optimization
- [ ] Accessibility review

### Week 15-16: Testing & MVP Launch
- [ ] Security rules deployment
- [ ] Multi-tenancy testing (school separation)
- [ ] Role-based access testing
- [ ] Email workflow testing
- [ ] User acceptance testing
- [ ] Bug fixes
- [ ] MVP deployment

---

## Development Dependencies Installation Status

| Package | Version | Status |
|---------|---------|--------|
| next | 16.1.6 | ✅ Installed |
| react | latest | ✅ Installed |
| typescript | latest | ✅ Installed |
| firebase | latest | ✅ Installed |
| firebase-admin | latest | ✅ Installed |
| react-hook-form | latest | ✅ Installed |
| zod | latest | ✅ Installed |
| framer-motion | latest | ✅ Installed |
| tailwindcss | latest | ✅ Installed |
| zustand | latest | ✅ Installed |
| react-hot-toast | latest | ✅ Installed |
| date-fns | latest | ✅ Installed |

---

## Immediate Next Step

🔴 **ACTION REQUIRED**: Complete Firebase setup using `FIREBASE_SETUP.md`

Once Firebase is configured, we can immediately begin building:
1. Authentication screens
2. Role-based dashboards
3. School/teacher management

**Estimated time for Firebase setup**: 15-20 minutes

Let me know when you're ready with the Firebase credentials!
