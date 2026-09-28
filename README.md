# PickMi Driver Mobile App (iOS & Android)

A mobile-only application built with **React Native + Expo**, engineered specifically for **PickMi Drivers**. 

---

## 📱 Mobile Architecture & Design

- **Pure Mobile Experience**: Optimized exclusively for iOS and Android mobile screens with safe area handling, large driver touch targets (minimum 52px height), and high contrast hierarchy.
- **Brand Identity**: PickMi brand color `#0063F7`, clean white/neutral backgrounds, rounded 16–20px cards, and visual status badges.
- **Free Map Integration**: Embedded interactive OpenStreetMap (Leaflet) with driver GPS marker, pulsing radar indicator, route polyline (pickup → drop), and floating GPS recenter controls. Zero paid API keys required.
- **Supabase-Ready Database Structure**: Fully typed TypeScript models representing the 8 core entities:
  1. `drivers`
  2. `vehicles`
  3. `trips`
  4. `trip_requests`
  5. `trip_status_history`
  6. `wallets`
  7. `wallet_transactions`
  8. `driver_documents`

---

## 🚀 How to Run and Preview

### Option 1: Physical Mobile Device (Expo Go)
1. Install **Expo Go** from the iOS App Store or Google Play Store.
2. In your terminal, run:
   ```bash
   npm start
   ```
3. Scan the terminal QR code with your phone camera (iOS) or the Expo Go app (Android).

### Option 2: Mobile Emulator / Simulator
- **iOS Simulator (macOS)**: Press `i` in the terminal or run `npm run ios`.
- **Android Emulator**: Press `a` in the terminal or run `npm run android`.

### Option 3: Local Mobile Web Preview
- Open `http://localhost:8081` (or `http://localhost:8085`) in any mobile browser or desktop browser (includes an authentic iPhone 16 mobile shell wrapper).

---

## 🔄 End-to-End Workflow Testing Guide

The prototype allows testing the complete lifecycle without external API dependencies:

```text
[Splash] → [Login: +91 98765 43210] → [OTP: 123456] → [Home Dashboard]
      ↓
[Go Online] → [New Trips: Available] → [Trip Details & Map Preview]
      ↓
[Request Trip] → [Confirm Dialog] → [Status: REQUESTED]
      ↓
[Simulate Assignment] (Dev Tools / Auto-assign in 4s) → [Status: ASSIGNED]
      ↓
[In-App Notification Banner] → [Accept Trip]
      ↓
[Active Trip: On the Way] → Tap "I've Arrived"
      ↓
[Active Trip: Arrived at Pickup] → Tap "Start Trip"
      ↓
[Active Trip: Trip Started] → Tap "Complete Trip"
      ↓
[Trip Completed Screen] (Receipt, ₹1,499 Fare, Timestamp) → Tap "Back to Home"
      ↓
[Wallet Updated] (+₹1,499 added to Balance, Today's Earnings, and Recent Transactions)
      ↓
[Profile & Documents] (View Licence, RC, Insurance, Vehicle Details, Settings, Logout)
```

### 🛠 Prototype Dev Controls
A floating **DEV TOOLS** button is available on the screen:
- **Simulate Admin Assignment**: Instantly converts any requested/available trip into an assigned trip.
- **Credit +₹1,000 Bonus**: Simulates instant wallet incentive top-up.
- **Toggle Online/Offline**: Quick status flip.
- **Reset Demo Trips**: Restores all Bangalore mock trips to initial prototype state.

---

## 🔐 Credentials & Dummy Data for Testing
- **Driver**: Karthik P (`#DRV-8942`)
- **Vehicle**: Maruti Suzuki Dzire (`KA 05 MN 4821`)
- **Mobile Number**: `+91 98765 43210`
- **Dummy OTP**: `123456` (1-tap autofill button included on screen)
- **Initial Wallet Balance**: `₹2,450.00`
