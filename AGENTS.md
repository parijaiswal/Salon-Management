AGENTS.md - Salon Queue Management

Queue app for a salon: customers join from their phone, see their wait time and get called; reception and barbers manage the queue; a TV shows the live status.

Read first
docs/01-brief.md -> features and what NOT to build
docs/02-screens.md -> every screen's layout and behaviour
docs/03-flows-rules.md -> flows, queue rules, test checklist
Stack

React + Vite + Tailwind CSS. Run with npm run dev. Choose the simplest storage that keeps phone, tablet and TV in sync (explain your choice before using it). Hosting: Vercel (frontend); Render or Railway if a backend is needed. The live link must be the first line after the title in README.md, followed by the test PIN.

How to work
One screen or one feature per task. Don't touch other screens.
Theme (light): cream background #FFF7ED, burgundy accent #7F1D1D for buttons, badges and highlights, white cards, dark text #292524, cream text on burgundy buttons; rounded cards; tap targets at least 44px.
All labels come from the EN/GU language file; no hard-coded text.
Queue rules live in ONE place in the code; reuse them everywhere.
Never add features from the "Don't build" list.
If something in the docs is unclear, ask before guessing.
After each task: list changed files and how to test the change.