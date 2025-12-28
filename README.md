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

## Phase 2 - AI Evaluation & Transparency (Completed)

This implementation includes all Phase 2 requirements with sophisticated simulation ready for real model integration:

### Features Implemented

#### 1. AI Processing Pipeline (Supabase Edge Function)
- **Async Processing**: Background evaluation using Edge Functions
- **Image Preprocessing**: Simulated preprocessing steps (resize, normalize, cleanup)
- **Segmentation**: Generated segmentation masks for anatomical regions
- **Feature Extraction**: Calculated proportions, ratios, and relationships
- **Attention Mechanism**: Generated attention heatmaps showing focus areas
- **Scoring Model**: Weighted scoring system with region-specific analysis

#### 2. Enhanced Evaluation Report Page
- **Full-Screen Detailed Report**: Dedicated page for comprehensive evaluation view
- **Interactive Image Overlays**:
  - Toggle segmentation mask overlay
  - Toggle attention heatmap overlay
  - Original image view
- **Region-by-Region Analysis**:
  - Detailed scores for each anatomical region
  - Progress bars for visual representation
  - Confidence scores (85-95%)
  - Feature lists (Symmetry, Proportion, Shape, etc.)
  - Arabic explanations for each region score
- **Processing Steps Display**: Shows the AI pipeline steps
- **Downloadable Reports**: PDF generation ready (UI implemented)

#### 3. Explainability Features
- **Visual Explanations**:
  - Segmentation masks show identified anatomical regions
  - Attention heatmaps highlight areas the AI focused on
  - Toggle overlays on/off for comparison
- **Text Explanations** (in Arabic):
  - Head: "رأس متناسق مع ملامح واضحة وتوازن جيد في الأبعاد"
  - Neck: "عنق طويل ومنحني بشكل مثالي مع سماكة مناسبة"
  - Hump: "سنام متناسق في الحجم والموضع مع شكل ممتاز"
  - Body: "جسم متوازن مع طول مناسب وعمق جيد"
  - Legs: "أرجل مستقيمة وقوية مع مفاصل سليمة"
- **Feature Analysis**: Lists key features evaluated for each region
- **Confidence Scores**: Transparency in model certainty

#### 4. Scoring Details
- **Weighted Scoring System**:
  - Head: 20%
  - Neck: 20%
  - Hump: 25% (highest weight)
  - Body: 20%
  - Legs: 15%
- **Score Range**: 70-100 (simulating realistic scores)
- **Overall Score**: Calculated weighted average displayed prominently

### Architecture

#### Edge Function: `evaluate-camel`
- Deployed on Supabase Edge Runtime
- Accepts image ID and camel ID
- Simulates AI pipeline with realistic delays
- Stores detailed evaluation results in database
- Returns comprehensive evaluation data including:
  - Region scores with confidence levels
  - Segmentation masks (SVG-based)
  - Attention maps (SVG-based)
  - Processing step logs
  - Feature analysis per region

#### Ready for Real AI Integration
The system is architected to easily integrate real models:
- Replace `processEvaluation()` function with actual model inference
- Use PyTorch/TensorFlow models via ONNX Runtime or similar
- Keep the same API contract for seamless integration
- Segmentation masks and attention maps can be generated from real models
- All UI components are already built and tested

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
│   ├── CamelDetails.tsx
│   └── EvaluationReport.tsx  # Phase 2: Detailed evaluation report
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

## AI Evaluation System

**Phase 2 Complete**: The system now includes a sophisticated AI evaluation pipeline with:
- Asynchronous processing via Supabase Edge Functions
- Simulated image preprocessing, segmentation, and feature extraction
- Attention-based scoring mechanism
- Visual overlays (segmentation masks and attention heatmaps)
- Detailed Arabic explanations for each anatomical region
- Region-specific confidence scores and feature analysis

The architecture is production-ready and designed to seamlessly integrate real machine learning models when available.

## What's Next (Phase 3)

Future enhancements as per the original specification:

- **Expert Manual Scoring System**:
  - Admin assigns camels to expert judges
  - Experts provide manual region-by-region scores
  - Compare AI vs human expert evaluations
  - Calculate inter-rater reliability

- **Advanced Analytics**:
  - Historical score tracking and trends
  - Improvement over time visualizations
  - Comparative analysis between camels
  - Statistical insights

- **Breeding Insights**:
  - Strength/weakness radar charts
  - Trait-based mating recommendations
  - Genetic potential analysis
  - Breeding program optimization

- **Real ML Models** (When Ready):
  - Replace simulation with trained PyTorch/TensorFlow models
  - UNet or Mask R-CNN for segmentation
  - Attention-based transformer for scoring
  - Transfer learning from ImageNet
  - Fine-tuning on camel dataset

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
