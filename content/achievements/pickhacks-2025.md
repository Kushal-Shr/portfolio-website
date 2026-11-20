---
reviewed: false
sources:
  - design/source/resume.md
  - https://devpost.com/software/imposter-akmlfj (PickHacks 2025)
---

## the challenge

PickHacks 2025, at Missouri S&T. Our team of four wanted a game that gets people off the couch: the strategy and social deduction of a video game, played by walking around in the real world.

## what we built

**Imposter**, a real-life Among Us. Players carry their phones, complete tasks around a physical space, and try to find the impostors before it's too late.

- **React Native** for the mobile app, designed in Figma
- **Firebase** for the backend and real-time game state
- **NFC** for physical interactions, like tasks and eliminations
- **Bluetooth Low Energy** for proximity between players, estimated from signal strength
- **a voice channel** for the discussions, and **a live map** of player positions

<!-- TODO(kushal): which parts did you build? The Devpost lists your teammates' roles but not yours. -->

## how it went

It won the **Community Vote**.

Getting there meant fighting NFC reading and writing, measuring distance from Bluetooth signal strength, and debugging across React Native, maps, location tracking and voice. We still reached a working MVP within the hackathon.
