import type { Guide } from './types';

const cmd = (text: string) => ({ text, tone: 'green' }) as const;
const fg = (text: string) => ({ text, tone: 'fg' }) as const;

export const guide: Guide = {
  title: 'portfolio-sh',
  subtitle: '— how to get around',
  intro: [
    [
      'This site works like a terminal: you type a command, press ',
      cmd('Enter'),
      ", and it answers. You don't need to know Linux. Click any example below to see what it prints, then try it for real in the ",
      { text: 'shell', href: '/' },
      '.',
    ],
    ['Rather not type? Every page is one click away in the tab bar at the bottom.'],
  ],
  quickStart: {
    title: '30-second version',
    steps: [
      ['type ', cmd('neofetch'), ' — meet me'],
      ['type ', cmd('ls'), " — see what's here"],
      ['type ', cmd('cd projects'), ' — go into a folder'],
      ['type ', cmd('cat about.md'), ' — read a file'],
      ['lost? type ', cmd('help'), ' or ', cmd('cd ~')],
    ],
  },
  sections: [
    {
      title: 'start here',
      items: [
        {
          what: 'meet me: picture, role, what I am building',
          cmd: 'neofetch',
          hint: '',
          kind: 'command',
        },
        { what: 'list every command', cmd: 'help', hint: '', kind: 'command' },
        { what: 'see the whole site at once', cmd: 'tree', hint: '', kind: 'command' },
      ],
    },
    {
      title: 'move around',
      items: [
        {
          what: 'list what is in this folder',
          cmd: 'ls',
          hint: '-l for details',
          kind: 'command',
        },
        { what: 'go into a folder', cmd: 'cd projects', hint: '', kind: 'command' },
        {
          what: 'go up one level, or straight home',
          cmd: 'cd ..',
          hint: 'or cd ~',
          kind: 'command',
        },
        { what: 'where am I?', cmd: 'pwd', hint: '', kind: 'command' },
      ],
    },
    {
      title: 'read things',
      items: [
        { what: 'read a file', cmd: 'cat about.md', hint: '', kind: 'command' },
        { what: "today's journey entry", cmd: 'tail journey', hint: '', kind: 'command' },
        {
          what: 'open any section as a full page',
          cmd: 'open skills',
          hint: 'or: open resume',
          kind: 'command',
        },
      ],
    },
    {
      title: 'shortcuts',
      items: [
        {
          what: 'finish a word for you',
          cmd: 'cd pro',
          hint: 'then press Tab',
          kind: 'key',
          output: 'cd projects/',
        },
        {
          what: 'bring back earlier commands',
          cmd: '↑  ↓',
          hint: 'arrow keys',
          kind: 'key',
          output: 'cycles through what you typed',
        },
        {
          what: 'wipe the screen / see what you ran',
          cmd: 'clear',
          hint: 'or history',
          kind: 'command',
        },
      ],
    },
  ],
  concepts: [
    {
      title: '~ means home',
      body: ["It's the top folder. ", fg('cd ~'), ' always brings you back.'],
    },
    {
      title: 'folders end in /',
      body: [
        'In ',
        fg('ls'),
        ', blue names are folders you can ',
        fg('cd'),
        ' into; the rest are files you can ',
        fg('cat'),
        '.',
      ],
    },
    {
      title: '.. means up one level',
      body: ['Paths chain with /: ', fg('cat projects/zenith.md'), ' works from anywhere in ~.'],
    },
  ],
  footnote:
    "psst — a few commands aren't listed here. A recruiter with root access might find one.",
};
