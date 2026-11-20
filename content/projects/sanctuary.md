---
reviewed: false
sources:
  - design/source/github.md
  - https://github.com/Kushal-Shr/NLN (README)
---

<!--
  TEAM PROJECT: four contributors (Arjit Karki, Diya Basnet, Kushal Shrestha, Shrijan Paudel).
  Everything below describes what the team built. Kushal's own part is still unknown:
  the project page shows it as a placeholder until he adds it in content/projects.ts.
-->

## the problem

Mental-health stigma keeps people from asking for help. Clinical language often fails the people it's meant for, seeking help leaves a trace, and most platforms make support feel cold and complicated.

## what we built

Sanctuary is a stealth mental-health platform. It doesn't look like a health app; it feels like a wisdom library, a circle of trusted guides and a private journal you own. Four of us built it in two days, March 28–29, 2026.

- **cultural reframing engine:** Gemini translates clinical terms into culturally resonant language. Anxiety becomes "Restless Spirit", and burnout becomes "Burning Edge". Clinical labels never reach the user.
- **the inner ledger:** private journaling with a daily writing prompt, an energy slider in place of a clinical mood scale, and an AI "wisdom nugget" drawn from each entry. Entries can self-destruct after 24 hours.
- **sanctuary circles:** anonymous group sessions over encrypted video, like meditation, yoga and expert Q&As. You can join with the camera off and your name replaced by an avatar.
- **sacred connections:** private 1-on-1 chat with mentors in four tiers, from professionals to peers, with encrypted voice and video calls.

## how it works

- **Next.js 15** with the App Router and server actions, in TypeScript and Tailwind CSS
- **Prisma and PostgreSQL** for storage
- **Gemini** behind API routes, for reframing, daily prompts and wisdom nuggets
- **LiveKit** for the encrypted group and 1-on-1 video
- **Privacy by default:** no real name, email or phone number is required. A Quick Exit button (or `Esc`) on every page jumps to a neutral site, and "Nuke Session" wipes local chat state instantly.

<!-- TODO(kushal): which parts did you build? Was this a hackathon (the 2-day timeline suggests one)? Which event, and any result? -->
