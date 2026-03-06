# EduAR — Service Definitions

> Defines each service component, its responsibilities, interfaces, and dependencies.

---

## 1. Authentication Service

**Location:** `Designer/src/core/services/userService.ts` + `EduARPlayer/Assets/Scripts/Auth/AuthManager.cs`

| Property | Value |
|---|---|
| **Provider** | Firebase Authentication |
| **Methods** | Email/Password, Google SSO |
| **Responsibilities** | User registration, login, session management, role assignment |
| **Outputs** | JWT auth token, user UID, user profile |

**Behavior:**
- On registration → creates Firebase Auth user + Firestore `users` document with role
- On login → returns auth token used for all subsequent API calls
- Role is stored in Firestore (not Firebase Auth custom claims) for simplicity
- Both Designer and Player share the same auth backend

**Interface:**
```typescript
// Designer (TypeScript)
interface AuthService {
  register(email: string, password: string, role: 'instructor' | 'student', displayName: string): Promise<User>;
  login(email: string, password: string): Promise<User>;
  loginWithGoogle(): Promise<User>;
  logout(): Promise<void>;
  getCurrentUser(): User | null;
  onAuthStateChanged(callback: (user: User | null) => void): Unsubscribe;
}
```

```csharp
// Player (C#)
public class AuthManager : MonoBehaviour {
    public async Task<FirebaseUser> Register(string email, string password, string displayName);
    public async Task<FirebaseUser> Login(string email, string password);
    public void Logout();
    public FirebaseUser CurrentUser { get; }
    public event Action<FirebaseUser> OnAuthStateChanged;
}
```

---

## 2. Classroom Service

**Location:** `Designer/src/core/services/classroomService.ts` + `EduARPlayer/Assets/Scripts/Classrooms/ClassroomManager.cs`

| Property | Value |
|---|---|
| **Provider** | Firebase Firestore |
| **Collection** | `classrooms`, `classrooms/{id}/members` |
| **Responsibilities** | CRUD classrooms, manage members, generate join codes |

**Interface:**
```typescript
// Designer (TypeScript)
interface ClassroomService {
  createClassroom(data: CreateClassroomInput): Promise<Classroom>;
  getClassroom(id: string): Promise<Classroom>;
  listInstructorClassrooms(instructorId: string): Promise<Classroom[]>;
  updateClassroom(id: string, data: Partial<Classroom>): Promise<void>;
  archiveClassroom(id: string): Promise<void>;
  regenerateJoinCode(id: string): Promise<string>;
  listMembers(classroomId: string): Promise<ClassroomMember[]>;
  removeMember(classroomId: string, studentId: string): Promise<void>;
  assignExperiment(classroomId: string, experimentId: string): Promise<void>;
  unassignExperiment(classroomId: string, experimentId: string): Promise<void>;
}
```

```csharp
// Player (C#)
public class ClassroomManager : MonoBehaviour {
    public async Task<List<Classroom>> GetMyClassrooms();
    public async Task<Classroom> JoinClassroom(string joinCode);
    public async Task LeaveClassroom(string classroomId);
    public async Task<List<Experiment>> GetClassroomExperiments(string classroomId);
}
```

**Join Code Logic:**
- 6-character alphanumeric code (uppercase, no ambiguous characters like O/0, I/1)
- Generated via Cloud Function to ensure uniqueness
- Instructor can deactivate/regenerate at any time
- Student enters code in Player → query Firestore → add to members subcollection

---

## 3. Experiment Service

**Location:** `Designer/src/core/services/experimentService.ts` + `EduARPlayer/Assets/Scripts/Experiments/ExperimentLoader.cs`

| Property | Value |
|---|---|
| **Provider** | Firebase Firestore + Storage |
| **Collection** | `experiments` |
| **Responsibilities** | CRUD experiments, publish, assign to classrooms |

**Interface:**
```typescript
// Designer (TypeScript)
interface ExperimentService {
  createExperiment(data: CreateExperimentInput): Promise<Experiment>;
  getExperiment(id: string): Promise<Experiment>;
  listInstructorExperiments(instructorId: string): Promise<Experiment[]>;
  updateExperiment(id: string, data: Partial<Experiment>): Promise<void>;
  deleteExperiment(id: string): Promise<void>;
  publishExperiment(id: string): Promise<{ experimentCode: string }>;
  unpublishExperiment(id: string): Promise<void>;
  updateSceneData(id: string, sceneData: SceneData): Promise<void>;
  updateVPLGraph(id: string, vplGraph: VPLGraph): Promise<void>;
  loadByCode(code: string): Promise<Experiment>;
}
```

```csharp
// Player (C#)
public class ExperimentLoader : MonoBehaviour {
    public async Task<ExperimentData> LoadExperiment(string experimentId);
    public async Task<ExperimentData> LoadByCode(string experimentCode);
    public async Task DownloadAssets(ExperimentData experiment);
    public bool IsAssetsCached(string experimentId);
}
```

---

## 4. Submission Service

**Location:** `Designer/src/core/services/submissionService.ts` + `EduARPlayer/Assets/Scripts/Submission/SubmissionManager.cs`

| Property | Value |
|---|---|
| **Provider** | Firebase Firestore + Storage |
| **Collections** | `submissions` |
| **Responsibilities** | Create submissions, upload recordings, grade submissions |

**Interface:**
```typescript
// Designer — Instructor reads/grades
interface SubmissionService {
  listSubmissions(experimentId: string, classroomId: string): Promise<Submission[]>;
  getSubmission(id: string): Promise<Submission>;
  gradeSubmission(id: string, grade: GradeInput): Promise<void>;
  getRecordingUrl(submissionId: string): Promise<string>;
}
```

```csharp
// Player — Student creates
public class SubmissionManager : MonoBehaviour {
    public async Task<string> SubmitExperiment(SubmissionData data);
    public async Task<string> UploadRecording(byte[] videoData, string submissionId);
    public async Task<List<SubmissionSummary>> GetMySubmissions(string experimentId);
}
```

---

## 5. Storage Service

**Location:** `Designer/src/core/services/storageService.ts`

| Property | Value |
|---|---|
| **Provider** | Firebase Storage |
| **Responsibilities** | Upload/download 3D assets, marker images, recordings, thumbnails |

**Storage Paths:**
```
/assets/{experimentId}/{filename}.glb       # 3D model files
/markers/{experimentId}/{markerId}.png      # Marker reference images
/recordings/{submissionId}/{filename}.mp4   # Student recordings
/thumbnails/{experimentId}.png              # Experiment thumbnails
/avatars/{userId}.png                       # User profile pictures
```

---

## 6. AI Assistant Service

**Location:** `cloud-functions/src/ai/` + `Designer/src/components/ai_assistant/aiService.ts` + `EduARPlayer/Assets/Scripts/AI/AIApiClient.cs`

| Property | Value |
|---|---|
| **Provider** | Firebase Cloud Function calling OpenAI/Gemini API |
| **Responsibilities** | Scene-aware chat, VPL generation, scene analysis |

**Interface:**
```typescript
// Client-side API wrapper
interface AIService {
  sendMessage(request: AIChatRequest): Promise<AIChatResponse>;
  generateVPL(request: VPLGenerateRequest): Promise<VPLGenerateResponse>;
  analyzeScene(request: SceneAnalysisRequest): Promise<SceneAnalysisResponse>;
  getConversationHistory(conversationId: string): Promise<AIConversation>;
}
```

**Context Injection (for LLM prompts):**
The AI service constructs prompts that include:
1. System prompt explaining EduAR VPL concepts
2. Current scene objects (serialized from sceneData)
3. Current VPL graph (serialized from vplGraph)
4. Marker assignments
5. Available asset types
6. Conversation history

---

## 7. Unity Bridge Service

**Location:** `Designer/src/components/unity_viewer/unityBridge.ts`

| Property | Value |
|---|---|
| **Technology** | `window.postMessage` API |
| **Responsibilities** | Bidirectional React ↔ Unity WebGL communication |

**Message Types:**
```typescript
type UnityMessage =
  | { type: 'LOAD_SCENE'; payload: SceneData }
  | { type: 'UPDATE_OBJECT'; payload: SceneObject }
  | { type: 'REMOVE_OBJECT'; payload: { objectId: string } }
  | { type: 'PLAY_VPL'; payload: VPLGraph }
  | { type: 'STOP_VPL' }
  | { type: 'SET_CAMERA'; payload: CameraConfig };

type UnityResponse =
  | { type: 'SCENE_READY' }
  | { type: 'VPL_STEP'; payload: { nodeId: string; status: string } }
  | { type: 'PREVIEW_SCREENSHOT'; payload: { dataUrl: string } }
  | { type: 'ERROR'; payload: { message: string } };
```

---

## 8. Logic Engine (VPL Runtime)

**Location:** `EduARPlayer/Assets/Logic/`

| Property | Value |
|---|---|
| **Technology** | C# (Unity) |
| **Responsibilities** | Parse VPL JSON, build runtime graph, execute triggers/conditions/actions |

**Architecture:**
```
JSON (from Firestore) → LogicBuilder → Runtime Graph → LogicManager (tick loop)
                                           ↓
                              TriggerInstructions (event listeners)
                              ConditionInstructions (boolean evaluators)
                              ActionInstructions (side effects on scene objects)
```

**Execution Flow:**
1. `LogicBuilder` parses VPL JSON into an in-memory directed graph
2. `LogicManager` runs a tick loop checking all active triggers
3. When a trigger fires → evaluate connected conditions → execute connected actions
4. Actions modify scene objects (color, animation, particles, labels, sounds)
5. `VariableStore` maintains runtime variable values
6. `EventBus` propagates events between instructions

---

## 9. Notification Service (Cloud Functions)

**Location:** `cloud-functions/src/submissions/onSubmission.ts`

| Property | Value |
|---|---|
| **Technology** | Firebase Cloud Functions + FCM |
| **Responsibilities** | Notify instructors of new submissions |

**Triggers:**
- `onSubmission` → Firestore trigger on `submissions` collection write → sends push notification to instructor
- `onMemberJoin` → Firestore trigger on `members` subcollection → notifies instructor of new student
