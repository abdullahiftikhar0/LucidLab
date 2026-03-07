# LucidLab — Presentation Prototype Screens

> Hand-drawn wireframe descriptions for all key screens. These serve as templates that team members will hand-draw on paper for the presentation.
>
> **Presentation Duration:** 5–7 minutes  
> **Coverage:** Idea Development, Storyboarding, and Initial Prototyping

---

## Screen Map (All Screens)

```
DESIGNER (Web — 7 screens)          PLAYER (Mobile — 7 screens)
─────────────────────────          ─────────────────────────────
1. Login / Register                8. Login / Register (mobile)
2. Dashboard (Classrooms)          9. Classroom List
3. Classroom Detail                10. Experiment List (in classroom)
4. Experiment Editor (Scene)       11. AR Experiment View
5. VPL Editor                      12. Experiment Interaction
6. AI Assistant Panel              13. Submission Screen
7. Evaluation Dashboard            14. Quiz Overlay (in AR)
```

---

## DESIGNER SCREENS (Web App — for Instructor)

---

### Screen 1: Login / Register

```
┌──────────────────────────────────────────────────────────┐
│                         LucidLab                            │
│                    ┌──────────────┐                       │
│                    │   📐 Logo    │                       │
│                    └──────────────┘                       │
│                                                          │
│            ┌────────────────────────────┐                │
│            │  Email: [______________]  │                │
│            │  Password: [___________]  │                │
│            │                           │                │
│            │  Role: (●) Instructor     │                │
│            │        ( ) Student        │                │
│            │                           │                │
│            │    [ 🔑 LOGIN ]           │                │
│            │                           │                │
│            │  ── or sign in with ──    │                │
│            │    [ G  Google SSO ]       │                │
│            │                           │                │
│            │  Don't have an account?   │                │
│            │  → Register here          │                │
│            └────────────────────────────┘                │
│                                                          │
│         "Augmented Reality Science Experiments"           │
└──────────────────────────────────────────────────────────┘
```

**Hand-draw notes:** Center the logo. Simple form with two input fields. Radio buttons for role. Big login button. Google SSO optional.

---

### Screen 2: Dashboard (Classroom List)

```
┌──────────────────────────────────────────────────────────────┐
│  ☰ LucidLab Designer          🔔  👤 Dr. Sarah Khan  ▼        │
├──────────┬───────────────────────────────────────────────────┤
│          │                                                    │
│  📊 Home │   MY CLASSROOMS              [ + New Classroom ]  │
│          │                                                    │
│  🏫 Class│   ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│          │   │ 🧪       │  │ ⚡       │  │ 🧬       │      │
│  🧪 Exp  │   │Chemistry │  │ Physics  │  │ Biology  │      │
│          │   │Grade 10-A│  │Grade 11-B│  │Grade 9-C │      │
│  📊 Eval │   │          │  │          │  │          │      │
│          │   │32 students│  │28 students│  │35 students│     │
│  🤖 AI   │   │4 expts   │  │2 expts   │  │3 expts   │      │
│          │   │Code:     │  │Code:     │  │Code:     │      │
│          │   │CHEM-10A  │  │PHYS-11B  │  │BIO-9C   │      │
│          │   └──────────┘  └──────────┘  └──────────┘      │
│          │                                                    │
│          │   RECENT EXPERIMENTS                               │
│          │   ┌──────────────────────────────────────────┐    │
│          │   │ Acid-Base Neutralization  │ Published ✅  │    │
│          │   │ Ohm's Law Circuit         │ Draft ✏️      │    │
│          │   │ Cell Division             │ Published ✅  │    │
│          │   └──────────────────────────────────────────┘    │
└──────────┴───────────────────────────────────────────────────┘
```

**Hand-draw notes:** Left sidebar with icons. Grid of classroom cards. Each card shows name, student count, experiment count, join code. Recent experiments table below.

---

### Screen 3: Classroom Detail

```
┌──────────────────────────────────────────────────────────────┐
│  ← Back    Chemistry Grade 10-A                              │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  JOIN CODE: [ CHEM-10A ]  📋 Copy   🔄 Regenerate            │
│                                                               │
│  ┌─── STUDENTS (32) ──────────────────────────────────────┐  │
│  │  👤 Ahmed Ali          ✅ Active    [ ✕ Remove ]       │  │
│  │  👤 Fatima Khan        ✅ Active    [ ✕ Remove ]       │  │
│  │  👤 Hassan Raza        ✅ Active    [ ✕ Remove ]       │  │
│  │  👤 ... (29 more)                                      │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌─── EXPERIMENTS ────────────────────────────────────────┐  │
│  │  🧪 Acid-Base Neutralization    │ 28/32 submitted      │  │
│  │  🧪 Titration Lab               │ 12/32 submitted      │  │
│  │                                                        │  │
│  │  [ + Assign Experiment ]                               │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

**Hand-draw notes:** Big join code box at top. Student list with remove buttons. Experiment list with submission counts. "Assign Experiment" button.

---

### Screen 4: Experiment Editor (Scene Editor)

```
┌──────────────────────────────────────────────────────────────────┐
│  Experiment: Acid-Base Neutralization    [ Save ] [ Publish ]    │
├────────────┬──────────────────────────┬──────────────────────────┤
│ ASSET      │    SCENE CANVAS          │  PROPERTIES              │
│ LIBRARY    │                          │                          │
│            │    ┌─────┐    ┌─────┐    │  Selected: Beaker A      │
│ 🧪 Beaker │    │     │    │     │    │  ─────────────────       │
│ 🔥 Burner │    │Beakr│    │Beakr│    │  Label: [HCl_____]      │
│ 🌡️ Thermo │    │  A  │    │  B  │    │  Color: [🔴 Red__]      │
│ 📊 pH     │    │     │    │     │    │  Fill:  [===70%==]       │
│ 💨 Smoke  │    └─────┘    └─────┘    │  Marker: [marker_01 ▼]  │
│            │                          │  Size: [1.0] [1.0] [1.0]│
│  (drag to  │    🌡️ Thermometer       │                          │
│   canvas)  │    📊 pH Meter          │  ─────────────────       │
│            │                          │  [ Delete Object ]       │
├────────────┴──────────────────────────┴──────────────────────────┤
│  Tabs: [ Scene Editor ] [ VPL Editor ] [ Preview ]              │
└──────────────────────────────────────────────────────────────────┘
```

**Hand-draw notes:** Three-panel layout. Left = draggable assets. Center = 2D canvas with objects. Right = property inspector. Tab bar at bottom to switch modes.

---

### Screen 5: VPL (Visual Programming) Editor

```
┌──────────────────────────────────────────────────────────────────┐
│  VPL Editor: Acid-Base Neutralization                            │
├────────────┬─────────────────────────────────────────────────────┤
│ NODE       │                                                      │
│ PALETTE    │   ┌─────────────┐         ┌─────────────────┐       │
│            │   │ 🔵 TRIGGER  │────────▶│ 🟢 ACTION       │       │
│ TRIGGERS   │   │ Marker      │         │ Play Animation  │       │
│ ──────     │   │ Proximity   │         │ "pour"          │       │
│ 🔵 Marker  │   │ HCl + NaOH │         │ on Beaker A     │       │
│ 🔵 Tap     │   └─────────────┘         └────────┬────────┘       │
│ 🔵 Tilt    │                                     │               │
│ 🔵 Timer   │                           ┌────────▼────────┐       │
│ 🔵 Proxim  │                           │ 🟢 ACTION       │       │
│            │                           │ Change Color    │       │
│ CONDITIONS │                           │ Red → Green     │       │
│ ──────     │                           │ on Beaker B     │       │
│ 🟡 Compare│                           └────────┬────────┘       │
│ 🟡 State  │                                     │               │
│            │                           ┌────────▼────────┐       │
│ ACTIONS    │                           │ 🟢 ACTION       │       │
│ ──────     │                           │ Particle Effect │       │
│ 🟢 Animate│                           │ "bubbles"       │       │
│ 🟢 Color  │                           └────────┬────────┘       │
│ 🟢 Label  │                                     │               │
│ 🟢 Sound  │                           ┌────────▼────────┐       │
│ 🟢 Particle                           │ 🟢 ACTION       │       │
│            │                           │ Update Display  │       │
│            │                           │ pH: 2 → 7      │       │
│            │                           └─────────────────┘       │
├────────────┴─────────────────────────────────────────────────────┤
│  Tabs: [ Scene Editor ] [ VPL Editor ] [ Preview ]              │
└──────────────────────────────────────────────────────────────────┘
```

**Hand-draw notes:** Left = node palette grouped by type (blue/yellow/green). Center = canvas with connected node blocks. Draw arrows between blocks. Color-code blocks.

---

### Screen 6: AI Assistant Panel

```
┌──────────────────────────────────────────────────────────────────┐
│  VPL Editor                               │ 🤖 AI Assistant     │
│                                           ├─────────────────────│
│  (existing VPL canvas)                    │ 💬 Chat             │
│                                           │                     │
│                                           │ You:                │
│                                           │ "Add particle       │
│                                           │  effect when HCl    │
│                                           │  meets NaOH"        │
│                                           │                     │
│                                           │ 🤖 AI:              │
│                                           │ "I'll add a         │
│                                           │  Marker Proximity   │
│                                           │  trigger → Particle │
│                                           │  Effect action."    │
│                                           │                     │
│                                           │ ┌─────────────────┐ │
│                                           │ │ Suggested VPL:  │ │
│                                           │ │ 🔵 Proximity →  │ │
│                                           │ │ 🟢 Particles    │ │
│                                           │ │                 │ │
│                                           │ │ [Accept] [Edit] │ │
│                                           │ └─────────────────┘ │
│                                           │                     │
│                                           │ [Type message... ]  │
│                                           │              [Send] │
└───────────────────────────────────────────┴─────────────────────┘
```

**Hand-draw notes:** Split screen — VPL editor on left, AI chat on right. Show a chat bubble from user, a response from AI, and a "Suggested VPL" card with Accept/Edit buttons.

---

### Screen 7: Evaluation Dashboard

```
┌──────────────────────────────────────────────────────────────────┐
│  📊 Evaluation: Acid-Base Neutralization                         │
│  Classroom: Chemistry Grade 10-A                                 │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  SUBMISSIONS (28 / 32 students)         Filter: [All ▼]          │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ 👤 Ahmed Ali      │ 🕐 Mar 5, 2:30pm │ ⏳ Pending        │  │
│  │    ▶️ View Recording │ Quiz: 4/5       │ [ Grade ▼ ]       │  │
│  ├────────────────────────────────────────────────────────────│  │
│  │ 👤 Fatima Khan    │ 🕐 Mar 5, 3:15pm │ ✅ Correct        │  │
│  │    ▶️ View Recording │ Quiz: 5/5       │ Graded ✓          │  │
│  ├────────────────────────────────────────────────────────────│  │
│  │ 👤 Hassan Raza    │ 🕐 Mar 4, 1:00pm │ 🔄 Needs Revision │  │
│  │    ▶️ View Recording │ Quiz: 2/5       │ [ Re-grade ▼ ]    │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ── SELECTED: Ahmed Ali ──                                        │
│  ┌──────────────────────────────────────────────────────────────┐│
│  │  📹 Recording Player   │  Experiment State                  ││
│  │  ┌──────────────────┐  │  Steps: 5/7 completed              ││
│  │  │                  │  │  pH: 7 ✅                           ││
│  │  │   ▶ Video        │  │  Temperature: 42°C                  ││
│  │  │                  │  │                                     ││
│  │  └──────────────────┘  │  Grade: [ ✅ Correct        ▼ ]    ││
│  │                        │  Feedback: [Great work!______]      ││
│  │                        │         [ 💾 Save Grade ]           ││
│  └──────────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────┘
```

**Hand-draw notes:** List of submissions at top. Selected submission expands below with video player, state data, and grading controls. Dropdown for Correct/Incorrect/Revision.

---

## PLAYER SCREENS (Mobile App — for Student)

---

### Screen 8: Login / Register (Mobile)

```
┌─────────────────────────┐
│        LucidLab Player     │
│                         │
│     ┌───────────────┐   │
│     │   📐 Logo     │   │
│     └───────────────┘   │
│                         │
│  Email:                 │
│  ┌───────────────────┐  │
│  │                   │  │
│  └───────────────────┘  │
│                         │
│  Password:              │
│  ┌───────────────────┐  │
│  │                   │  │
│  └───────────────────┘  │
│                         │
│  ┌───────────────────┐  │
│  │    🔑 LOGIN       │  │
│  └───────────────────┘  │
│                         │
│  New here? Register →   │
│                         │
└─────────────────────────┘
```

---

### Screen 9: Classroom List (Mobile)

```
┌─────────────────────────┐
│  My Classrooms    [ + ] │
│─────────────────────────│
│                         │
│  ┌───────────────────┐  │
│  │ 🧪 Chemistry     │  │
│  │    Grade 10-A     │  │
│  │    4 experiments  │  │
│  │    Dr. Sarah Khan │  │
│  └───────────────────┘  │
│                         │
│  ┌───────────────────┐  │
│  │ ⚡ Physics        │  │
│  │    Grade 10-A     │  │
│  │    2 experiments  │  │
│  │    Mr. Ali Ahmad  │  │
│  └───────────────────┘  │
│                         │
│  ┌───────────────────┐  │
│  │ 🧬 Biology       │  │
│  │    Grade 9-C      │  │
│  │    3 experiments  │  │
│  │    Ms. Zara Malik │  │
│  └───────────────────┘  │
│                         │
│  [ Join Classroom ]     │
│  Enter code: [_______]  │
│                         │
└─────────────────────────┘
```

---

### Screen 10: Experiment List (in Classroom)

```
┌─────────────────────────┐
│  ← Chemistry Grade 10-A │
│─────────────────────────│
│                         │
│  Assigned Experiments:  │
│                         │
│  ┌───────────────────┐  │
│  │ 🧪 Acid-Base      │  │
│  │    Neutralization  │  │
│  │    ✅ Submitted    │  │
│  │    Grade: Correct  │  │
│  └───────────────────┘  │
│                         │
│  ┌───────────────────┐  │
│  │ 🧪 Titration Lab  │  │
│  │                   │  │
│  │    ⏳ Not started  │  │
│  │    [ ▶ START ]    │  │
│  └───────────────────┘  │
│                         │
│  ┌───────────────────┐  │
│  │ 🧪 Gas Laws      │  │
│  │                   │  │
│  │    🔄 In progress │  │
│  │    [ ▶ CONTINUE ] │  │
│  └───────────────────┘  │
│                         │
└─────────────────────────┘
```

---

### Screen 11: AR Experiment View

```
┌─────────────────────────┐
│  ← Acid-Base          📹│
│─────────────────────────│
│                         │
│   ╔═══════════════════╗ │
│   ║                   ║ │
│   ║   CAMERA VIEW     ║ │
│   ║                   ║ │
│   ║  ┌───┐   ┌───┐   ║ │
│   ║  │🧪 │   │🧪 │   ║ │
│   ║  │HCl│   │NaO│   ║ │
│   ║  │   │   │H  │   ║ │
│   ║  └───┘   └───┘   ║ │
│   ║   (3D objects     ║ │
│   ║    on markers)    ║ │
│   ║                   ║ │
│   ╚═══════════════════╝ │
│                         │
│  "Point camera at       │
│   marker sheet"         │
│                         │
│  ┌───────────────────┐  │
│  │   📤 SUBMIT       │  │
│  └───────────────────┘  │
│                         │
└─────────────────────────┘
```

**Hand-draw notes:** Full-screen camera feed with 3D objects floating on markers. Record button in corner. Submit button at bottom. Instructions as floating text.

---

### Screen 12: Experiment Interaction (AR Close-up)

```
┌─────────────────────────┐
│  Acid-Base Neutralization│
│─────────────────────────│
│                         │
│   ╔═══════════════════╗ │
│   ║                   ║ │
│   ║    💧 Pouring...  ║ │
│   ║   ┌───┐  ┌───┐   ║ │
│   ║   │   │→→│   │   ║ │
│   ║   │HCl│  │NaO│   ║ │
│   ║   │   │  │ H │   ║ │
│   ║   └───┘  └───┘   ║ │
│   ║                   ║ │
│   ║   🟢 Color: Green ║ │
│   ║   ○○○ Bubbles ○○○ ║ │
│   ║   pH: 7 ✅         ║ │
│   ║   Temp: 42°C ↑    ║ │
│   ║                   ║ │
│   ╚═══════════════════╝ │
│                         │
│  "Neutralization        │
│   Complete! pH = 7"     │
│                         │
└─────────────────────────┘
```

**Hand-draw notes:** Show the reaction happening. Pour animation arrow. Color change. Bubble particles. Floating labels for pH and temperature. Success message.

---

### Screen 13: Submission Screen

```
┌─────────────────────────┐
│  Submit Experiment      │
│─────────────────────────│
│                         │
│  ✅ Experiment Complete  │
│                         │
│  Summary:               │
│  ┌───────────────────┐  │
│  │ Steps: 7/7 ✅      │  │
│  │ pH reached: 7     │  │
│  │ Time: 3:24        │  │
│  └───────────────────┘  │
│                         │
│  Recording:             │
│  ┌───────────────────┐  │
│  │ ▶ Preview (3:24)  │  │
│  │   📹 Attached ✓   │  │
│  └───────────────────┘  │
│                         │
│  ┌───────────────────┐  │
│  │  📤 SUBMIT NOW    │  │
│  └───────────────────┘  │
│                         │
│  [ ← Back to Experiment]│
│                         │
└─────────────────────────┘
```

---

### Screen 14: Quiz Overlay (in AR)

```
┌─────────────────────────┐
│  🧠 Quiz                │
│─────────────────────────│
│                         │
│  Question 1 of 5:       │
│                         │
│  "What color does the   │
│   indicator turn at     │
│   neutral pH?"          │
│                         │
│  ┌───────────────────┐  │
│  │  A) Red           │  │
│  └───────────────────┘  │
│  ┌───────────────────┐  │
│  │  B) Green  ←✅    │  │
│  └───────────────────┘  │
│  ┌───────────────────┐  │
│  │  C) Blue          │  │
│  └───────────────────┘  │
│  ┌───────────────────┐  │
│  │  D) Yellow        │  │
│  └───────────────────┘  │
│                         │
│  Score: 1/1             │
│  [ Next → ]             │
│                         │
└─────────────────────────┘
```

---

## Presentation Storyboard Flow

The following order maps to the 5–7 minute presentation:

| Slide | Content | Duration |
|---|---|---|
| 1 | **Project Introduction** — LucidLab title, team members, problem statement | 30s |
| 2 | **Problem** — Safety, cost, repeatability in science education | 45s |
| 3 | **Proposed Solution** — Two-sided AR platform concept | 45s |
| 4 | **Target Users** — Teachers (designers) and students (players) | 20s |
| 5 | **System Architecture** — Designer + Player + Cloud diagram | 40s |
| 6 | **Classroom Workflow** — Show Screen 2→3 flow (classroom creation) | 30s |
| 7 | **Experiment Design** — Show Screen 4→5→6 flow (scene + VPL + AI) | 60s |
| 8 | **Student Experience** — Show Screen 9→10→11→12 flow (join → AR) | 60s |
| 9 | **Submission & Evaluation** — Show Screen 13→14→7 flow | 30s |
| 10 | **Technology Stack** — Unity, React, Firebase, AR Foundation | 20s |
| 11 | **Example Experiment** — Acid-Base Neutralization walkthrough | 40s |
| 12 | **Future Plan (Phase 1)** — AI assistant, sandbox mode, collaborative AR | 30s |

**Total: ~6 minutes**
