# EduAR — Platform Workflows

> Complete workflow descriptions for all user journeys in the classroom-based EduAR platform.

---

## 1. Instructor Registration & Setup

```mermaid
flowchart TD
    A[Instructor opens EduAR Designer] --> B[Register / Login]
    B --> C[Create profile<br/>Name, Institution, Avatar]
    C --> D[Dashboard loads]
    D --> E{First time?}
    E -->|Yes| F[Create first Classroom]
    E -->|No| G[View existing Classrooms]
```

**Steps:**
1. Instructor opens EduAR Designer web app in browser
2. Registers with email/password or Google SSO
3. Selects role = "Instructor" during registration
4. Fills in profile (name, institution)
5. Arrives at Dashboard showing classrooms and experiments

---

## 2. Classroom Creation Workflow

```mermaid
flowchart TD
    A[Instructor clicks 'New Classroom'] --> B[Enter classroom details]
    B --> C[Name, Subject, Description]
    C --> D[System generates join code<br/>e.g. CHEM-10A]
    D --> E[Classroom created in Firestore]
    E --> F[Instructor shares join code<br/>with students]
    F --> G[Students join from Player app]
```

**Steps:**
1. Instructor clicks **"+ New Classroom"** on dashboard
2. Enters: name, subject, description, optional cover image
3. System generates unique 6-character join code
4. Classroom document created in Firestore
5. Instructor shares the join code with students (verbally, on board, or via messaging)
6. Join code can be regenerated or deactivated at any time

---

## 3. Student Joins Classroom

```mermaid
flowchart TD
    A[Student opens EduAR Player] --> B[Login / Register]
    B --> C[Student role selected]
    C --> D[Student taps 'Join Classroom']
    D --> E[Enter join code]
    E --> F{Code valid?}
    F -->|Yes| G[Student added to<br/>classroom members]
    F -->|No| H[Error: Invalid code]
    G --> I[Classroom appears<br/>in student's list]
```

**Steps:**
1. Student opens EduAR Player on their smartphone
2. Registers or logs in
3. Taps **"Join Classroom"** button
4. Enters the 6-character join code
5. System validates the code against Firestore
6. On success, student is added to `classrooms/{id}/members`
7. Classroom appears in the student's classroom list

---

## 4. Experiment Design Workflow

```mermaid
flowchart TD
    A[Instructor clicks 'New Experiment'] --> B[Select category<br/>Chemistry / Physics / Biology]
    B --> C[Scene Editor opens]
    C --> D[Drag 3D objects from<br/>Asset Library]
    D --> E[Set object properties<br/>color, size, label]
    E --> F[Assign markers to objects]
    F --> G[Open VPL Editor]
    G --> H[Drag trigger blocks<br/>condition blocks<br/>action blocks]
    H --> I[Connect nodes with edges]
    I --> J{Need AI help?}
    J -->|Yes| K[Open AI Panel<br/>Ask for VPL suggestions]
    K --> L[AI generates VPL nodes]
    L --> M[Accept / modify suggestions]
    M --> I
    J -->|No| N[Click Preview]
    N --> O[Unity WebGL renders<br/>live 3D preview]
    O --> P[Test VPL logic in preview]
    P --> Q{Satisfied?}
    Q -->|No| C
    Q -->|Yes| R[Click Publish]
```

**Steps:**
1. Instructor clicks **"+ New Experiment"** on dashboard
2. Selects experiment category (Chemistry, Physics, Biology, etc.)
3. **Scene Editor** opens:
   - Drag 3D objects from the Asset Library panel
   - Position objects on the scene canvas
   - Set properties for each object (color, size, label, initial state)
   - Assign each object to a marker ID
4. Switch to **VPL Editor**:
   - Drag blocks from the Node Palette
   - **Blue blocks** = Triggers (marker detected, tap, tilt, proximity, timer)
   - **Yellow blocks** = Conditions (compare value, check state, distance check)
   - **Green blocks** = Actions (animate, color change, show label, play sound, particles)
   - Connect blocks by drawing edges between output and input handles
5. Optionally use **AI Assistant**:
   - Click AI panel icon
   - Describe desired behavior in natural language
   - AI generates VPL node suggestions with edges
   - Accept, modify, or discard suggestions
6. Click **Preview** to see in live Unity WebGL renderer
7. Click **Play** to simulate VPL logic
8. Iterate until satisfied

---

## 5. Experiment Publishing Workflow

```mermaid
flowchart TD
    A[Instructor clicks Publish] --> B[Upload 3D assets<br/>to Firebase Storage]
    B --> C[Upload marker images<br/>to Firebase Storage]
    C --> D[Serialize scene + VPL<br/>to JSON]
    D --> E[Save experiment document<br/>to Firestore]
    E --> F[Generate experiment code<br/>e.g. CHEM-042]
    F --> G[Status = 'published']
    G --> H[Assign to classrooms]
    H --> I[Experiment appears in<br/>assigned classrooms]
```

**Steps:**
1. Instructor clicks **"Publish"**
2. System uploads all 3D assets to Firebase Storage
3. System uploads marker reference images
4. Scene data + VPL graph serialized to JSON
5. Experiment document created/updated in Firestore with status `published`
6. Unique experiment code generated (e.g., "CHEM-042")
7. Instructor selects which classrooms to assign the experiment to
8. Experiment appears in selected classroom experiment lists

---

## 6. Experiment Assignment Workflow

```mermaid
flowchart TD
    A[Instructor opens Classroom Detail] --> B[Click 'Assign Experiment']
    B --> C[Select from published<br/>experiment list]
    C --> D[Experiment ID added to<br/>classroom.experimentIds]
    D --> E[Experiment visible to<br/>all classroom students]
```

**Steps:**
1. Instructor opens a classroom detail view
2. Clicks **"Assign Experiment"**
3. Selects one or more published experiments from their list
4. Experiment IDs are added to the classroom's `experimentIds` array
5. Students in that classroom can now see and launch the experiment

---

## 7. Student Experiment Execution Workflow

```mermaid
flowchart TD
    A[Student opens EduAR Player] --> B[Select Classroom]
    B --> C[View assigned experiments]
    C --> D[Tap on experiment]
    D --> E[Download experiment config<br/>from Firestore]
    E --> F[Download 3D assets<br/>from Storage]
    F --> G[Build AR scene]
    G --> H[Student places marker<br/>sheet on desk]
    H --> I[Point phone camera<br/>at markers]
    I --> J[3D objects appear<br/>on markers in AR]
    J --> K[Student interacts:<br/>tap, move, proximity]
    K --> L[VPL logic executes<br/>animations, sounds, labels]
    L --> M{Experiment complete?}
    M -->|Continue| K
    M -->|Done| N[Submit Experiment]
```

**Steps:**
1. Student opens EduAR Player
2. Selects a classroom from their list
3. Views experiments assigned to that classroom
4. Taps on an experiment to start
5. App downloads experiment configuration from Firestore
6. App downloads 3D assets from Firebase Storage (cached locally after first download)
7. App builds the AR scene:
   - Creates scene objects
   - Configures marker reference images
   - Initializes VPL Logic Engine
8. Student places the printed marker sheet on their desk
9. Points phone camera at markers
10. 3D objects appear anchored to markers in AR
11. Student interacts: tap markers, move phone, bring markers together
12. VPL logic executes in real-time: animations, color changes, sounds, particle effects, labels
13. Student can repeat interactions unlimited times

---

## 8. Experiment Submission Workflow

```mermaid
flowchart TD
    A[Student presses 'Submit'] --> B{Recording enabled?}
    B -->|Yes| C[Stop recording<br/>Save video]
    B -->|No| D[Capture experiment state]
    C --> D
    D --> E{Quiz enabled?}
    E -->|Yes| F[Show quiz overlay<br/>Student answers questions]
    F --> G[Calculate quiz score]
    E -->|No| G
    G --> H[Upload recording to<br/>Firebase Storage]
    H --> I[Create submission document<br/>in Firestore]
    I --> J[Notify instructor<br/>via Cloud Function]
    J --> K[Show confirmation<br/>to student]
```

**Submission includes:**
- Experiment state snapshot (completed steps, variable values, completion %)
- AR recording video (if recording was enabled)
- Quiz answers and score (if quiz was enabled)

---

## 9. Instructor Evaluation Workflow

```mermaid
flowchart TD
    A[Instructor opens Dashboard] --> B[Select Classroom]
    B --> C[Select Experiment]
    C --> D[View submission list<br/>with student names]
    D --> E[Click on submission]
    E --> F[View experiment state]
    F --> G{Recording available?}
    G -->|Yes| H[Play student's<br/>AR recording video]
    G -->|No| I[Review state data only]
    H --> J[View quiz results<br/>if applicable]
    I --> J
    J --> K[Assign grade]
    K --> L{Select status}
    L --> M[✅ Correct]
    L --> N[❌ Incorrect]
    L --> O[🔄 Needs Revision]
    M --> P[Optional: write feedback]
    N --> P
    O --> P
    P --> Q[Save grade + feedback<br/>to Firestore]
    Q --> R[Student can see grade<br/>in Player app]
```

**Steps:**
1. Instructor opens the Designer dashboard
2. Selects a classroom
3. Selects an experiment
4. Views list of all student submissions
5. Clicks on a submission to open detail view
6. Reviews:
   - Experiment completion state
   - AR recording video (if available)
   - Quiz answers and score (if enabled)
7. Assigns a status: **Correct**, **Incorrect**, or **Needs Revision**
8. Optionally writes written feedback
9. Saves grade — student can see it in the Player app

---

## 10. AI Assistant Interaction Workflow

```mermaid
flowchart TD
    A[Instructor opens AI Panel<br/>in Designer] --> B[Type question or request]
    B --> C[System bundles:<br/>message + scene context + VPL graph]
    C --> D[Send to AI API<br/>Cloud Function]
    D --> E[LLM processes with<br/>full experiment context]
    E --> F{Response type?}
    F -->|Chat answer| G[Display text response]
    F -->|VPL suggestion| H[Show suggested nodes<br/>as cards]
    H --> I{Accept suggestion?}
    I -->|Yes| J[Insert nodes into<br/>VPL editor]
    I -->|Modify| K[Edit in VPL editor]
    I -->|Reject| L[Dismiss]
    G --> M[Continue conversation]
```

**Example Interactions:**
| User Says | AI Does |
|---|---|
| "How do I make the beaker change color?" | Explains trigger → action flow, suggests nodes |
| "Generate logic for acid-base neutralization" | Creates full VPL subgraph with triggers, conditions, actions |
| "What's wrong with my experiment?" | Analyzes scene for orphaned objects, missing triggers |
| "Add a particle effect when markers are close" | Generates MarkerProximity trigger → ParticleEffect action nodes |
