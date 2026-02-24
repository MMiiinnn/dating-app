# Dating App Prototype

A mini dating app prototype inspired by Breeze, built with React, Firebase Firestore, and Tailwind CSS. Features mutual-like matching, intelligent date scheduling via an interval-overlap algorithm, and a fully real-time UI powered by Firestore listeners.

**Live Demo:** [View App](http://dating-app-eefr.vercel.app/) · **Repository:** [GitHub](https://github.com/MMiiinnn/dating-app)

---

## Why I Built It This Way

Most dating apps stop at the match. Users then text back and forth to pick a time, and many conversations die before a date happens. This prototype solves that by automating the entire path from **match to scheduled date** — mutual likes trigger an instant match, both users pick availability, and the system finds the first overlapping slot automatically.

Every technical choice was made to keep the core loop tight: **Register → Like → Match → Schedule → Date.**

---

## Features

- **User Registration** — Lightweight pseudo-auth using `localStorage` (no Firebase Auth required)
- **Discover Page** — Browse other users, send or cancel likes
- **Mutual Matching** — A match is created only when two users like each other
- **Unlike / Unmatch** — Users can cancel a like, which also removes the match if one existed
- **Match Notifications** — Real-time modal popup with auto-dismiss on mutual match
- **Matches Page** — Live list of all your mutual matches, updated in real-time
- **Schedule a Date** — Both users pick time slots; the app finds the **first overlapping slot** automatically
- **Protected Routes** — All pages except registration require an active session

---

## Tech Stack

| Layer | Technology | Role |
|---|---|---|
| **UI Framework** | React 19 + Vite 7 | Component rendering, fast dev server |
| **Routing** | React Router DOM v7 | Client-side navigation, protected routes |
| **Styling** | Tailwind CSS v3 | Utility-first CSS, responsive layout |
| **Backend / DB** | Firebase Firestore v12 | NoSQL database + real-time listeners |
| **Date Logic** | `date-fns` | Date formatting and time slot generation |
| **Global State** | React Context API | Current user shared across all pages |
| **Local State** | `useState` / `useEffect` | Per-component UI state |

---

## System Architecture

The project is organized into clearly separated layers, each with a single responsibility:

```
src/
├── main.jsx
├── App.jsx
├── context/
│   └── UserContext.jsx
├── firebase/
│   ├── config.js
│   └── firestore.js
├── hooks/
│   ├── useMatches.js
│   └── useAvailability.js
├── utils/
│   └── scheduler.js
├── components/
│   ├── Navbar.jsx
│   ├── UserCard.jsx
│   ├── MatchNotification.jsx
│   └── TimeSlotPicker.jsx
└── pages/
    ├── RegisterPage.jsx
    ├── DiscoverPage.jsx
    ├── MatchesPage.jsx
    └── SchedulePage.jsx
```

**Architecture principles applied:**
- **Data layer first** — `firestore.js` is the single source of truth for all database operations. No page talks to Firestore directly.
- **Logic layer second** — Custom hooks (`useMatches`, `useAvailability`) encapsulate subscriptions and side effects so pages stay clean.
- **UI layer last** — Pages and components only receive data and call functions; they contain no business logic.
- **Pure utility** — `scheduler.js` is a zero-dependency pure function that can be tested in isolation.

---

## Data Storage

This app uses two storage mechanisms:

### 1. Firebase Firestore (primary database)

All persistent data is stored in Cloud Firestore, chosen specifically because it supports **real-time listeners** (`onSnapshot`) which power live updates for matches and scheduling.

```
/users/{uid}
  uid, name, age, gender, bio, email, createdAt

/likes/{autoId}
  fromUid, toUid, timestamp

/matches/{matchId}
  userIds: [uid1, uid2], matchId, createdAt

/availabilities/{uid_matchId}
  uid, matchId, slots: [{ start: ISO, end: ISO }, ...]
```

**Key design decisions:**
- **Deterministic document IDs** for availabilities (`uid_matchId`) enable upsert with `setDoc` — users can re-submit without creating duplicates.
- **`array-contains` queries** on `userIds` to efficiently find all matches for a user.
- **`serverTimestamp()`** for reliable timestamps independent of client clocks.

### 2. localStorage (session persistence)

The user's generated UID is stored in `localStorage` as a lightweight session token. On page load, `UserContext` checks for this UID and restores the session from Firestore. If the UID no longer exists in the database (e.g. manually deleted), the stale token is cleaned up automatically.

---

## How the Match Logic Works

Matching follows a **mutual-like model**: a match only exists when both users have liked each other.

When a user clicks "Like", `sendLike()` runs three chained steps:

```
sendLike(fromUid, toUid)
  │
  ├── Step 1: Check for duplicate like
  │     → If already liked, abort early (idempotent)
  │
  ├── Step 2: Write like document to /likes
  │     → { fromUid, toUid, timestamp }
  │
  └── Step 3: Check for mutual like
        → Query: does toUid also like fromUid?
        │
        ├── YES → createMatch(uid1, uid2)
        │         → Check for existing match first (idempotent)
        │         → Write to /matches: { userIds, createdAt }
        │         → Return { matched: true, matchId }
        │
        └── NO  → Return { matched: false }
```

**Unlike flow:** Users can also cancel a like via `cancelLike()`, which deletes the like document and, if a mutual match existed, removes the match document too. The partner's Matches page updates in real-time via `onSnapshot`.

---

## How the Overlapping Slot Algorithm Works

This is the core scheduling logic. It lives in `utils/scheduler.js` as a **pure function** with zero dependencies.

### The Problem

After matching, both users independently select time slots they are free over the next 3 weeks. The system must find the **first time window where both are available**.

### Input

Two arrays of time slots (one per user). Each slot is a 1-hour block as ISO 8601 timestamps:
```js
[{ start: "2026-02-24T08:00:00.000Z", end: "2026-02-24T09:00:00.000Z" }, ...]
```

### The Algorithm

```js
export function findFirstCommonSlot(user1Slots, user2Slots) {
  if (!user1Slots?.length || !user2Slots?.length) return null;

  for (const slot1 of user1Slots) {
    const start1 = new Date(slot1.start).getTime();
    const end1   = new Date(slot1.end).getTime();

    for (const slot2 of user2Slots) {
      const start2 = new Date(slot2.start).getTime();
      const end2   = new Date(slot2.end).getTime();

      const overlapStart = Math.max(start1, start2);
      const overlapEnd   = Math.min(end1, end2);

      if (overlapStart < overlapEnd) {
        return {
          start: new Date(overlapStart).toISOString(),
          end:   new Date(overlapEnd).toISOString(),
        };
      }
    }
  }
  return null;
}
```

### Why This Formula Works

The overlap detection relies on a well-known interval intersection formula:

- `Math.max(start1, start2)` → the **later** of the two start times. An overlap can only begin after **both** users are available.
- `Math.min(end1, end2)` → the **earlier** of the two end times. An overlap must end before **either** user becomes unavailable.
- If `overlapStart < overlapEnd`, a genuine overlap window exists.
- If no overlap is found across all slot pairs, the function returns `null`.

**Time complexity:** O(n × m), where n and m are the number of slots each user submitted.

### Real-Time Display

The result appears as a live green banner on the Schedule page. It updates instantly on **both users' screens** the moment either submits or changes their availability, powered by the `onSnapshot` listener in `useAvailability.js`. When there is no overlap, a clear "No overlapping slots found" message is shown instead.

---

## Edge Cases Handled

| Scenario | How It Is Handled |
|---|---|
| **User likes the same person twice** | `getLike()` checks before writing — duplicate is silently prevented |
| **Match already exists between two users** | `getExistingMatch()` returns the existing match ID instead of creating a new one |
| **User unlikes someone they matched with** | `cancelLike()` deletes both the like and the match document |
| **Page refresh after liking** | `getLikedUidsByUser()` fetches all sent likes on load — Like buttons restore to correct state |
| **Empty slot arrays or null input** | `findFirstCommonSlot` checks `!user1Slots?.length` before iterating — returns `null` safely |
| **Both users submitted but no overlap** | UI shows a clear amber warning: "No overlapping slots found. Try updating your availability." |
| **Only one user has submitted availability** | Status cards show "Waiting..." for the partner; no algorithm runs until both have submitted |
| **Stale session (UID in localStorage but deleted from DB)** | `UserContext` detects the missing user document and clears `localStorage` — forces re-registration |
| **Rapid button clicks** | Loading state guards (`liking`, `unliking`, `submitting`) prevent duplicate operations |
| **Match notification memory leak** | `setTimeout` auto-dismiss is cleaned up with `clearTimeout` in `useEffect` return |
| **Age out of range** | Registration validates age 18–100 with `parseInt` + boundary check |
| **Required fields missing** | Form validation rejects empty name, email, or age before any Firestore write |

---

## AI-Assisted Development

AI tools were used throughout the development process as a productivity multiplier:

- **Architecture Design** — AI helped plan the separation of concerns (data layer → hooks → UI) and identify the optimal Firestore schema patterns (deterministic IDs, `array-contains` queries).
- **Algorithm Validation** — The interval overlap algorithm was validated and stress-tested with AI to confirm correctness across edge cases (adjacent slots, identical slots, partial overlaps).
- **Code Documentation** — JSDoc annotations across `firestore.js` and `scheduler.js` were generated and refined with AI assistance to maintain consistent documentation standards.
- **Edge Case Discovery** — AI identified several edge cases that were then implemented: stale session cleanup, duplicate like prevention, and match idempotency guards.
- **Performance Optimization** — `Promise.all` for parallel data fetching, `useCallback` memoization to prevent unnecessary re-renders, and `Set` data structure for O(1) like-status lookups were implemented based on AI recommendations.

---

## If I Had More Time

1. **Real Firebase Authentication** — Replace `localStorage` pseudo-auth with Firebase Auth (Google sign-in or email/password) for proper session management and security rules enforcement.

2. **Firestore Security Rules** — The current prototype runs in test mode. Production rules would restrict users to read/write only their own data.

3. **Profile Photos** — Integrate Firebase Storage for user-uploaded profile pictures.

4. **Smarter Scheduling** — Return all overlapping slots ranked by date, and let both users vote on their preferred time.

5. **Better Mobile UX** — Redesign the `TimeSlotPicker` as a swipeable day-by-day view for smaller screens.

6. **Push Notifications** — Firebase Cloud Messaging alerts for new matches and confirmed date slots.

---

## Proposed Features

| # | Feature | Why |
|---|---|---|
| 1 | **Compatibility Score** | Show a match percentage based on shared interests or age proximity — helps users prioritize who to like |
| 2 | **Chat After Matching** | Unlock a real-time chat room between matched users — keeps engagement inside the app |
| 3 | **Date Confirmation** | A "Confirm Date" button that locks the agreed slot and sends a reminder — closes the loop on scheduling |

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Firebase](https://console.firebase.google.com/) project with **Firestore** enabled

### 1. Clone the Repository

```bash
git clone https://github.com/MMiiinnn/dating-app.git
cd dating-app
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file at the project root:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

> Get these values from **Firebase Console → Project Settings → Your Apps**.

### 4. Enable Firestore

In the Firebase Console:
1. Go to **Firestore Database** → **Create database**
2. Choose **Start in test mode** for prototyping

### 5. Run the Dev Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |

---

## License

This project is open source and available under the [MIT License](LICENSE).
