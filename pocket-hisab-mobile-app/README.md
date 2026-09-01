# PocketHisab Mobile App

A React Native (Expo Router + TypeScript) client for the PocketHisab personal-finance API —
banking-app aesthetic, Firebase Authentication, and an offline-first data layer built on
TanStack Query.

## Stack

- **Framework**: Expo SDK 54 (React Native 0.81, React 19), file-based routing via
  `expo-router`
- **Auth**: Firebase Authentication (Email/Password), via the `firebase` JS SDK
- **Data layer**: TanStack Query, with its cache persisted to `AsyncStorage` and connectivity
  wired to `@react-native-community/netinfo` — writes fired while offline pause automatically
  and resume the moment connectivity returns (see `src/query/queryClient.ts`)
- **Bottom sheet**: `@gorhom/bottom-sheet` (the Add/Spend Money flow)

## Project layout

```
app/                        # expo-router screens (file-based routing)
├── (auth)/                  # login, register, forgot-password — shown when signed out
├── (tabs)/                   # Home, History, Debts, Savings, Settings — shown when signed in
└── _layout.tsx                # root: QueryProvider > AuthProvider > BottomSheetModalProvider
src/
├── api/                      # typed fetch client + one endpoint file per backend resource
├── auth/                      # Firebase init, AuthProvider (context)
├── query/                      # QueryClient/persister setup + one hook file per resource
├── components/
│   ├── ui/                     # design-system primitives (Button, Card, Chip, ...)
│   ├── home/                    # Home-screen-specific components
│   └── transactions/             # Add/Spend sheet, numeric keypad, category picker
├── types/api.ts                 # TS mirrors of the backend's response shapes
└── utils/                        # currency/date formatting, Firebase error messages
```

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

`.env` already exists with the Neon/Firebase client config pre-filled. Two things to check:

- **`EXPO_PUBLIC_API_BASE_URL`** — must point somewhere your phone/emulator can actually
  reach the backend (see the comments in `.env.example` for the right value per platform:
  `localhost` for web, `10.0.2.2` for the Android emulator, your machine's LAN IP for a
  physical device over Expo Go).

### 3. Make sure the backend is running

The app needs `pocket-hisab` (the Express API) running and reachable at
`EXPO_PUBLIC_API_BASE_URL`, with its own Firebase Admin credentials configured — see
`../pocket-hisab/README.md`.

### 4. Start the app

```bash
npx expo start
```

Then press `a` (Android emulator), `w` (web), or scan the QR code with Expo Go on a physical
device (same Wi-Fi network as your dev machine).

## What's built (Phase 1)

- Firebase auth: register, login, forgot-password (Email/Password only)
- Home: Total Balance (live, gradient card), Add Money / Spend Money quick actions,
  Today/Month/Year stat cards, Recent Activity
- Add/Spend Money: bottom-sheet with a calculator-style numeric keypad, category chips
  (expense only, with an inline "create category" flow), and a "New balance: X → Confirm"
  preview before submitting
- History: segmented Day/Month/Year filter, search, grouped by date ("Today", "Yesterday",
  "28 Aug", ...)
- Settings: profile (name/currency) editing, log out
- Offline-first data layer: query cache persisted to disk, connectivity-aware pause/resume
  for writes, optimistic balance/activity updates on transaction create

**Debts, Reminders, and Savings Pots are placeholder tabs** — full screens for those are
Phase 2, per the agreed build plan.

## Verified so far

- `npx tsc --noEmit` — clean, no type errors
- `npx expo lint` — clean
- `npx expo export --platform android` — bundles successfully (1653 modules, no resolution
  errors)

Not yet verified: an actual on-device/emulator run (needs a connected device or emulator,
which wasn't available in the environment these files were built in) — please run
`npx expo start` and click through the login → Add Money → History flow to confirm it
matches the design before I continue to Phase 2.

## Known setup gotcha

`metro.config.js` disables `unstable_enablePackageExports`. This is required for the
`firebase` JS SDK to resolve correctly on React Native — without it, Firebase Auth throws
"Component auth has not been registered yet" at runtime. Don't remove this unless you've
confirmed Firebase still resolves correctly without it (a known, actively-tracked upstream
issue between Firebase's package exports and Metro).
