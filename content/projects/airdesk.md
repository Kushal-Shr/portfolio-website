---
reviewed: false
sources:
  - https://github.com/Kushal-Shr/AirDesk (README and repo description)
---

## the problem

What if your hands were the mouse? AirDesk controls a Mac without touching it: you move the pointer, click, scroll, switch apps and even write text in the air.

## what I built

A macOS app, built in stages, where each stage was tested in preview before it could touch the real mouse or keyboard:

1. a webcam preview
2. hand tracking with 21 landmarks per hand
3. a hand lock: a fist means locked
4. a virtual cursor, shown on screen only
5. real mouse movement
6. click, double click, drag, right click and scroll
7. swipes for Mission Control and switching apps
8. air writing on a transparent overlay
9. handwriting recognition that types into whatever app is focused

On top of that sit an Air Command Palette, opened with a gesture, and a live guide panel listing every gesture.

## how it works

- **Tracking:** MediaPipe finds the hand landmarks, and OpenCV and NumPy turn them into gestures. Distances are normalized to the size of your hand, so gestures work near the camera or far from it.
- **Controls:** your left index finger moves the pointer, and right-hand pinches click, double-click, drag and right-click.
- **Writing:** a pinch puts the pen down. After two seconds without new ink, AirDesk splits the line into characters by finding the blank columns between them. A CNN classifies each character: 83 classes of letters, digits and symbols, trained on EMNIST plus samples of my own handwriting.
- **Confidence gate:** text is typed only if the mean confidence is at least 90%. A lower-confidence line can optionally go to Gemini, and only the cropped ink is sent, never the camera feed or the screen.
- **Speed:** camera capture runs on its own thread and keeps only the latest frame, so slow inference drops frames instead of lagging behind your hand.

## what was hard

Safety. Software that drives the real mouse can go wrong fast, so AirDesk starts in a safe preview, `M` deliberately turns output on, and `Esc` stops everything from any app. A fist releases a held drag.

Telling a double click from a single click without firing both took some care too: AirDesk waits briefly after the first pinch to see whether a second one follows.

The first handwriting model read one capital letter at a time and reached 93.57% accuracy on held-out EMNIST data. Whole-line recognition came later, with a merged model trained on EMNIST plus my own samples, collected with a training mode built into the app.

<!-- TODO(kushal): what's next for AirDesk? -->
