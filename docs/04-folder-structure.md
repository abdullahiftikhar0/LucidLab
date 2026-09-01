# EduAR — Complete Project Folder Structure

> Full platform directory layout covering Designer, Player, EditorRenderer, Cloud Functions, and shared assets.

---

```
EduAR/
│
├── README.md                           # Project overview
├── converted.md                        # Original project specification
├── LICENSE                             # MIT License
├── .gitignore                          # Root gitignore
│
├── docs/                               # 📄 Architecture & specs
│   ├── 01-system-architecture.md       # System overview, entities, stack
│   ├── 02-database-schema.md           # Firestore collections & schemas
│   ├── 03-api-structure.md             # API endpoints & data flows
│   ├── 04-folder-structure.md          # This file
│   ├── 05-service-definitions.md       # Service component specs
│   ├── 06-workflows.md                 # Classroom & experiment flows
│   ├── 07-ai-assistant-spec.md         # AI integration specification
│   └── 08-presentation-prototypes.md   # Hand-drawn prototype screens
│
├── Designer/                           # 🖥️ React Web App (Teacher Side)
│   ├── public/
│   │   ├── index.html
│   │   ├── favicon.ico
│   │   ├── manifest.json
│   │   └── unity-webgl/               # Unity WebGL build output
│   │       ├── Build/
│   │       ├── TemplateData/
│   │       └── index.html
│   │
│   ├── src/
│   │   ├── index.tsx                   # React entry point
│   │   ├── app.tsx                     # Root App component with Router
│   │   ├── firebaseConfig.ts           # Firebase initialization
│   │   ├── supabaseClient.ts           # Supabase client (markers)
│   │   ├── react-app-env.d.ts          # TypeScript env types
│   │   │
│   │   ├── components/                 # 🧩 React components
│   │   │   ├── auth/                   # Authentication UI
│   │   │   │   ├── LoginPage.tsx
│   │   │   │   ├── RegisterPage.tsx
│   │   │   │   ├── AuthGuard.tsx       # Route protection wrapper
│   │   │   │   └── UserMenu.tsx        # Profile dropdown
│   │   │   │
│   │   │   ├── dashboard/             # Dashboard & navigation
│   │   │   │   ├── DashboardLayout.tsx # Main layout with sidebar
│   │   │   │   ├── DashboardHome.tsx   # Overview cards/stats
│   │   │   │   └── Sidebar.tsx         # Navigation sidebar
│   │   │   │
│   │   │   ├── classrooms/            # 🏫 Classroom management
│   │   │   │   ├── ClassroomList.tsx   # Grid of classrooms
│   │   │   │   ├── ClassroomCard.tsx   # Single classroom card
│   │   │   │   ├── CreateClassroom.tsx # Create classroom modal
│   │   │   │   ├── ClassroomDetail.tsx # Classroom detail view
│   │   │   │   ├── MemberList.tsx      # Student roster
│   │   │   │   ├── JoinCodeDisplay.tsx # Join code generator/display
│   │   │   │   └── AssignExperiment.tsx# Assign experiments to classroom
│   │   │   │
│   │   │   ├── experiments/           # 🧪 Experiment management
│   │   │   │   ├── ExperimentList.tsx  # Grid of experiments
│   │   │   │   ├── ExperimentCard.tsx  # Single experiment card
│   │   │   │   ├── CreateExperiment.tsx# Create/edit experiment
│   │   │   │   └── ExperimentPublish.tsx # Publish flow modal
│   │   │   │
│   │   │   ├── evaluation/            # 📊 Student evaluation
│   │   │   │   ├── SubmissionList.tsx  # List of student submissions
│   │   │   │   ├── SubmissionCard.tsx  # Submission summary card
│   │   │   │   ├── SubmissionDetail.tsx# Full submission view
│   │   │   │   ├── RecordingPlayer.tsx # Video player for recordings
│   │   │   │   ├── GradePanel.tsx     # Grading interface
│   │   │   │   └── QuizResults.tsx    # Quiz answer review
│   │   │   │
│   │   │   ├── logic_designer/        # 🔗 Visual Programming Editor
│   │   │   │   ├── VPLEditor.tsx       # Main React Flow canvas
│   │   │   │   ├── VPLToolbar.tsx      # Node palette toolbar
│   │   │   │   ├── nodes/             # Custom VPL nodes
│   │   │   │   │   ├── TriggerNode.tsx     # Blue trigger blocks
│   │   │   │   │   ├── ConditionNode.tsx   # Yellow condition blocks
│   │   │   │   │   ├── ActionNode.tsx      # Green action blocks
│   │   │   │   │   ├── VariableNode.tsx    # Variable definition
│   │   │   │   │   └── CommentNode.tsx     # Annotation block
│   │   │   │   ├── edges/             # Custom edge types
│   │   │   │   │   └── LogicEdge.tsx
│   │   │   │   ├── panels/            # Side panels
│   │   │   │   │   ├── NodeConfigPanel.tsx # Selected node config
│   │   │   │   │   └── NodePalette.tsx     # Drag-from palette
│   │   │   │   └── serializer.ts      # VPL ↔ JSON serializer
│   │   │   │
│   │   │   ├── scene_editor/          # 🎨 3D Scene Editor
│   │   │   │   ├── SceneCanvas.tsx     # 2D scene layout canvas
│   │   │   │   ├── ObjectLibrary.tsx   # Asset drag palette
│   │   │   │   ├── ObjectProperties.tsx# Selected object properties
│   │   │   │   ├── MarkerAssignment.tsx# Marker ↔ object linking
│   │   │   │   └── SceneToolbar.tsx    # Scene edit tools
│   │   │   │
│   │   │   ├── unity_viewer/          # 🎮 Unity WebGL Preview
│   │   │   │   ├── UnityViewer.tsx     # iframe wrapper component
│   │   │   │   └── unityBridge.ts     # postMessage API bridge
│   │   │   │
│   │   │   ├── unity_toolbar/         # Toolbar for preview
│   │   │   │   ├── UnityToolbar.tsx
│   │   │   │   └── PlayButton.tsx
│   │   │   │
│   │   │   ├── ai_assistant/          # 🤖 AI Assistant Panel
│   │   │   │   ├── AIChatPanel.tsx    # Chat interface
│   │   │   │   ├── AIMessage.tsx      # Single message bubble
│   │   │   │   ├── AISuggestion.tsx   # VPL suggestion card
│   │   │   │   └── aiService.ts       # API client for AI endpoints
│   │   │   │
│   │   │   └── shared/                # Shared UI components
│   │   │       ├── LoadingSpinner.tsx
│   │   │       ├── Modal.tsx
│   │   │       ├── ConfirmDialog.tsx
│   │   │       ├── Toast.tsx
│   │   │       └── EmptyState.tsx
│   │   │
│   │   ├── core/                      # ⚙️ Core logic
│   │   │   ├── hooks/                 # React hooks
│   │   │   │   ├── useAuth.ts         # Authentication hook
│   │   │   │   ├── useClassrooms.ts   # Classroom CRUD hook
│   │   │   │   ├── useExperiments.ts  # Experiment CRUD hook
│   │   │   │   ├── useSubmissions.ts  # Submissions hook
│   │   │   │   ├── useUnityBridge.ts  # Unity communication hook
│   │   │   │   └── useAI.ts           # AI assistant hook
│   │   │   ├── states/                # State management
│   │   │   │   ├── sceneState.ts      # Scene editor state
│   │   │   │   ├── vplState.ts        # VPL graph state
│   │   │   │   └── appState.ts        # Global app state
│   │   │   ├── types/                 # TypeScript types
│   │   │   │   ├── classroom.ts       # Classroom interfaces
│   │   │   │   ├── experiment.ts      # Experiment interfaces
│   │   │   │   ├── submission.ts      # Submission interfaces
│   │   │   │   ├── user.ts            # User interfaces
│   │   │   │   ├── vpl.ts             # VPL graph types
│   │   │   │   └── scene.ts           # Scene object types
│   │   │   ├── services/              # Firebase service wrappers
│   │   │   │   ├── classroomService.ts
│   │   │   │   ├── experimentService.ts
│   │   │   │   ├── submissionService.ts
│   │   │   │   ├── storageService.ts
│   │   │   │   └── userService.ts
│   │   │   └── misc.ts                # Utility functions
│   │   │
│   │   ├── routes/                    # 🛤️ Page routing
│   │   │   ├── AppRouter.tsx          # Route definitions
│   │   │   ├── experiment_root.tsx    # Experiment editor page
│   │   │   ├── scene_manager.tsx      # Scene management page
│   │   │   ├── object_model_manager.tsx# Object library page
│   │   │   └── Scene/                 # Scene sub-routes
│   │   │       ├── SceneEditor.tsx
│   │   │       └── ScenePreview.tsx
│   │   │
│   │   └── styles/                    # 🎨 CSS
│   │       ├── global.css
│   │       ├── dashboard.css
│   │       ├── classrooms.css
│   │       ├── vpl-editor.css
│   │       └── ai-panel.css
│   │
│   ├── package.json
│   ├── tsconfig.json
│   ├── .eslintrc.json
│   └── .prettierrc.json
│
├── EduARPlayer/                       # 📱 Unity Mobile AR App (Student)
│   ├── Assets/
│   │   ├── Scenes/                    # Unity scenes
│   │   │   ├── MainMenu.unity         # Auth + classroom selection
│   │   │   ├── ClassroomView.unity    # Experiment list per classroom
│   │   │   ├── ARExperiment.unity     # Main AR experiment scene
│   │   │   └── SubmissionView.unity   # Post-experiment submission
│   │   │
│   │   ├── Scripts/                   # 📜 C# scripts
│   │   │   ├── Auth/                  # Authentication
│   │   │   │   ├── AuthManager.cs
│   │   │   │   ├── LoginUI.cs
│   │   │   │   └── RegisterUI.cs
│   │   │   │
│   │   │   ├── Classrooms/           # Classroom management
│   │   │   │   ├── ClassroomManager.cs    # Load/join classrooms
│   │   │   │   ├── ClassroomListUI.cs     # Classroom grid UI
│   │   │   │   ├── JoinClassroomUI.cs     # Join code input
│   │   │   │   └── ClassroomData.cs       # Data models
│   │   │   │
│   │   │   ├── Experiments/          # Experiment loading
│   │   │   │   ├── ExperimentLoader.cs    # Download experiment config
│   │   │   │   ├── ExperimentListUI.cs    # Experiment selection UI
│   │   │   │   ├── AssetDownloader.cs     # 3D asset downloader
│   │   │   │   └── ExperimentData.cs      # Data models
│   │   │   │
│   │   │   ├── Submission/           # Submission handling
│   │   │   │   ├── SubmissionManager.cs   # Create & upload submissions
│   │   │   │   ├── RecordingManager.cs    # Screen recording
│   │   │   │   ├── StateCapture.cs        # Experiment state snapshot
│   │   │   │   ├── QuizUI.cs             # Quiz overlay
│   │   │   │   └── SubmissionUI.cs       # Submission confirmation UI
│   │   │   │
│   │   │   └── AI/                   # AI assistant (student)
│   │   │       ├── AIAssistantUI.cs       # Chat interface
│   │   │       └── AIApiClient.cs         # REST API client
│   │   │
│   │   ├── Interaction/              # 🎯 AR interaction scripts
│   │   │   ├── ARExperimentManager.cs     # Main AR experiment controller
│   │   │   ├── ARModeManager.cs           # AR/Plane mode toggling
│   │   │   ├── ARLockManager.cs           # Object lock management
│   │   │   ├── MarkerAnchor.cs            # Marker-to-object anchoring
│   │   │   ├── MarkerProximityManager.cs  # Proximity trigger detection
│   │   │   ├── TapInteractor.cs           # Tap gesture handler
│   │   │   ├── TiltTriggerManager.cs      # Phone tilt detection
│   │   │   ├── TrackingModeToggleUI.cs    # Tracking mode UI
│   │   │   └── SceneNavigator.cs          # Scene navigation
│   │   │
│   │   ├── Logic/                    # 🔗 VPL execution engine
│   │   │   ├── LogicManager.cs            # Main logic orchestrator
│   │   │   ├── LogicBuilder.cs            # Builds runtime graph from JSON
│   │   │   ├── Instructions/              # VPL instruction implementations
│   │   │   │   ├── TriggerInstructions/
│   │   │   │   │   ├── MarkerDetectedTrigger.cs
│   │   │   │   │   ├── MarkerProximityTrigger.cs
│   │   │   │   │   ├── TapTrigger.cs
│   │   │   │   │   ├── TiltTrigger.cs
│   │   │   │   │   └── TimerTrigger.cs
│   │   │   │   ├── ConditionInstructions/
│   │   │   │   │   ├── CompareCondition.cs
│   │   │   │   │   ├── StateCondition.cs
│   │   │   │   │   └── ProximityCondition.cs
│   │   │   │   └── ActionInstructions/
│   │   │   │       ├── PlayAnimationAction.cs
│   │   │   │       ├── ChangeColorAction.cs
│   │   │   │       ├── ShowLabelAction.cs
│   │   │   │       ├── PlaySoundAction.cs
│   │   │   │       ├── ParticleEffectAction.cs
│   │   │   │       ├── UpdateDisplayAction.cs
│   │   │   │       └── SpawnObjectAction.cs
│   │   │   └── Misc/
│   │   │       ├── VariableStore.cs       # Runtime variable storage
│   │   │       └── EventBus.cs            # Internal event system
│   │   │
│   │   ├── SceneManagement/          # 🎬 Scene construction
│   │   │   ├── SceneBuilder.cs            # Builds 3D scene from JSON
│   │   │   ├── ObjectFactory.cs           # Instantiates scene objects
│   │   │   ├── ObjectPool.cs              # Object pooling
│   │   │   └── AssetCache.cs             # Local asset caching
│   │   │
│   │   ├── Firebase/                 # 🔥 Firebase SDK files
│   │   ├── Plugins/                  # Android/iOS native plugins
│   │   ├── Prefabs/                  # Unity prefabs
│   │   ├── Materials/                # Materials & shaders
│   │   ├── Images/                   # Reference/marker images
│   │   ├── StreamingAssets/          # Runtime-loaded assets
│   │   ├── Settings/                 # AR/XR settings
│   │   ├── XR/                       # XR plugin management
│   │   └── google-services.json      # Firebase Android config
│   │
│   ├── Packages/                     # Unity package manifest
│   └── ProjectSettings/              # Unity project settings
│
├── EditorRenderer/                   # 🎮 Unity WebGL Preview Build
│   ├── Assets/
│   │   ├── Scripts/
│   │   │   ├── WebGLBridge.cs         # postMessage bridge
│   │   │   ├── PreviewRenderer.cs     # 3D scene renderer
│   │   │   ├── VPLSimulator.cs        # VPL logic simulator
│   │   │   └── AssetLoader.cs         # Dynamic asset loading
│   │   ├── Scenes/
│   │   │   └── PreviewScene.unity     # Main preview scene
│   │   ├── Prefabs/
│   │   └── Materials/
│   ├── Packages/
│   └── ProjectSettings/
│
├── cloud-functions/                  # ☁️ Firebase Cloud Functions
│   ├── src/
│   │   ├── index.ts                   # Function exports
│   │   ├── auth/
│   │   │   └── onUserCreate.ts        # New user initialization
│   │   ├── classrooms/
│   │   │   ├── generateJoinCode.ts    # Unique code generator
│   │   │   └── onMemberJoin.ts        # Member join processing
│   │   ├── experiments/
│   │   │   ├── onPublish.ts           # Post-publish processing
│   │   │   └── generateExpCode.ts     # Experiment code generator
│   │   ├── submissions/
│   │   │   └── onSubmission.ts        # Notify instructor on submission
│   │   └── ai/
│   │       ├── chatHandler.ts         # AI chat endpoint
│   │       ├── generateVPL.ts         # VPL generation endpoint
│   │       ├── analyzeScene.ts        # Scene analysis endpoint
│   │       └── llmClient.ts           # OpenAI/Gemini API client
│   ├── package.json
│   └── tsconfig.json
│
├── shared/                           # 📦 Shared types & utilities
│   ├── types/
│   │   ├── classroom.ts
│   │   ├── experiment.ts
│   │   ├── submission.ts
│   │   ├── user.ts
│   │   └── vpl.ts
│   └── constants/
│       ├── categories.ts              # Experiment categories
│       └── vplNodeTypes.ts            # VPL node type definitions
│
├── assets/                           # 🎨 3D models & textures
│   ├── chemistry/
│   │   ├── beaker.glb
│   │   ├── bunsen_burner.glb
│   │   ├── test_tube.glb
│   │   ├── ph_meter.glb
│   │   └── thermometer.glb
│   ├── physics/
│   │   ├── battery.glb
│   │   ├── resistor.glb
│   │   ├── led.glb
│   │   ├── ammeter.glb
│   │   └── pendulum.glb
│   ├── biology/
│   │   ├── animal_cell.glb
│   │   ├── plant_cell.glb
│   │   ├── dna_helix.glb
│   │   └── neuron.glb
│   ├── markers/                      # Printable marker sheets
│   │   ├── marker_template_a4.pdf
│   │   └── marker_images/
│   └── textures/
│       ├── liquids/
│       ├── glass/
│       └── organic/
│
├── firestore.rules                   # Firestore security rules
├── storage.rules                     # Storage security rules
├── firebase.json                     # Firebase project config
├── .firebaserc                       # Firebase project aliases
│
└── tests/                            # 🧪 Tests
    ├── designer/
    │   ├── vpl-serializer.test.ts
    │   ├── classroom-service.test.ts
    │   └── ai-service.test.ts
    ├── cloud-functions/
    │   ├── join-code.test.ts
    │   └── ai-handler.test.ts
    └── e2e/
        └── experiment-flow.spec.ts
```
