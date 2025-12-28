# منصة تقييم جمال الإبل بالذكاء الاصطناعي
# AI-Based Camel Beauty Evaluation Platform

A comprehensive platform for evaluating camel beauty using AI technology, designed with Arabic as the primary language and full RTL support.

## Phase 1 - Foundation & Core Platform (Completed)

This implementation includes all Phase 1 requirements from the project specification:

### Features Implemented

#### 1. Authentication & User Management
- Email/password authentication using Supabase Auth
- JWT-based authentication
- User roles: Visitor, Camel Owner, Expert Judge, Admin
- Secure password hashing
- Profile management

#### 2. Arabic-First UI System
- Default language: Arabic with RTL layout
- Language toggle between Arabic and English
- All components are RTL-aware
- Arabic-friendly fonts (Cairo, IBM Plex Sans Arabic)
- Proper text alignment and layout flipping

#### 3. Website Pages

**Public Pages:**
- **Landing Page**: Main hero section with features showcase
- **About Page**: Vision, mission, and scientific credibility
- **How It Works**: Step-by-step explanation of the evaluation process
- **Contact Page**: Contact form with organization information

**Authenticated Pages:**
- **Dashboard**: Overview with statistics (total camels, evaluations, average scores)
- **My Camels**: List of all user's camels with quick actions
- **Camel Details**: Detailed view with evaluations and image upload
- **Camel Form**: Create and edit camel profiles

#### 4. Camel Management
- Create camel profiles with:
  - Name
  - Breed
  - Gender (Male/Female)
  - Age
  - Notes (optional)
- Edit and delete camel profiles
- View detailed camel information

#### 5. Image Upload & Mock Evaluation
- Upload camel images (JPG/PNG)
- Store images securely in Supabase Storage
- Mock AI evaluation system that generates:
  - Overall score (0-100)
  - Region-specific scores:
    - Head (الرأس)
    - Neck (العنق)
    - Hump (السنام)
    - Body (الجسم)
    - Legs (الأرجل)
- View evaluation history for each camel

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **TailwindCSS** for styling with RTL support
- **React Router** for navigation
- **Lucide React** for icons
- **Vite** for build tooling

### Backend & Database
- **Supabase** for:
  - Authentication
  - PostgreSQL database
  - Row Level Security (RLS)
  - Storage for images
- **TypeScript** for type safety

## Database Schema

### Tables
1. **profiles** - User profiles with roles
2. **camels** - Camel information
3. **camel_images** - Uploaded camel images
4. **evaluations** - AI and expert evaluations

### Security
- Row Level Security (RLS) enabled on all tables
- Role-based access control
- Secure image storage with public URLs

## Setup Instructions

### Prerequisites
- Node.js 18+ installed
- A Supabase account and project

### 1. Clone and Install Dependencies

```bash
npm install
```

### 2. Configure Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Run the migration to create database tables (already done via Supabase tools)
3. Create a storage bucket named "camels":
   - Go to Storage in Supabase Dashboard
   - Create a new bucket called "camels"
   - Make it public

### 3. Environment Variables

The Supabase environment variables are already configured and available:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

These are automatically provided by the Supabase integration.

### 4. Run the Application

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### 5. Build for Production

```bash
npm run build
```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Header.tsx      # Navigation header
│   ├── Layout.tsx      # Page layout wrapper
│   └── ProtectedRoute.tsx  # Route protection
├── contexts/           # React contexts
│   ├── AuthContext.tsx    # Authentication state
│   └── LanguageContext.tsx # Language/RTL state
├── lib/                # Utilities and configurations
│   ├── supabase.ts     # Supabase client
│   └── translations.ts # All translations
├── pages/              # Page components
│   ├── Landing.tsx
│   ├── About.tsx
│   ├── HowItWorks.tsx
│   ├── Contact.tsx
│   ├── Login.tsx
│   ├── Register.tsx
│   ├── Dashboard.tsx
│   ├── CamelsList.tsx
│   ├── CamelForm.tsx
│   └── CamelDetails.tsx
├── App.tsx             # Main app with routing
├── main.tsx            # Entry point
└── index.css           # Global styles
```

## User Roles

### Visitor
- Can view public pages
- Can register for an account

### Camel Owner / Breeder (Default)
- All visitor permissions
- Create and manage their camels
- Upload camel images
- View evaluations for their camels

### Expert Judge
- View all camels
- (Phase 2) Provide manual evaluations

### Admin
- Full system access
- Manage user roles
- View all data

## Key Features for Arabic Users

1. **RTL Layout**: Entire interface flips for Arabic readers
2. **Arabic Typography**: High-quality Arabic fonts (Cairo)
3. **Bilingual Support**: Seamless switching between Arabic and English
4. **Cultural Context**: Designed for Gulf region users
5. **Arabic-First Content**: All primary content in Arabic

## Mock AI Evaluation

In Phase 1, the AI evaluation is mocked with random scores between 75-95 to demonstrate the user flow. Real AI integration will be implemented in Phase 2.

## What's Next (Phase 2)

- Real AI pipeline integration with PyTorch
- Image segmentation (UNet/Mask R-CNN)
- Feature extraction and attention-based scoring
- Visual explanations (attention maps, segmentation overlays)
- PDF report generation
- Expert manual scoring system

## Security Features

- Secure authentication with JWT
- Row Level Security on all database operations
- Protected routes requiring authentication
- Secure file upload with validation
- SQL injection prevention through Supabase client

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## License

Proprietary - All rights reserved

---

**Built with care for the camel breeding community** 🐪
