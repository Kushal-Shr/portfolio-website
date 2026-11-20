import type { Achievement } from './types';

export const achievements: readonly Achievement[] = [
  {
    id: 'hackfest-2025',
    event: 'Webster Hackfest 2025',
    award: 'Best Overall Project',
    description:
      'Rant & Heal, an AI voice therapy mental health platform (Next.js, Gemini, Firebase, WebRTC).',
    year: 2025,
    location: 'Webster University',
    link: 'https://devpost.com/software/rant-and-heal',
    project: 'rant-and-heal',
    inlineVenue: false,
    resumeNote: 'Rant & Heal',
    logEntry: { name: 'hackfest', award: 'Best Overall', venue: 'Webster · 2025' },
  },
  {
    id: 'pickhacks-2025',
    event: 'PickHacks 2025',
    award: 'Community Vote Winner',
    description: 'Real-life Among Us (React Native, Firebase, NFC, voice chat)',
    year: 2025,
    location: 'Missouri S&T',
    link: 'https://devpost.com/software/imposter-akmlfj',
    inlineVenue: true,
    resumeNote: 'real-life Among Us',
    logEntry: { name: 'pickhacks', award: 'Community Vote', venue: 'Missouri S&T · 2025' },
  },
  {
    id: 'byte-bash-2',
    event: 'Byte Bash 2.0',
    award: '1st Place',
    description: 'Competitive coding competition',
    location: 'Webster University',
    inlineVenue: true,
    resumeNote: 'Webster University',
    logEntry: { name: 'bytebash', award: '1st Place', venue: 'Webster · Byte Bash 2.0' },
  },
];
