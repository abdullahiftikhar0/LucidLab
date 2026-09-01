# EduAR — Database Schema (Firestore Collections)

> All data is stored in Firebase Firestore as JSON documents organized in collections and subcollections.

---

## Collection: `users`

Stores all platform users (instructors and students).

```json
{
  "uid": "firebase-auth-uid",
  "email": "teacher@school.edu",
  "displayName": "Dr. Sarah Khan",
  "role": "instructor",           // "instructor" | "student"
  "avatarUrl": "https://...",
  "createdAt": "2026-03-01T...",
  "updatedAt": "2026-03-05T...",
  "institution": "Lahore Grammar School",
  "classroomIds": ["cls_abc123", "cls_def456"]
}
```

| Field | Type | Description |
|---|---|---|
| `uid` | string | Firebase Auth UID (document ID) |
| `email` | string | User email address |
| `displayName` | string | Full name |
| `role` | string | `"instructor"` or `"student"` |
| `avatarUrl` | string | Profile picture URL |
| `createdAt` | timestamp | Account creation date |
| `updatedAt` | timestamp | Last profile update |
| `institution` | string | School/university name |
| `classroomIds` | array | IDs of classrooms the user belongs to |

---

## Collection: `classrooms`

Classrooms are containers that link instructors, students, and experiments.

```json
{
  "classroomId": "cls_abc123",
  "name": "Grade 10 Chemistry - Section A",
  "description": "Weekly AR chemistry experiments",
  "instructorId": "uid_teacher1",
  "joinCode": "CHEM-10A",
  "joinCodeActive": true,
  "createdAt": "2026-03-01T...",
  "updatedAt": "2026-03-05T...",
  "studentCount": 32,
  "experimentIds": ["exp_001", "exp_002"],
  "coverImage": "https://storage.../classroom-cover.png",
  "subject": "Chemistry",
  "archived": false
}
```

| Field | Type | Description |
|---|---|---|
| `classroomId` | string | Unique classroom ID (document ID) |
| `name` | string | Classroom display name |
| `description` | string | Optional description |
| `instructorId` | string | UID of the creating instructor |
| `joinCode` | string | 6-8 character alphanumeric join code |
| `joinCodeActive` | boolean | Whether the join code is currently active |
| `createdAt` | timestamp | Creation date |
| `updatedAt` | timestamp | Last modification |
| `studentCount` | number | Cached count of enrolled students |
| `experimentIds` | array | Experiments assigned to this classroom |
| `coverImage` | string | Optional cover image URL |
| `subject` | string | Subject category |
| `archived` | boolean | Soft delete flag |

### Subcollection: `classrooms/{classroomId}/members`

```json
{
  "uid": "uid_student1",
  "displayName": "Ahmed Ali",
  "email": "ahmed@student.edu",
  "role": "student",
  "joinedAt": "2026-03-02T...",
  "status": "active"
}
```

| Field | Type | Description |
|---|---|---|
| `uid` | string | User UID (document ID) |
| `displayName` | string | Cached student name |
| `email` | string | Student email |
| `role` | string | `"student"` or `"co-instructor"` |
| `joinedAt` | timestamp | When they joined |
| `status` | string | `"active"` / `"removed"` / `"pending"` |

---

## Collection: `experiments`

Stores experiment configurations created by instructors.

```json
{
  "experimentId": "exp_001",
  "title": "Acid-Base Neutralization",
  "description": "Mix HCl and NaOH to observe neutralization",
  "category": "chemistry",
  "instructorId": "uid_teacher1",
  "experimentCode": "CHEM-042",
  "status": "published",
  "createdAt": "2026-03-01T...",
  "updatedAt": "2026-03-05T...",
  "publishedAt": "2026-03-05T...",
  "classroomIds": ["cls_abc123"],
  "sceneData": { /* ... see Scene Data below ... */ },
  "vplGraph": { /* ... see VPL Graph below ... */ },
  "assets": [ /* ... asset references ... */ ],
  "markers": [ /* ... marker configurations ... */ ],
  "quizEnabled": true,
  "quizQuestions": [ /* ... questions ... */ ],
  "sandboxMode": false,
  "thumbnailUrl": "https://storage.../exp-thumb.png"
}
```

### Scene Data (embedded in experiment)

```json
{
  "sceneData": {
    "objects": [
      {
        "objectId": "obj_beaker1",
        "type": "beaker",
        "assetUrl": "https://storage.../beaker.glb",
        "position": { "x": 0, "y": 0, "z": 0 },
        "rotation": { "x": 0, "y": 0, "z": 0 },
        "scale": { "x": 1, "y": 1, "z": 1 },
        "properties": {
          "label": "HCl (Hydrochloric Acid)",
          "liquidColor": "#FF0000",
          "fillLevel": 0.7,
          "markerId": "marker_01"
        }
      }
    ],
    "environment": {
      "lighting": "lab_standard",
      "background": "white_desk"
    }
  }
}
```

### VPL Graph (embedded in experiment)

```json
{
  "vplGraph": {
    "nodes": [
      {
        "nodeId": "n1",
        "type": "trigger",
        "subtype": "marker_detected",
        "config": { "markerId": "marker_01" },
        "position": { "x": 100, "y": 200 }
      },
      {
        "nodeId": "n2",
        "type": "action",
        "subtype": "change_color",
        "config": {
          "targetObject": "obj_beaker1",
          "property": "liquidColor",
          "value": "#00FF00",
          "duration": 2.0
        },
        "position": { "x": 400, "y": 200 }
      }
    ],
    "edges": [
      {
        "edgeId": "e1",
        "source": "n1",
        "target": "n2",
        "sourceHandle": "out",
        "targetHandle": "in"
      }
    ]
  }
}
```

### Marker Configuration (embedded in experiment)

```json
{
  "markers": [
    {
      "markerId": "marker_01",
      "label": "HCl Beaker",
      "imageUrl": "https://storage.../marker01.png",
      "physicalSize": 0.05,
      "assignedObjectId": "obj_beaker1"
    }
  ]
}
```

---

## Collection: `submissions`

Student experiment submissions.

```json
{
  "submissionId": "sub_xyz789",
  "experimentId": "exp_001",
  "classroomId": "cls_abc123",
  "studentId": "uid_student1",
  "studentName": "Ahmed Ali",
  "submittedAt": "2026-03-05T...",
  "status": "pending",
  "grade": null,
  "instructorFeedback": null,
  "experimentState": {
    "completedSteps": 5,
    "totalSteps": 7,
    "variableValues": { "pH": 7, "temperature": 42 },
    "completionPercentage": 71
  },
  "recordingUrl": "https://storage.../recordings/sub_xyz789.mp4",
  "recordingDurationSec": 180,
  "quizAnswers": [
    { "questionId": "q1", "selectedOption": "B", "correct": true },
    { "questionId": "q2", "selectedOption": "A", "correct": false }
  ],
  "quizScore": 50
}
```

| Field | Type | Description |
|---|---|---|
| `submissionId` | string | Unique submission ID |
| `experimentId` | string | Reference to experiment |
| `classroomId` | string | Reference to classroom |
| `studentId` | string | Reference to student |
| `submittedAt` | timestamp | Submission time |
| `status` | string | `"pending"` / `"correct"` / `"incorrect"` / `"needs_revision"` |
| `grade` | string/null | Instructor-assigned grade |
| `instructorFeedback` | string/null | Written feedback |
| `experimentState` | object | Captured experiment state snapshot |
| `recordingUrl` | string/null | Cloud Storage URL for recording |
| `quizAnswers` | array | Student quiz responses |
| `quizScore` | number | Calculated quiz score |

---

## Collection: `ai_conversations`

Tracks AI assistant conversation history for context.

```json
{
  "conversationId": "conv_abc",
  "userId": "uid_teacher1",
  "experimentId": "exp_001",
  "role": "instructor",
  "createdAt": "2026-03-05T...",
  "messages": [
    {
      "role": "user",
      "content": "How can I make the beaker change color on marker detection?",
      "timestamp": "2026-03-05T10:30:00Z"
    },
    {
      "role": "assistant",
      "content": "You can add a Trigger node...",
      "timestamp": "2026-03-05T10:30:02Z",
      "suggestedVplNodes": [ /* optional VPL suggestions */ ]
    }
  ]
}
```

---

## Firestore Security Rules (Summary)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own profile
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
    
    // Classrooms: instructor can CRUD, members can read
    match /classrooms/{classroomId} {
      allow create: if request.auth != null && 
                       get(/users/$(request.auth.uid)).data.role == 'instructor';
      allow read: if request.auth.uid in resource.data.memberIds 
                    || request.auth.uid == resource.data.instructorId;
      allow update, delete: if request.auth.uid == resource.data.instructorId;
    }
    
    // Experiments: instructor CRUD, classroom members read
    match /experiments/{experimentId} {
      allow create, update, delete: if request.auth.uid == resource.data.instructorId;
      allow read: if request.auth != null;  // Filtered by classroom membership in app
    }
    
    // Submissions: students create their own, instructors read classroom submissions
    match /submissions/{submissionId} {
      allow create: if request.auth.uid == request.resource.data.studentId;
      allow read: if request.auth.uid == resource.data.studentId
                   || request.auth.uid == get(/experiments/$(resource.data.experimentId)).data.instructorId;
      allow update: if request.auth.uid == get(/experiments/$(resource.data.experimentId)).data.instructorId;
    }
  }
}
```
