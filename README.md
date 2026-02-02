# School Referral Platform

A premium, card-based platform for schools to refer students for functional binocular vision assessment, with integrated clinic management and presentation tools.

## Project Status

✅ **Phase: Initial Setup Complete**
- Next.js 16 with TypeScript + App Router
- Tailwind CSS configured
- Firebase SDK installed and configured
- Project structure created
- TypeScript types defined

🔄 **Next: Firebase Setup Required**

## Quick Start

### 1. Firebase Setup (Required First)

Follow the detailed instructions in [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) to:
- Create your Firebase project
- Enable Authentication (Email/Password + Google)
- Create Firestore database
- Set up Cloud Storage
- Get your configuration credentials

### 2. Configure Environment Variables

After completing Firebase setup:

1. Copy the example environment file:
   ```bash
   cp .env.local.example .env.local
   ```

2. Edit `.env.local` and fill in your Firebase credentials from the Firebase Console

3. **Never commit `.env.local` to Git!** (Already in .gitignore)

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
school-referral-platform/
├── src/
│   ├── app/              # Next.js App Router pages
│   ├── components/       # React components
│   ├── lib/              # Firebase initialization, utilities
│   ├── types/            # TypeScript type definitions
│   ├── hooks/            # Custom React hooks
│   └── utils/            # Helper functions
├── public/               # Static assets
├── FIREBASE_SETUP.md     # Detailed Firebase setup guide
└── .env.local.example    # Environment variables template
```

## Technology Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Firebase (Auth, Firestore, Storage, Functions)
- **Auth**: Firebase Auth with custom claims
- **Forms**: React Hook Form + Zod validation
- **Animations**: Framer Motion
- **State**: Zustand
- **Notifications**: React Hot Toast

## Features (Planned)

### Phase 1 (Current)
- [ ] Authentication (login, register, role-based access)
- [ ] School & teacher management
- [ ] Student profiles
- [ ] Multi-step referral wizard
- [ ] Clinic triage inbox
- [ ] Case management
- [ ] Email notifications
- [ ] PDF letter generation
- [ ] Read-only presentations

### Phase 2
- [ ] Email threading (inbound/outbound)
- [ ] Presentation editor
- [ ] Deep link navigation
- [ ] OcularFlow guided tours

### Phase 3
- [ ] Eye tracking baselines
- [ ] Outcome dashboards
- [ ] Algorithm analytics

## Development Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Type check
npm run type-check
```

## Security Notes

- **Never commit Firebase credentials**
- `.env.local` is gitignored
- Service account JSON contains sensitive keys
- Use environment variables for all secrets

## Documentation

- [Complete Specification](../brain/74f805bd-783a-4bd6-bdc4-791b2602f833/README.md) - Full architecture and design docs
- [Firebase Setup](./FIREBASE_SETUP.md) - Step-by-step Firebase configuration
- [Database Schema](../brain/74f805bd-783a-4bd6-bdc4-791b2602f833/database-schema.md) - Firestore collections and structure
- [UI Design System](../brain/74f805bd-783a-4bd6-bdc4-791b2602f833/ui-design-system.md) - Component styles and guidelines

## Support

For questions or issues during setup, refer to:
1. [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) for Firebase configuration help
2. Specification documents in the `brain` folder
3. Next.js documentation: https://nextjs.org/docs

---

**Status**: Ready for Firebase configuration. Follow FIREBASE_SETUP.md to proceed.
