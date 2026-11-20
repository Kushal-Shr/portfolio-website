---
reviewed: false
sources:
  - design/source/resume.md
  - https://github.com/Kushal-Shr/rant-and-heal-v2 (README)
  - https://devpost.com/software/rant-and-heal (Webster Hackfest 2025)
---

## the problem

A lot of people carry things they never say out loud. A therapist can be expensive, hard to reach, or simply too big a first step. I wanted a place where you can vent first, feel heard, and then get real help when you're ready.

## what I built

The first version came together at Webster Hackfest 2025, where it won Best Overall. It had three paths:

- **let it go:** type out what's on your mind, privately
- **talk to Momo:** a real-time voice conversation with an empathetic AI companion
- **book a therapist:** pick a date and time and leave a note about what you're going through

The version on GitHub today, v2, is a rebuild of that idea. It's a privacy-first platform for two kinds of users, patients and therapists. AI support sits alongside real care: a patient and their therapist get realtime chat and WebRTC calls.

## how it works

- **Next.js + Firebase.** Firebase Auth handles both roles, and Firestore rules scope every record. Messages, calls and consent live under one patient–therapist relationship, so a future therapist can never read an earlier one.
- **An encrypted journal.** Entries are encrypted in the browser with AES-256-GCM before Firestore ever sees them. The key is derived from a passphrase with PBKDF2, and the passphrase is never stored.
- **AI that never reads your journal.** Weekly reports are built from coarse counts, like entry length and time of day, plus choices the user makes explicitly. Gemini never receives journal text.
- **Safety before conversation.** Every message to Momo first passes a deterministic safety check and a Gemini classifier. Anything outside "normal" skips the ordinary reply, and immediate risk sends the user to a crisis page. A reviewer dashboard tracks the cases that need a human.
- **Verified therapists only.** Signing up as a practitioner creates a pending application. A staff member has to verify it before the therapist appears in the directory.

Momo's replies and voice now run on OpenAI models. The safety checks, reports and notes stay on Gemini.

## what was hard

At the hackathon, the hard parts were linking the signed-in user to their data on the server, and voice transcription that wasn't always accurate. I also had to cut emotion analysis and a therapist dashboard to finish in time.

In v2, the hard part is safety: deciding what the AI must never do, and making sure a risky conversation always reaches a safe response. This isn't a clinically validated service, and the README says so. Voice mode stays off by default until it passes a real-audio acceptance test.

## what I'd do next

- Add a TURN relay so therapist calls work on restrictive and mobile networks. Today they rely on a public STUN server only.
- Finish the real-audio acceptance test, so Momo's voice mode can be switched on.

<!-- TODO(kushal): anything else next for v2? And one line on why you rebuilt it after the hackathon. -->
