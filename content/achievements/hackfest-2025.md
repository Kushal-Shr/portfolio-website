---
reviewed: false
sources:
  - design/source/resume.md
  - https://devpost.com/software/rant-and-heal (Webster Hackfest 2025)
---

## the challenge

Webster Hackfest 2025, at Webster University. Many people carry emotional weight in silence, because they can't reach a therapist or don't feel comfortable talking to someone. I wanted a space where anyone could speak freely, feel heard and start healing.

## what I built

Rant & Heal, solo: an AI mental-health platform with three steps, speak → feel heard → book real help.

- **let it go:** a private space to type out what's on your mind
- **MomoBuddy:** real-time voice conversations with an empathetic AI companion, built on Gemini with Vapi for the voice
- **real therapists:** book an appointment with a date, a time and a note about what's going on

It ran on Next.js, Clerk for sign-in, Firebase Firestore, and Tailwind CSS with shadcn/ui.

## how it went

It won **Best Overall Project**.

Not everything went smoothly. Reading the signed-in user on the server, to link them to their data in Firebase, was harder than expected, and voice transcription wasn't always accurate enough for natural replies. I cut real-time emotion analysis and a therapist dashboard to finish.

The two lessons I took away: keeping several services in sync across the client/server boundary is its own skill, and in a tool for emotional health, even button text and colors matter.

The project kept going after the hackathon. The current version is a full rebuild; see the project page.
