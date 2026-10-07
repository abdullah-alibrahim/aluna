# Aluna (ألونا) Owner App

This is the salon manager-facing mobile application for the Aluna Salon App, built using React Native and Expo.

## Installation & Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment Variables**:
   Create a `.env` file in the root of this folder and configure the following:
   ```env
   # API & WebSocket URL (use your server IP address for testing on physical devices)
   EXPO_PUBLIC_API_URL=http://your_computer_ip_address:5000/api
   EXPO_PUBLIC_SOCKET_URL=http://your_computer_ip_address:5000

   # Firebase Client Config (for web auth fallback / notification config)
   EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
   EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

3. **Firebase Native Config (Android/iOS)**:
   - Place your custom `google-services.json` inside the root of this directory to enable native push notifications and Google authentication on Android.
   - For iOS, configure the bundle identifier matching your Firebase console profile inside `app.json`.

4. **Run the Application**:
   - Start Metro Bundler:
     ```bash
     npx expo start -c
     ```
   - Press `a` for Android Emulator, `i` for iOS Simulator, or scan the QR code using the Expo Go application on a physical device.
