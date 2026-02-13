# ⚡ Buzz Check

Social check-in app for energy drinks, protein shakes, coffee, and pre-workout — like Untappd but for your daily fuel.

## Tech Stack
- **Frontend:** Expo (React Native) + TypeScript
- **Backend:** Supabase (auth, database, storage)

## Setup

### 1. Database
Run the SQL migration in Supabase SQL Editor:
```
supabase/migration.sql
```

Optionally create a storage bucket called `post-photos` (public) for photo uploads.

### 2. Install & Run
```bash
cd buzz-check
npm install
npx expo start
```

Scan QR with Expo Go, or press `i` for iOS simulator / `w` for web.

## Structure
```
src/
  lib/supabase.ts       # Supabase client
  contexts/AuthContext   # Auth state management
  screens/
    LoginScreen         # Email/password auth
    FeedScreen          # Scrollable post feed
    NewPostScreen       # Create a check-in
    ProfileScreen       # User stats + post grid
  theme.ts              # Colors, fonts, drink types
supabase/
  migration.sql         # Database schema
```

## Features
- 🔐 Email/password auth (sign up + login)
- 📰 Feed with posts from all users
- 💚 Like/unlike posts
- 📸 Photo picker for check-in photos
- 👤 Profile with drink stats (today/week/all time)
- 🌑 Dark mode with neon green + electric blue aesthetic
