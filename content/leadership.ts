import { todo } from './types';
import type { LeadershipRole } from './types';

export const leadership: readonly LeadershipRole[] = [
  {
    pid: '101',
    role: 'President',
    org: 'Computer Science Club',
    scope: 'whole club',
    stat: 'R',
    status: { text: 'running', tone: 'running' },
    summary:
      "Leads Webster University's Computer Science Club, after first leading its coding team.",
    impact: [
      'moved up from Coding Team Lead to President',
      todo('add: members, events or workshops you ran'),
      todo('add: what changed because of you'),
    ],
    resumeNote: 'former Coding Team Lead',
  },
  {
    pid: '087',
    role: 'Coding Team Lead',
    org: 'Computer Science Club',
    scope: 'coding team',
    stat: 'Z',
    status: { text: 'exited 0 → president', tone: 'exited' },
    resumeNote: '',
  },
  {
    pid: '072',
    role: 'Senator',
    org: 'Student Government Association',
    scope: 'GHW School of Business and Technology',
    stat: 'Z',
    status: { text: 'exited 0', tone: 'exited' },
    summary:
      "Represented the GHW School of Business and Technology in Webster's student government.",
    impact: [
      "elected voice for a school's students",
      todo('add: a bill, event or change you drove'),
    ],
    resumeNote: 'GHW School of Business & Tech',
  },
];
