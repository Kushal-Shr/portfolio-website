import { todo } from './types';
import type { ExtraProject, Project } from './types';

// Widest diagram line: 56 columns. Phase 7 needs this for narrow screens.
const diagrams = {
  rantAndHeal: `┌─────────┐   ┌────────────────┐   ┌───────────┐
│ patient │──▶│ Next.js+Gemini │──▶│ Firestore │
└────┬────┘   │   (RAG)        │   └───────────┘
     │        └────────────────┘
     │ WebRTC · Firebase signaling
┌────▼──────┐
│ therapist │
└───────────┘`,
  rantAndHealWide: `┌─────────┐      ┌──────────────────┐      ┌───────────┐
│ patient │ ───▶ │ Next.js + Gemini │ ───▶ │ Firestore │
└────┬────┘      │      (RAG)       │      └───────────┘
     │           └──────────────────┘
     │  realtime chat + WebRTC calls
┌────▼──────┐    (Firebase signaling)
│ therapist │
└───────────┘`,
  zenith: `┌────────┐   ┌─────────┐   ┌─────┐   ┌──────────┐
│ cursor │──▶│ AST     │──▶│ LLM │──▶│ p5.js    │
│ in code│   │ parser  │   │     │   │ playback │
└────────┘   └─────────┘   └─────┘   └──────────┘`,
  surgipath: `┌────────┐   ┌────────┐   ┌───────────────────┐
│ camera │──▶│ OpenCV │──▶│ checklist + tips  │
└────────┘   └────────┘   └───────────────────┘`,
  airdesk: `┌──────┐   ┌─────────┐   ┌──────────────┐
│ hand │──▶│ webcam  │──▶│ Mac control  │
└──────┘   └─────────┘   │ + whiteboard │
                         └──────────────┘`,
  sanctuary: `┌──────┐   ┌─────────────┐   ┌────────────────────┐
│ user │──▶│ Next.js app │──▶│ Gemini (reframing) │
└──────┘   └──────┬──────┘   └────────────────────┘
                  │
          ┌───────┴─────────────┐
┌─────────▼───────────┐ ┌───────▼───────────────┐
│ Postgres (Prisma)   │ │ LiveKit (video)       │
└─────────────────────┘ └───────────────────────┘`,
};

export const projects: readonly Project[] = [
  {
    slug: 'rant-and-heal',
    name: 'Rant & Heal',
    badge: 'Best Overall · Hackfest 2025',
    badgeTone: 'highlight',
    featured: true,
    tags: ['next.js', 'rag', 'firebase', 'webrtc', 'gemini'],
    summary:
      'Hybrid mental-health app that mixes AI text chat, AI voice and live therapy sessions, powered by Gemini. Won Best Overall Project at Webster Hackfest 2025.',
    shortSummary:
      'AI + human mental-health app, Hackfest 2025 Best Overall (Next.js, Gemini, WebRTC)',
    resumeSummary: 'Hybrid AI + human mental-health app (Gemini text, voice, live therapy).',
    diagram: diagrams.rantAndHeal,
    diagramWide: diagrams.rantAndHealWide,
    diagramAlt:
      'A patient reaches a Next.js and Gemini app that uses retrieval and stores data in Firestore, while a therapist connects to the patient over WebRTC with Firebase signaling.',
    bullets: [
      'hybrid care across AI text, voice and therapy sessions',
      '2-role flows secured with Firebase Auth + Firestore rules',
      '1:1 patient-therapist realtime chat and WebRTC calls',
    ],
    links: { source: 'https://github.com/Kushal-Shr/rant-and-heal-v2' },
    outcome: { label: 'result', text: 'Best Overall Project, Webster Hackfest 2025' },
    resumeStack: ['Next.js', 'RAG', 'Firebase', 'WebRTC'],
    onResume: true,
  },
  {
    slug: 'zenith',
    name: 'Zenith',
    alias: 'Ghost Visualizer',
    badge: 'vs code extension',
    badgeTone: 'dim',
    featured: false,
    tags: ['typescript', 'vs-code-api', 'llm', 'p5.js'],
    summary:
      'Ghost Visualizer: a VS Code extension that renders real-time, AI-powered data structure visualizations while you code.',
    shortSummary: 'VS Code extension for live data structure visualization (TypeScript, p5.js)',
    resumeSummary: 'VS Code extension that visualizes data structures live as you code.',
    diagram: diagrams.zenith,
    diagramAlt:
      'The cursor position in your code is parsed into an AST, sent to an LLM, and played back as a p5.js visualization.',
    bullets: [
      'low-latency AST parsing of the code under the cursor',
      'streams algorithm playback in real time',
      'memory-leak debugging and Big-O profiling, grounded in CPU architecture',
    ],
    links: { source: 'https://github.com/Kushal-Shr/Zenith' },
    outcome: { label: 'result', text: 'low-latency AST parsing + live algorithm playback' },
    resumeStack: ['TypeScript', 'VS Code API', 'LLM', 'p5.js'],
    onResume: true,
  },
  {
    slug: 'surgipath',
    name: 'SurgiPath',
    badge: 'prototype',
    badgeTone: 'dim',
    featured: false,
    tags: ['python', 'streamlit', 'opencv', 'llm'],
    summary:
      'AI surgical training simulator. Gemini writes structured training syllabi; a checklist advances itself as instruments are detected.',
    shortSummary: 'AI surgical training simulator (Python, OpenCV, Gemini)',
    resumeSummary: 'AI surgical training simulator with instrument-triggered checklists.',
    diagram: diagrams.surgipath,
    diagramAlt:
      'A camera feeds OpenCV, which detects instruments and drives a checklist with clinical tips.',
    bullets: [
      'Gemini-generated structured training syllabi',
      'compared existing CV approaches for instrument tracking',
      'auto-advancing checklist with a clinical pro-tip per detection',
    ],
    links: { source: 'https://github.com/Kushal-Shr/SurgiPath' },
    outcome: { label: 'status', text: 'prototype' },
    resumeStack: ['Python', 'Streamlit', 'OpenCV', 'LLM'],
    onResume: true,
  },
  {
    slug: 'airdesk',
    name: 'AirDesk',
    badge: '★1 · python',
    badgeTone: 'dim',
    featured: false,
    tags: ['python', 'computer-vision'],
    summary:
      'Controls a Mac with hand gestures and lets you write in the air on a digital whiteboard.',
    shortSummary: 'control a Mac with hand gestures (Python)',
    resumeSummary: 'Controls a Mac with hand gestures; write in the air on a whiteboard.',
    diagram: diagrams.airdesk,
    diagramAlt: 'A hand is tracked by a webcam, which drives Mac control and a digital whiteboard.',
    bullets: [
      'hand gestures drive the Mac, no mouse needed',
      'write in the air onto a digital whiteboard',
    ],
    links: { source: 'https://github.com/Kushal-Shr/AirDesk' },
    resumeStack: ['Python'],
    onResume: true,
  },
  {
    slug: 'sanctuary',
    name: 'Sanctuary',
    badge: 'team of 4',
    badgeTone: 'dim',
    featured: false,
    tags: ['next.js', 'gemini', 'prisma', 'postgres', 'livekit'],
    summary:
      "A stealth mental-health platform that doesn't look like one: Gemini reframes clinical terms into cultural language, journals self-destruct, and group sessions run anonymously over encrypted video.",
    shortSummary: 'stealth mental-health platform, team of 4 (Next.js, Gemini, LiveKit)',
    diagram: diagrams.sanctuary,
    diagramAlt:
      'A user reaches a Next.js app, which calls Gemini to reframe language, stores data in Postgres through Prisma, and runs encrypted video sessions on LiveKit.',
    bullets: [
      'privacy-first by design: anonymous auth, local-first data and a Quick Exit (Esc) on every page',
      'cultural reframing engine: Gemini turns clinical terms into culturally resonant language',
      'encrypted anonymous group sessions and 1-on-1 mentor chat, voice and video',
      todo('add: the parts of Sanctuary you built yourself'),
    ],
    links: { source: 'https://github.com/Kushal-Shr/NLN' },
    outcome: { label: 'status', text: 'team project, built in 2 days (March 2026)' },
    resumeStack: ['Next.js', 'TypeScript', 'Gemini', 'Prisma', 'PostgreSQL', 'LiveKit'],
    onResume: false,
    team: { size: 4 },
  },
];

export const extraProjects: readonly ExtraProject[] = [
  {
    name: 'real-life Among Us',
    stack: ['React Native', 'Firebase', 'NFC'],
    achievementId: 'pickhacks-2025',
  },
];
