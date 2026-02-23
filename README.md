# Dating App Prototype

A mini dating app prototype built with React, Firebase Firestore, and Tailwind CSS. Features mutual-like matching, intelligent date scheduling via an interval-overlap algorithm, and fully real-time UI powered by Firestore listeners.

---

## Features

- **User Registration** — Lightweight pseudo-auth using `localStorage` (no Firebase Auth required)
- **Discover Page** — Browse other users and send likes
- **Mutual Matching** — A match is created only when two users like each other
- **Match Notifications** — Real-time modal popup with auto-dismiss on mutual match
- **Matches Page** — Live list of all your mutual matches, updated in real-time
- **Schedule a Date** — Both users pick time slots; the app automatically finds the **first overlapping slot**
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

The project is organized into **clearly separated layers**, each with a single responsibility:

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
- **Data layer first** — `firebase/firestore.js` is the single source of truth for all database operations. No page talks to Firestore directly.
- **Logic layer second** — Custom hooks (`useMatches`, `useAvailability`) encapsulate subscriptions and side effects so pages stay clean.
- **UI layer last** — Pages and components only receive data and call functions; they contain no business logic.
- **Pure utility** — `scheduler.js` is a zero-dependency pure function that can be tested in isolation.

---

## Data Storage

This app uses **two storage mechanisms**:

### 1. Firebase Firestore (primary database)

All persistent user data, likes, matches, and availability are stored in **Cloud Firestore** — a NoSQL document database. It was chosen because it supports **real-time listeners** out of the box, which is the core requirement of this app.

The Firestore schema has 4 collections:

```
/users/{uid}
  uid, name, age, gender, bio, email, createdAt

/likes/{autoId}
  fromUid, toUid, timestamp

/matches/{matchId}
  userIds: [uid1, uid2]
  matchId: "self-reference"
  createdAt

/availabilities/{uid_matchId}
  uid, matchId
  slots: [{ start: ISO, end: ISO }, ...]
```

**Key design decisions:**
- **Deterministic document IDs** for availabilities (`uid_matchId`) enable **upsert** with `setDoc(..., { merge: true })` — users can re-submit without creating duplicate records
- **`array-contains` queries** on `userIds` field to find all matches belonging to a specific user
- **`serverTimestamp()`** for reliable timestamps independent of the client's local clock

### 2. localStorage (session persistence)

Because this prototype does not use Firebase Authentication, the user's **generated UID is stored in `localStorage`** as a lightweight session token.

```js
// On register: save session
localStorage.setItem('datingAppUid', uid);

// On page load: restore session (UserContext.jsx)
const storedUid = localStorage.getItem('datingAppUid');
if (storedUid) fetchUserFromFirestore(storedUid);
```

This means the user stays "logged in" across page refreshes without needing a real auth system. It is intentionally simple for a prototype.

---

## How the Match Logic Works

Matching follows a **mutual-like model**: a match only exists when **both users have liked each other**.

When a user clicks "Like" on a profile card, `sendLike()` in `firestore.js` runs three chained steps:

```
sendLike(fromUid, toUid)
  │
  ├── Step 1: Check for duplicate like
  │     → if like already exists, abort early
  │
  ├── Step 2: Write like document to /likes
  │     → { fromUid, toUid, timestamp }
  │
  └── Step 3: Check for mutual like
        → Query /likes where fromUid == toUid AND toUid == fromUid
        │
        ├── Mutual like found?
        │     → YES: createMatch(uid1, uid2)
        │             → Write to /matches: { userIds: [uid1, uid2], createdAt }
        │             → Return { matched: true, matchId }
        │
        └── NO: Return { matched: false }
```

If a match is created, the `DiscoverPage` receives `{ matched: true }` and triggers the `MatchNotification` modal. This modal auto-dismisses after 5 seconds using `setTimeout` with proper cleanup in `useEffect` to avoid memory leaks.

On the **Matches Page**, a Firestore `onSnapshot` listener continuously watches the `/matches` collection using `array-contains` on `userIds`. This means the matches list **updates live** for both users the moment a match is created — no page refresh needed.

---

## How the Overlapping Slot Algorithm Works

Date scheduling uses a **pure interval overlap detection algorithm** in `utils/scheduler.js`.

### Input
Two arrays of time slots, one per user. Each slot is a 1-hour block represented as ISO 8601 timestamps:
```js
[{ start: "2026-02-24T08:00:00.000Z", end: "2026-02-24T09:00:00.000Z" }, ...]
```

### Algorithm

```js
export function findFirstCommonSlot(user1Slots, user2Slots) {
  for (const slot1 of user1Slots) {
    const start1 = new Date(slot1.start).getTime(); // convert to ms
    const end1   = new Date(slot1.end).getTime();

    for (const slot2 of user2Slots) {
      const start2 = new Date(slot2.start).getTime();
      const end2   = new Date(slot2.end).getTime();

      const overlapStart = Math.max(start1, start2); // later of the two starts
      const overlapEnd   = Math.min(end1, end2);     // earlier of the two ends

      if (overlapStart < overlapEnd) {
        // A real overlap exists — return it immediately
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

- `Math.max(start1, start2)` → the **later** of the two start times. An overlap can only begin after **both** users are available.
- `Math.min(end1, end2)` → the **earlier** of the two end times. An overlap must end before **either** user becomes unavailable.
- If `overlapStart < overlapEnd`, a genuine overlap window exists.

**Time complexity: O(n × m)** where n and m are the number of slots each user submitted.

The result is displayed as a **live green banner** on the Schedule page, and it appears in real-time on **both users' screens** the moment either of them submits or updates their availability — powered by the `onSnapshot` listener in `useAvailability.js`.

---

## If I Had More Time

Given more time, I would improve the following areas:

1. **Real Firebase Authentication** — Replace the `localStorage` pseudo-auth with Firebase Auth (Google sign-in or email/password). This would add proper session management, security rules enforcement, and multi-device support.

2. **Firestore Security Rules** — The current prototype runs in "test mode" (open read/write). In production, I would add rules so users can only read/write their own data and can only create matches through verified mutual likes.

3. **Profile Photos** — Integrate Firebase Storage so users can upload a profile picture during registration. User cards would display real photos instead of an avatar placeholder.

4. **Smarter Scheduling** — The current algorithm returns the **first** overlap. I would enhance it to return **all** overlapping slots ranked by earliest date, and let both users vote on their preferred time.

5. **Better UX on Mobile** — The `TimeSlotPicker` grid is scroll-heavy on small screens. I would redesign it as a swipeable day-by-day view for a more native mobile feel.

6. **Notification System** — Add push notifications (via Firebase Cloud Messaging) so users are alerted of a new match or when a date slot is confirmed, even when the app is in the background.

---

## Proposed Features

| # | Feature | Why |
|---|---|---|
| 1 | **Compatibility Score** | Show a match percentage on each profile card based on shared interests or age proximity |
| 2 | **Chat After Matching** | Unlock a real-time chat room between matched users using Firestore |
| 3 | **Date Confirmation** | A "Confirm Date" button that locks the agreed slot and sends a reminder to both users |

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
