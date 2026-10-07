# Aluna (ألونا) Backend API

This is the centralized Node.js/Express backend API server for the Aluna Salon App ecosystem.

## Prerequisites
- Node.js (v18 or higher)
- MongoDB (local instance or MongoDB Atlas)

## Installation & Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment Variables**:
   Create a `.env` file in the root of this folder and configure the following variables (refer to `.env.example`):
   ```env
   PORT=5000
   NODE_ENV=development
   MONGO_URI=your_mongodb_connection_string
   
   # Cloudinary (Required for portfolio/avatar image uploads)
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret

   # Firebase Admin SDK (Required for authentication & push notifications)
   FIREBASE_PROJECT_ID=your_firebase_project_id
   FIREBASE_CLIENT_EMAIL=your_firebase_client_email
   FIREBASE_PRIVATE_KEY="your_firebase_private_key_here"

   # AI Features (Required for the smart hair consultant)
   GROQ_API_KEY=your_groq_api_key_here
   ```

3. **Build & Run**:
   - For Development (with live-reload):
     ```bash
     npm run dev
     ```
   - For Production:
     ```bash
     npm run build
     npm start
     ```
