# LucidLab Designer — Frontend Screen Specification

> **For:** Frontend Developer  
> **Stack:** React + TypeScript, Chakra UI, React Router, Reactfire (Firebase)  
> **Scope:** All screens EXCEPT the experiment editor (`/experiment/:expName` and its sub-routes — those stay unchanged)

---

## Current State

The app currently only has two routes:
- `/experiment/:expName` → `SceneManager` component
- `/experiment/:expName/scene/:sceneName` → `Scene` component

**There is no authentication, no dashboard, no classroom management, and no evaluation UI.** All of those need to be built.

---

## Route Map

```
/                           → Redirect to /login (if unauthenticated) or /dashboard (if authenticated)
/login                      → Login Page
/register                   → Register Page
/dashboard                  → Dashboard Home (classroom grid + recent experiments)
/classrooms/:classroomId    → Classroom Detail Page
/experiments                → My Experiments List Page
/evaluation/:classroomId/:experimentId → Evaluation Page (student submissions)
/experiment/:expName        → [EXISTING — DO NOT TOUCH]
/experiment/:expName/scene/:sceneName → [EXISTING — DO NOT TOUCH]
```

---

## Authentication Guard

Before building any screens, implement a route guard:

- If user is **not authenticated** → redirect all routes (except `/login` and `/register`) to `/login`
- If user is **authenticated** → redirect `/login` and `/register` to `/dashboard`
- The auth state comes from `firebase/auth` via `onAuthStateChanged`
- Store the current user in a React context (`AuthContext`) accessible throughout the app

---

## Screen-by-Screen Specification

---

### 1. Login Page

**Route:** `/login`

**Purpose:** Authenticate existing instructors.

**Layout:**
- Centered card on a clean background
- LucidLab logo at the top
- Login form

**Elements on screen:**
| Element | Type | Details |
|---|---|---|
| LucidLab Logo | Image | Centered at top of card |
| "LucidLab Designer" | Heading (h1) | Below logo |
| Email field | Text input | Required, email validation |
| Password field | Password input | Required, min 6 characters |
| "Login" button | Primary button | Triggers `signInWithEmailAndPassword` |
| "Sign in with Google" button | Secondary button | Triggers `signInWithPopup(GoogleAuthProvider)` |
| "Don't have an account? Register" | Link | Navigates to `/register` |
| Error message area | Alert/toast | Shows auth errors (wrong password, user not found, etc.) |

**Functionality:**
1. User enters email + password
2. On submit → call `signInWithEmailAndPassword(auth, email, password)`
3. On success → redirect to `/dashboard`
4. On error → show error message below the form (e.g., "Invalid email or password")
5. Google SSO button → call `signInWithPopup(auth, new GoogleAuthProvider())`
6. If Google SSO user doesn't have a Firestore `users` doc yet → create one with role `"instructor"` and redirect to `/dashboard`

**Loading states:**
- Disable button + show spinner while auth request is in progress
- Show a full-page skeleton while checking initial auth state (`onAuthStateChanged`)

---

### 2. Register Page

**Route:** `/register`

**Purpose:** Create a new instructor account.

**Layout:**
- Same centered card layout as Login page

**Elements on screen:**
| Element | Type | Details |
|---|---|---|
| LucidLab Logo | Image | Centered at top |
| "Create Account" | Heading (h1) | |
| Full Name field | Text input | Required |
| Email field | Text input | Required, email validation |
| Password field | Password input | Required, min 6 characters |
| Confirm Password field | Password input | Must match password |
| Institution field | Text input | Optional |
| "Register" button | Primary button | Creates account |
| "Already have an account? Login" | Link | Navigates to `/login` |
| Error message area | Alert/toast | Shows registration errors |

**Functionality:**
1. Validate that password and confirm password match
2. On submit → call `createUserWithEmailAndPassword(auth, email, password)`
3. On success → create Firestore document in `users` collection:
   ```json
   {
     "uid": "<firebase-auth-uid>",
     "email": "<email>",
     "displayName": "<full name>",
     "role": "instructor",
     "institution": "<institution or empty>",
     "classroomIds": [],
     "createdAt": serverTimestamp(),
     "updatedAt": serverTimestamp()
   }
   ```
4. Redirect to `/dashboard`
5. On error → show message (e.g., "Email already in use")

---

### 3. Dashboard Home

**Route:** `/dashboard`

**Purpose:** Main landing page after login. Shows the instructor's classrooms and recent experiments at a glance.

**Layout:**
- **Top bar** (persistent across all authenticated pages)
- **Main content area** with two sections

**Top Bar (appears on ALL authenticated pages):**
| Element | Type | Details |
|---|---|---|
| "LucidLab Designer" text/logo | Link | Clicking it navigates to `/dashboard` |
| Navigation links | Links/tabs | "Dashboard", "Experiments" |
| Notification bell icon | Icon button | Future use (can be placeholder for now) |
| User avatar + name | Menu button | Dropdown with: Profile, Logout |
| "Logout" option | Menu item | Calls `signOut(auth)` → redirect to `/login` |

**Section 1 — My Classrooms:**
| Element | Type | Details |
|---|---|---|
| "My Classrooms" heading | h2 | Section title |
| "+ New Classroom" button | Primary button | Opens Create Classroom Modal |
| Classroom cards | Grid of cards | One card per classroom |

**Each Classroom Card shows:**
| Element | Details |
|---|---|
| Classroom name | e.g., "Chemistry Grade 10-A" |
| Subject | e.g., "Chemistry" |
| Student count | e.g., "32 students" |
| Experiment count | e.g., "4 experiments" |
| Join code | e.g., "CHEM-10A" (with copy button) |
| Click action | Navigates to `/classrooms/:classroomId` |

**Section 2 — Recent Experiments:**
| Element | Type | Details |
|---|---|---|
| "Recent Experiments" heading | h2 | Section title |
| Experiment list/table | Table or card list | Shows last 5–10 experiments |

**Each Experiment row shows:**
| Element | Details |
|---|---|
| Experiment title | e.g., "Acid-Base Neutralization" |
| Category | e.g., "Chemistry" |
| Status badge | "Draft" (yellow) or "Published" (green) |
| Experiment code | e.g., "CHEM-042" (only if published) |
| Created date | e.g., "Mar 5, 2026" |
| Click action | Navigates to `/experiment/:expName` (existing route) |

**Functionality:**
1. On page load → query Firestore `classrooms` where `instructorId == currentUser.uid` and `archived == false`
2. On page load → query Firestore `experiments` where `instructorId == currentUser.uid`, order by `updatedAt desc`, limit 10
3. "+ New Classroom" button opens the **Create Classroom Modal** (see below)
4. Clicking a classroom card navigates to `/classrooms/:classroomId`
5. Clicking an experiment row navigates to `/experiment/:expName`

**Empty states:**
- If no classrooms: show illustration + "Create your first classroom" CTA button
- If no experiments: show "No experiments yet" text

---

### 4. Create Classroom Modal

**Trigger:** "+ New Classroom" button on Dashboard

**Type:** Modal dialog (overlay, not a separate page)

**Elements on screen:**
| Element | Type | Details |
|---|---|---|
| "Create Classroom" title | Heading | Modal title |
| Classroom Name | Text input | Required. e.g., "Chemistry Grade 10-A" |
| Subject | Dropdown select | Options: Chemistry, Physics, Biology, Environmental Science, General Science, Other |
| Description | Textarea | Optional. Brief description |
| "Cancel" button | Secondary button | Closes modal |
| "Create" button | Primary button | Creates the classroom |

**Functionality:**
1. On "Create" → generate a 6-character join code (uppercase letters + digits, excluding ambiguous chars O/0/I/1/L). Generate on client side, check uniqueness by querying Firestore `classrooms` where `joinCode == generatedCode`. If exists, regenerate.
2. Create Firestore document in `classrooms` collection:
   ```json
   {
     "name": "<name>",
     "subject": "<subject>",
     "description": "<description>",
     "instructorId": "<currentUser.uid>",
     "joinCode": "<generated-code>",
     "joinCodeActive": true,
     "studentCount": 0,
     "experimentIds": [],
     "archived": false,
     "createdAt": serverTimestamp(),
     "updatedAt": serverTimestamp()
   }
   ```
3. Also add the new `classroomId` to the instructor's `users` doc `classroomIds` array using `arrayUnion`
4. Close modal → the new classroom should appear in the grid (use Firestore real-time listener or re-fetch)

---

### 5. Classroom Detail Page

**Route:** `/classrooms/:classroomId`

**Purpose:** View and manage a single classroom — its students, join code, and assigned experiments.

**Layout:**
- Top bar (same as dashboard)
- Back button / breadcrumb: "Dashboard > Chemistry Grade 10-A"
- Three sections

**Section 1 — Classroom Header:**
| Element | Type | Details |
|---|---|---|
| Classroom name | Heading (h1) | e.g., "Chemistry Grade 10-A" |
| Subject badge | Tag/badge | e.g., "Chemistry" |
| Description | Text | The classroom description |
| "Edit" button | Icon button | Opens edit modal (same fields as create) |
| "Archive Classroom" button | Danger button | Sets `archived: true` → redirects to dashboard |

**Section 2 — Join Code:**
| Element | Type | Details |
|---|---|---|
| "Join Code" label | Label | |
| Join code display | Large monospaced text | e.g., "CHEM-10A" |
| "Copy" button | Icon button | Copies code to clipboard, shows toast "Copied!" |
| "Regenerate" button | Text button | Generates new code, updates Firestore, shows confirmation |
| "Deactivate" toggle | Switch | Sets `joinCodeActive` to false/true — when off, students can't join with this code |

**Section 3 — Tabs: "Students" and "Experiments"**

Use a **tab** component with two tabs:

#### Tab: Students

| Element | Type | Details |
|---|---|---|
| "Students (32)" heading | h3 | Shows count |
| Student list | Table or card list | One row per member |

**Each student row shows:**
| Element | Details |
|---|---|
| Student name | From `members` subcollection `displayName` |
| Email | From `members` subcollection `email` |
| Joined date | From `joinedAt` |
| Status badge | "Active" (green) or "Pending" (yellow) |
| "Remove" button | Red icon button — deletes from `members` subcollection, decrements `studentCount` |

**Functionality:**
- On load → query subcollection `classrooms/{classroomId}/members`
- "Remove" button → show confirmation dialog → on confirm: delete member doc, decrement `studentCount` in classroom doc, remove classroomId from student's `users` doc `classroomIds`

#### Tab: Experiments

| Element | Type | Details |
|---|---|---|
| "Experiments (4)" heading | h3 | Shows count |
| "+ Assign Experiment" button | Primary button | Opens Assign Experiment Modal |
| Experiment list | Card list | One card per assigned experiment |

**Each experiment card shows:**
| Element | Details |
|---|---|
| Experiment title | e.g., "Acid-Base Neutralization" |
| Category | e.g., "Chemistry" |
| Status | "Published" or "Draft" |
| Submission count | e.g., "28/32 submitted" (query `submissions` where `experimentId` and `classroomId`) |
| "View Submissions" button | Navigates to `/evaluation/:classroomId/:experimentId` |
| "Unassign" button | Removes experimentId from classroom's `experimentIds` array |
| "Open in Editor" link | Navigates to `/experiment/:expName` |

**Functionality:**
- On load → read the `experimentIds` array from the classroom doc, then fetch each experiment doc from `experiments` collection
- For submission counts → query `submissions` where `classroomId == this classroom` and `experimentId == this experiment` and count results

---

### 6. Assign Experiment Modal

**Trigger:** "+ Assign Experiment" button on Classroom Detail → Experiments tab

**Type:** Modal dialog

**Elements on screen:**
| Element | Type | Details |
|---|---|---|
| "Assign Experiment" title | Heading | |
| Searchable experiment list | List with checkboxes | Shows all instructor's published experiments NOT already assigned to this classroom |
| Search field | Text input | Filters the list by title |
| Each experiment row | Checkbox + title + category | |
| "Cancel" button | Secondary button | Closes modal |
| "Assign Selected" button | Primary button | Assigns selected experiments |

**Functionality:**
1. On open → query `experiments` where `instructorId == currentUser.uid` and `status == "published"`
2. Filter out experiments already in this classroom's `experimentIds`
3. On "Assign Selected" → for each selected experiment:
   - Add `classroomId` to that experiment's `classroomIds` using `arrayUnion`
   - Add `experimentId` to this classroom's `experimentIds` using `arrayUnion`
4. Close modal → refresh experiment list

---

### 7. My Experiments Page

**Route:** `/experiments`

**Purpose:** View all experiments created by this instructor, regardless of classroom.

**Layout:**
- Top bar (same)
- Page heading + create button
- Filter/sort controls
- Experiment grid

**Elements on screen:**
| Element | Type | Details |
|---|---|---|
| "My Experiments" heading | h1 | |
| "+ New Experiment" button | Primary button | Navigates to `/experiment/new` (creates new experiment, redirects to existing editor route) |
| Filter by status | Dropdown | All / Published / Draft |
| Filter by category | Dropdown | All / Chemistry / Physics / Biology |
| Sort by | Dropdown | Newest first / Oldest first / Name A-Z |
| Experiment cards | Grid of cards | |

**Each experiment card shows:**
| Element | Details |
|---|---|
| Thumbnail | Experiment thumbnail image (or placeholder icon based on category) |
| Title | e.g., "Acid-Base Neutralization" |
| Category badge | "Chemistry" / "Physics" / "Biology" |
| Status badge | "Draft" (yellow) / "Published" (green) |
| Experiment code | If published, show the code (e.g., "CHEM-042") |
| Assigned classrooms count | e.g., "Assigned to 2 classrooms" |
| Last updated | e.g., "2 hours ago" |
| Click action | Navigates to `/experiment/:expName` (existing editor route) |
| "⋮" overflow menu | Dropdown: "Delete", "Duplicate" |

**Functionality:**
1. On load → query `experiments` where `instructorId == currentUser.uid`, ordered by `updatedAt desc`
2. Filters and sort work by modifying the Firestore query or filtering client-side
3. "+ New Experiment" button:
   - Create a new experiment document in Firestore with status `"draft"` and a generated name (e.g., "Untitled Experiment")
   - Navigate to `/experiment/<newExpName>` (let the existing editor take over)
4. "Delete" in overflow menu → confirmation dialog → `deleteDoc` from experiments collection
5. "Duplicate" → copies the experiment doc with a new ID, title suffixed with "(copy)", status set to "draft"

**Empty state:**
- If no experiments: show illustration + "Create your first experiment" CTA

---

### 8. Evaluation Page (Student Submissions)

**Route:** `/evaluation/:classroomId/:experimentId`

**Purpose:** View all student submissions for a specific experiment in a specific classroom and grade them.

**Layout:**
- Top bar (same)
- Breadcrumb: "Dashboard > Chemistry Grade 10-A > Acid-Base Neutralization > Submissions"
- Two-panel layout: submission list on left, detail on right

**Left Panel — Submission List:**
| Element | Type | Details |
|---|---|---|
| "Submissions (28/32)" heading | h2 | Count of submitted vs total members |
| Filter tabs | Tab bar | "All", "Pending", "Graded" |
| Submission list | Scrollable list | One row per submission |

**Each submission row shows:**
| Element | Details |
|---|---|
| Student name | e.g., "Ahmed Ali" |
| Submitted date/time | e.g., "Mar 5, 2:30 PM" |
| Status badge | "Pending" (orange) / "Correct" (green) / "Incorrect" (red) / "Needs Revision" (yellow) |
| Quiz score | e.g., "4/5" (if quiz was enabled) |
| Has recording icon | 🎥 icon if recording exists |
| Click action | Selects this submission → shows detail in right panel |
| Active/selected state | Highlighted background when selected |

**Right Panel — Submission Detail (shown when a submission is selected):**
| Element | Type | Details |
|---|---|---|
| Student name | Heading (h3) | |
| Submitted date | Text | |
| **Experiment State section** | Card | |
| → Completed steps | Text | e.g., "Steps: 5 / 7 completed" |
| → Completion percentage | Progress bar | e.g., 71% |
| → Variable values | Key-value list | e.g., "pH: 7", "Temperature: 42°C" |
| **Recording section** | Card | Only shown if `recordingUrl` exists |
| → Video player | HTML5 video | Plays the student's AR recording from Firebase Storage URL |
| → Duration | Text | e.g., "3:24" |
| **Quiz Results section** | Card | Only shown if `quizAnswers` exist |
| → Score | Text | e.g., "Score: 4/5 (80%)" |
| → Per-question breakdown | List | For each question: question text, student answer, correct/incorrect indicator |
| **Grading section** | Card | |
| → Status dropdown | Select | Options: "Pending", "Correct", "Incorrect", "Needs Revision" |
| → Feedback textarea | Textarea | Optional written feedback |
| → "Save Grade" button | Primary button | Saves grade to Firestore |

**Functionality:**
1. On load → query `submissions` where `experimentId == :experimentId` and `classroomId == :classroomId`, ordered by `submittedAt desc`
2. To get total student count → query `classrooms/:classroomId/members` and count
3. Filter tabs filter the submission list client-side by `status`
4. Selecting a submission loads its full detail in the right panel
5. Video player: use the `recordingUrl` from the submission doc as the `src` for an HTML5 `<video>` element
6. "Save Grade" → `updateDoc` on `submissions/{submissionId}`:
   ```json
   {
     "status": "<selected status>",
     "grade": "<selected status>",
     "instructorFeedback": "<feedback text>",
     "updatedAt": serverTimestamp()
   }
   ```
7. After saving → show success toast, update the status badge in the left panel list

**Empty state (right panel):**
- If no submission is selected: show "Select a submission to view details"

**Empty state (no submissions at all):**
- Show "No submissions yet for this experiment"

---

## Screen Navigation Flow

```
                                         ┌─────────────────────┐
                                         │  /login             │
                                    ┌───▶│  Login Page         │──▶ /dashboard
                                    │    └─────────────────────┘
                                    │              ▲
                                    │              │ link
               Not authenticated ───┤              ▼
                                    │    ┌─────────────────────┐
                                    └───▶│  /register          │──▶ /dashboard
                                         │  Register Page      │
                                         └─────────────────────┘

    ┌─────────────────────────────────────────────────────────────────────┐
    │                         AUTHENTICATED AREA                         │
    │                                                                     │
    │  ┌─────────────────────┐        ┌──────────────────────────┐       │
    │  │  /dashboard          │───────▶│  /classrooms/:id         │       │
    │  │  Dashboard Home      │ click  │  Classroom Detail        │       │
    │  │  - Classroom grid    │ card   │  - Join code             │       │
    │  │  - Recent experiments│        │  - Students tab          │       │
    │  │  - [+New Classroom]──┼──modal │  - Experiments tab       │       │
    │  └──────────┬───────────┘        └──────────┬───────────────┘       │
    │             │ click experiment               │                      │
    │             ▼                                │ click "View          │
    │  ┌─────────────────────┐                     │  Submissions"        │
    │  │  /experiments        │                     ▼                      │
    │  │  My Experiments List │        ┌──────────────────────────┐       │
    │  │  - Filter/sort       │        │  /evaluation/:cId/:eId   │       │
    │  │  - [+New Experiment] │        │  Evaluation Page         │       │
    │  │  - Click → editor    │        │  - Submission list       │       │
    │  └──────────┬───────────┘        │  - Detail + grading      │       │
    │             │ click card         └──────────────────────────┘       │
    │             ▼                                                       │
    │  ┌─────────────────────┐                                           │
    │  │  /experiment/:expName│                                           │
    │  │  [EXISTING EDITOR]   │                                           │
    │  │  DO NOT MODIFY       │                                           │
    │  └─────────────────────┘                                           │
    │                                                                     │
    │  Top bar: Dashboard | Experiments | User menu (Logout)             │
    └─────────────────────────────────────────────────────────────────────┘
```

---

## Shared Components to Build

These are reusable components needed across multiple screens:

| Component | Used In | Description |
|---|---|---|
| `TopBar` | All authenticated pages | Logo, nav links, user menu with logout |
| `AuthGuard` | Router wrapper | Checks auth state, redirects if needed |
| `ClassroomCard` | Dashboard | Single classroom card |
| `ExperimentCard` | Dashboard, Experiments page | Single experiment card |
| `StatusBadge` | Multiple | Colored badge showing Draft/Published/Pending/Correct/etc. |
| `ConfirmDialog` | Multiple | Generic "Are you sure?" confirmation modal |
| `EmptyState` | Multiple | Illustration + message + CTA for empty lists |
| `CopyButton` | Classroom Detail | Copies text to clipboard, shows toast |

---

## Firestore Queries Quick Reference

| Screen | Query |
|---|---|
| Dashboard — classrooms | `collection("classrooms"), where("instructorId", "==", uid), where("archived", "==", false)` |
| Dashboard — recent experiments | `collection("experiments"), where("instructorId", "==", uid), orderBy("updatedAt", "desc"), limit(10)` |
| Classroom Detail — members | `collection("classrooms/{id}/members")` |
| Classroom Detail — experiments | Read `experimentIds` from classroom doc → `getDoc` for each experiment |
| Classroom Detail — submission counts | `collection("submissions"), where("classroomId", "==", id), where("experimentId", "==", eId)` → count |
| Experiments page | `collection("experiments"), where("instructorId", "==", uid), orderBy("updatedAt", "desc")` |
| Assign modal — available experiments | `collection("experiments"), where("instructorId", "==", uid), where("status", "==", "published")` |
| Evaluation — submissions | `collection("submissions"), where("classroomId", "==", cId), where("experimentId", "==", eId), orderBy("submittedAt", "desc")` |
| Evaluation — total students | `collection("classrooms/{cId}/members")` → count |

---

## Summary of New Routes to Add to the Router

```tsx
// Add these routes to the router in app.tsx
// Keep existing routes untouched

const router = createBrowserRouter([
  { path: '/',                        element: <Navigate to="/dashboard" /> },
  { path: '/login',                   element: <LoginPage /> },
  { path: '/register',                element: <RegisterPage /> },
  { path: '/dashboard',               element: <AuthGuard><DashboardHome /></AuthGuard> },
  { path: '/classrooms/:classroomId', element: <AuthGuard><ClassroomDetail /></AuthGuard> },
  { path: '/experiments',             element: <AuthGuard><ExperimentsList /></AuthGuard> },
  { path: '/evaluation/:classroomId/:experimentId', element: <AuthGuard><EvaluationPage /></AuthGuard> },
  
  // EXISTING — DO NOT TOUCH
  { path: '/experiment/:expName',                  element: <SceneManager /> },
  { path: '/experiment/:expName/scene/:sceneName', element: <Scene /> },
]);
```
