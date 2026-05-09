# LucidLab Report (LaTeX)

This folder contains the submission-ready LaTeX source for the project report.

## Build

From the repository root:

```bash
cd report
pdflatex main.tex
pdflatex main.tex
```

Or with latexmk:

```bash
cd report
latexmk -pdf main.tex
```

Output PDF: `report/main.pdf`

## Figure Inputs

Put storyboard and screenshot files in `report/figures/` using these names:

- `storyboard_frame_1.jpg` ... `storyboard_frame_6.jpg`
- `app_screenshot_1.jpg` ... `app_screenshot_5.jpg`

If files are missing, the document still compiles and shows labeled placeholders.

### Storyboard frames (order and app screens)

Aligned with `LucidLab/Assets/StreamingAssets/`:

1. `storyboard_frame_1.jpg` — Splash (`splash_screen.html`)
2. `storyboard_frame_2.jpg` — Login (`login_screen.html`)
3. `storyboard_frame_3.jpg` — Home “My Classrooms” (`dashboard.html`)
4. `storyboard_frame_4.jpg` — Classroom + Select Scene (`classroom_detail.html`, `ar_scene_picker.html`)
5. `storyboard_frame_5.jpg` — AR instruction overlay (`ar_instruction.html`)
6. `storyboard_frame_6.jpg` — Submit confirmation (`ar_submit_confirm.html`)
