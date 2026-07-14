Engine Eye 🔧

AI-powered car diagnostics for everyone.

Engine Eye is a full-stack mobile application that puts expert-level automotive knowledge in your pocket. From decoding warning lights to analyzing mechanic quotes, Engine Eye helps car owners of all experience levels understand their vehicles and make informed decisions.


Now available on the Apple App Store!




Features


AI Diagnosis — Describe your car problem or upload a photo and get an instant expert diagnosis powered by Claude AI
Mechanic Quote Analysis — Upload a repair quote and find out what is necessary, optional, or overpriced
OBD-II Code Lookup — Enter a diagnostic trouble code for a full breakdown of causes, costs, and repair steps
Recall Lookup — Automatically checks NHTSA for active safety recalls on your vehicle using year/make/model or VIN
Repair History and Maintenance Tracking — Log repairs, track maintenance schedules, and monitor mileage across multiple vehicles
DIY Repair Videos — Get curated YouTube tutorials matched to your exact diagnosis
Find Shops Nearby — Connects directly to Apple Maps to find auto repair shops near you
Face ID Login — Secure biometric authentication
Push Notifications — Maintenance reminders and repair follow-up alerts



Tech Stack

Frontend


React Native (Expo SDK 54)
JavaScript
Expo SecureStore, Expo Notifications, Expo Local Authentication


Backend


Python / FastAPI
Uvicorn
Deployed on Railway


AI / APIs


Anthropic Claude AI (diagnosis, quote analysis, OBD lookup)
NHTSA API (vehicle recalls, VIN decoding)
YouTube Data API (DIY repair videos)
Apple Maps (shop finder)


Database / Auth


Supabase (PostgreSQL + authentication)


DevOps


GitHub (version control)
Railway (backend hosting)
Expo EAS (iOS/Android build and deployment)



Architecture

User (React Native App) → FastAPI Backend (Railway) → Anthropic Claude AI / NHTSA API / YouTube API → Supabase (auth + user data)


Getting Started

Prerequisites


Node.js
Python 3.11+
Expo CLI
EAS CLI


Backend Setup

cd backend
pip install -r requirements.txt
python -m uvicorn backend.main:app --port 8080 --host 0.0.0.0

Frontend Setup

cd frontend
npm install
npx expo start --tunnel

Environment Variables

Create a .env file in the root directory with the following keys:

ANTHROPIC_API_KEY=your_key
SUPABASE_URL=your_url
SUPABASE_KEY=your_key
YOUTUBE_API_KEY=your_key


Deployment


iOS: Deployed via Expo EAS, available on the Apple App Store
Android: Coming soon via Google Play Store
Backend: Auto-deployed to Railway from GitHub main branch



About

Built by Jack Evans — a solo developer passionate about making automotive knowledge accessible to everyone, regardless of experience level.

"Understanding the unknown has never been so easy."


Contact

jack.evans4408@gmail.com
