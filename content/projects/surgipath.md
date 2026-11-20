---
reviewed: false
sources:
  - design/source/resume.md
  - https://github.com/Kushal-Shr/SurgiPath (README)
---

## the problem

SurgiPath makes learning surgical instruments and setup steps hands-on: you hold up the instrument, and the app checks it off and teaches you something about it.

## what I built

I built SurgiPath at HackSLU 2026 with a teammate, An. It's an AI surgical training simulator:

1. **Pick a module:** laparoscopic appendectomy, basic suturing or cataract tray setup.
2. **Gemini writes a syllabus:** a 3-step training plan with the target instrument, the task and a pro-tip for each step.
3. **The camera watches:** when the right instrument is detected, its step turns green, the next one activates, and a tutor's message shows the clinical pro-tip.

A later version adds a full flow: a Pre-Op checklist checked from the webcam, Intra-Op phase rules, and Post-Op analytics built from an event log.

<!-- TODO(kushal): which parts did you build, and which did An build? -->

## how it works

- **The UI** is Streamlit. Video comes through streamlit-webrtc, OpenCV and PyAV.
- **The syllabus** comes from Gemini, validated with Pydantic, so a malformed answer can't break the app. Built-in syllabi make it work offline too.
- **Detection:** the first version simulated it with an animated "lock-on" box every ~5 seconds, while we compared real computer-vision approaches for instrument tracking. The later flow runs a YOLO model on the webcam feed.
- **Threads:** the video callback runs on its own thread. Detections reach the Streamlit thread through a thread-safe queue, and that's what advances the checklist.
- **Logging:** every event goes to a JSONL log, which the Post-Op analytics read.

## what was hard

Real-time instrument tracking. We researched and compared existing approaches before committing to one, and kept a simulated detector so the training loop could be built and demoed in the meantime.

<!-- TODO(kushal): how did HackSLU go for you? Any result to mention? -->
