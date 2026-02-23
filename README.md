# Dating App Prototype

A mini dating app prototype inspired by the **Breeze** model. Built with React, Firebase Firestore, and Tailwind CSS. Features mutual-like matching, intelligent date scheduling via an interval-overlap algorithm, and fully real-time UI powered by Firestore listeners.

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

## Project Structure

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

## Firestore Data Model

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
- **Deterministic document IDs** for availabilities (`uid_matchId`) enable **upsert** with `setDoc(..., { merge: true })` — no duplicate records per user per match
- **`array-contains` queries** to find all matches belonging to a user
- **`serverTimestamp()`** for reliable server-side timestamps independent of client clocks

---

## How the Core Logic Works

### Mutual Matching

```
sendLike(fromUid, toUid)
  → 1. Check for duplicate likes
  → 2. Write like doc to /likes
  → 3. Check if toUid already liked fromUid
       → YES: createMatch(uid1, uid2) → write to /matches
       → NO:  return { matched: false }
```

### Scheduling Algorithm (`scheduler.js`)

A pure interval overlap detection function using Unix timestamps:

```js
const overlapStart = Math.max(start1, start2); 
const overlapEnd   = Math.min(end1, end2);     
if (overlapStart < overlapEnd) → OVERLAP FOUND ✓
```

Returns the **first** overlapping time slot between two users' availability lists. Time complexity: **O(n × m)**.

### Real-time Updates

Both `MatchesPage` and `SchedulePage` use Firestore `onSnapshot` listeners via custom hooks. This means the UI updates **instantly across all connected clients** without any polling or page refresh.

```js
// Pattern used in all real-time hooks
useEffect(() => {
  const unsubscribe = listenForMatches(uid, setMatches);
  return () => unsubscribe(); // cleanup on unmount
}, [uid]);
```

---

## Key Techniques

| Concept | Where Used |
|---|---|
| **Custom Hooks** | `useMatches`, `useAvailability` — encapsulate Firestore subscriptions |
| **React Context** | `UserContext` — app-wide user session without Redux |
| **Real-time Firestore** (`onSnapshot`) | Matches list + availability updates live |
| **Listener Cleanup** | All `useEffect` hooks return `unsubscribe()` to prevent memory leaks |
| **`useCallback` memoization** | `DiscoverPage` — prevents unnecessary re-renders of `UserCard` |
| **Pseudo-auth with `localStorage`** | UID stored in `localStorage` as a lightweight session token |
| **Controlled Form** | Single state object + computed key pattern in `RegisterPage` |
| **Interval Overlap Algorithm** | `max(start1,start2) < min(end1,end2)` for schedule matching |
| **`Promise.all`** | `MatchesPage` — parallel fetching of partner profiles (no waterfall) |
| **Protected Routes** | `ProtectedRoute` component wrapping all pages except `/register` |
| **`date-fns`** | Time slot generation, formatting, and date arithmetic in `TimeSlotPicker` |
| **Upsert pattern** | `setDoc(..., { merge: true })` allows re-submitting availability without duplicates |

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
