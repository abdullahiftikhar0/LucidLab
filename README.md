# LucidLab 🧪✨

> **Empowering Hands-On Science Education through Augmented Reality**

LucidLab is a comprehensive, two-sided Augmented Reality (AR) education platform designed to make science experiments safer, more accessible, and highly interactive. 

It replaces expensive and potentially dangerous physical lab equipment with highly interactive 3D simulations anchored to physical printed markers (marker-based AR).

---

## 🌟 The Platform

LucidLab uses a **classroom-based workflow** (similar to Google Classroom) where instructors and students collaborate. The platform consists of two main applications:

### 1. LucidLab Designer (Web App)
A powerful web-based authoring tool for **Instructors**.
*   **Classroom Management:** Create classrooms, manage student rosters, and generate secure join codes.
*   **Drag-and-Drop Scene Editor:** Place 3D scientific equipment (beakers, burners, meters) onto a virtual canvas and assign them to physical AR markers.
*   **Visual Programming Language (VPL):** Build complex experiment logic (e.g., "If Beaker A is near Beaker B, change color to red and play bubble particles") using intuitive, connectable node blocks. No coding required.
*   **AI Assistant Integration:** A scene-aware AI helper that can suggest VPL logic or automatically configure nodes based on natural language requests.
*   **Evaluation Dashboard:** View student submissions, watch their AR screen recordings, and grade their interactive quizzes.

### 2. LucidLab Player (Mobile App)
An immersive AR execution engine for **Students**.
*   **Classroom Access:** Join classrooms via secure codes and browse assigned experiments.
*   **AR Execution Engine:** Uses AR Foundation (ARCore/ARKit) to detect printed markers on a physical desk and render the interactive 3D experiment scenes.
*   **Dynamic Logic Engine:** Downloads the JSON-serialized VPL graph from the web Designer and executes the interactive triggers, conditions, and actions in real-time.
*   **Submission System:** Automatically tracks experiment completion steps, captures screen recordings, administers quizzes, and submits the payload back to the instructor for evaluation.

---

## 🏗️ Architecture & Tech Stack

### Frontend & Authoring
*   **Web Framework:** React 18, TypeScript, Chakra UI
*   **Node Graph Editor:** React Flow (for the VPL Editor)
*   **3D Scene Engine:** Three.js / Custom React wrapper
*   **Live Preview:** Embedded Unity WebGL iframe (`EditorRenderer`)

### Mobile AR Engine
*   **Game Engine:** Unity 3D (LTS)
*   **AR Framework:** AR Foundation (Image Tracking)
*   **Scripting:** C# (Custom runtime Logic Engine for VPL JSON parsing)

### Cloud Backend
*   **Database:** Firebase Firestore (NoSQL, storing Classrooms, Users, Experiments)
*   **Authentication:** Firebase Auth (Email/Password & Google SSO)
*   **Storage:** Firebase Storage (Hosting 3D models, marker images, and student video recordings)
*   **AI Service:** Firebase Cloud Functions + OpenAI/Gemini REST API

---

## 📂 Project Structure

```text
LucidLab/
├── Designer/              # React Web Application (Instructor Dashboard & Editor)
├── EduARPlayer/           # Unity Mobile AR Project (Student App)
├── EditorRenderer/        # Unity WebGL Project (Live preview embedded in Designer)
├── cloud-functions/       # Firebase Cloud Functions (AI Assistant API, cleanup tasks)
├── shared/                # Shared TypeScript types and VPL schemas
├── docs/                  # Comprehensive architecture specifications & workflows
└── tests/                 # End-to-end and unit testing suites
```
*(For a deep dive into the architecture, database schema, APIs, and workflows, see the Markdown files in the `/docs` directory).*

---

## 🚀 Getting Started

### Prerequisites
*   Node.js (v18+)
*   Unity Hub & Unity 2022.3.x LTS (with Android/iOS build support)
*   Firebase CLI

### Running the Designer (Web)
1. Navigate to the `Designer` directory: `cd Designer`
2. Install dependencies: `npm install`
3. Add your Firebase configuration to `src/firebaseConfig.ts`
4. Start the development server: `npm start`

### Running the Player (Mobile AR)
1. Open the `EduARPlayer` folder in Unity Hub.
2. Ensure you have the XR Plugin Management and AR Foundation packages installed.
3. Sync your Firebase configuration (`google-services.json` / `GoogleService-Info.plist`).
4. Build and Run to a physical Android or iOS device (AR requires a physical camera).

---

## 🛡️ Security & Privacy
*   **Role-Based Access:** Enforced via Firebase Firestore Security Rules. Students cannot modify experiment definitions; instructors can only view their own classrooms.
*   **Data Isolation:** Join-code architecture ensures classroom data is completely walled off from unauthorized users.
*   **Secure Submissions:** Student video recordings are locked to the specific instructor's viewing privileges.

---

## 📄 License
This project is proprietary. See the `LICENSE` file for details.
