// ASCII pictures: a picture per project (animated on the projects page and each project's page),
// one per skills box, and an icon per skill. They are images, so pages render them aria-hidden;
// pictures that carry meaning have an `alt`. Edit freely, but keep each picture inside its width
// budget (tests/unit/art.test.ts checks).

/** `frames` play in a loop; the last frame is `art`, the finished picture. */
export type ProjectArt = { art: string; alt: string; frames: readonly string[] };
export type GroupArt = { alt: string; frames: readonly string[] };

/** Strips the leading and trailing newline that the template literals below carry for readability. */
const pic = (strings: TemplateStringsArray): string => String.raw(strings).replace(/^\n|\n$/g, '');

/** `[line, from, to]`: on that line, the first `from` becomes `to`, padded to the same width. */
type Edit = readonly [line: number, from: string, to: string];

function edit(base: string, edits: readonly Edit[]): string {
  const lines = base.split('\n');
  for (const [i, from, to] of edits) {
    const line = lines[i] ?? '';
    const at = line.indexOf(from);
    if (at < 0) throw new Error(`art: "${from}" is not on line ${i}`);
    lines[i] = line.slice(0, at) + to.padEnd(from.length) + line.slice(at + from.length);
  }
  return lines.join('\n');
}

/** Pads every frame to the same lines and width, so the picture never changes size mid-loop. */
function even(frames: readonly string[]): string[] {
  const split = frames.map((f) => f.split('\n'));
  const rows = Math.max(...split.map((l) => l.length));
  const cols = Math.max(...split.flat().map((l) => [...l].length));
  return split.map((lines) =>
    Array.from({ length: rows }, (_, i) => (lines[i] ?? '').padEnd(cols)).join('\n'),
  );
}

/** One frame per step, then the finished picture, held for `hold` frames. */
function animate(base: string, steps: readonly (readonly Edit[])[], hold = 4): string[] {
  return even([...steps.map((step) => edit(base, step)), ...Array<string>(hold).fill(base)]);
}

const project = (alt: string, art: string, steps: readonly (readonly Edit[])[]): ProjectArt => {
  const frames = animate(art, steps);
  return { alt, art: frames[frames.length - 1] ?? art, frames };
};

// Rant & Heal: the rant gets typed out, travels down the arrow, and comes back as a heart.
const rantArt = pic`
 .---------------------.
 | ~~~~ ~~ ~~~~~~ ~~~  |
 | ~~~ ~~~~~ ~~~~ ~    |
 | ~~~~~~ ~~~ ~~       |   ---->    _  _
 '--------.  .---------'           ( \/ )
          | /                       \  /
          |/                         \/
        rant                        heal
`;
const noHeart: Edit[] = [
  [3, '_  _', ''],
  [4, '( \\/ )', ''],
  [5, '\\  /', ''],
  [6, '\\/', ''],
  [7, 'heal', ''],
];
const rantLines: Edit[] = [
  [1, '~~~~ ~~ ~~~~~~ ~~~', ''],
  [2, '~~~ ~~~~~ ~~~~ ~', ''],
  [3, '~~~~~~ ~~~ ~~', ''],
];
const arrow = (to: string): Edit => [3, '---->', to];

// Zenith: the cursor steps through search(); each node it visits lights up, until it finds 60.
const zenithArt = pic`
┌─ demo.cpp ──────────────┬─ ghost ───────────────────┐
│ 1  Node* search(r, t) { │            (50)  O(log n) │
│ 2    if (!root) ...     │          /      \         │
│ 3    if (t < r->data)   │     (30)        (70)      │
│ 4 ▌    return search(.. │    /    \      /    \     │
│ 5    return search(..); │  (20)  (40)  (60)  (80)   │
│ 6  }                    │               ▲ curr      │
└─────────────────────────┴───────────────────────────┘
`;
const cursorAt = (line: number): Edit[] => [
  [4, '4 ▌', '4  '],
  [line, `${line}  `, `${line} ▌`],
];

// SurgiPath: an instrument slides into view, the camera locks on, the checklist ticks.
const surgiArt = pic`
┌─ camera ────────────────────┐   syllabus
│                             │
│     ┌─ ─ ─ ─ ─ ─ ─ ─ ─┐     │   [x] step 1  found
│       o═════════════<       │   [>] step 2  scanning
│     └─ ─ ─ ─ ─ ─ ─ ─ ─┘     │   [ ] step 3
│         [ LOCK ON ]         │
└─────────────────────────────┘   tip: ...
`;
const searching = (at: number): Edit[] => [
  [3, '       o═════════════<       ', `${' '.repeat(at)}o═════════════<`],
  [2, '┌─ ─ ─ ─ ─ ─ ─ ─ ─┐', ''],
  [4, '└─ ─ ─ ─ ─ ─ ─ ─ ─┘', ''],
  [5, '[ LOCK ON ]', '[ scan... ]'],
  [2, '[x] step 1  found', '[>] step 1  scanning'],
  [3, '[>] step 2  scanning', '[ ] step 2'],
  [6, 'tip: ...', ''],
];

// AirDesk: a wave of the hand, and "hi" appears on the screen one letter at a time.
const airArt = pic`
      _                 ┌───────────────────────┐
     | |                │                       │
     | |_ _ _           │    |_  .              │
    _| | | | |          │    | | |   _          │
   | \       |          │               ^       │
    \        /  ~ ~ ~>  │                       │
     \______/           └───────────────────────┘
                       ═══════════════════════════
`;
const screen = (h: boolean, i: boolean, wave: string): Edit[] => [
  [2, '│    |_  .', `│    ${h ? '|_' : ''}${i ? '  .' : ''}`],
  [3, '│    | | |   _', `│    ${h ? '| |' : ''}${i ? ' |' : ''}`],
  [4, '^', ''],
  [5, '~ ~ ~>', wave],
];

// Sanctuary: the water ripples while breathe, reflect and heal surface one by one.
const sanctuaryArt = pic`
                 .
                / \
          .    /   \    .
         / \  /  |  \  / \
        /   \/   |   \/   \
        \    \   |   /    /
     ~~~~'----'--'--'----'~~~~
      breathe · reflect · heal
`;
const ripple = (left: string, right: string, words: string, star: boolean): Edit[] => [
  [6, "~~~~'", `${left}'`],
  [6, "'~~~~", `'${right}`],
  [7, 'breathe · reflect · heal', words],
  ...(star ? ([[0, '.', '*']] as Edit[]) : []),
];

/** Keyed by project slug. Max 56 columns, max 10 lines. */
export const projectArt: Readonly<Record<string, ProjectArt>> = {
  'rant-and-heal': project(
    'A speech bubble of scribbled venting turns into a heart: rant, then heal.',
    rantArt,
    [
      [...rantLines.slice(1), [1, '~~~~ ~~ ~~~~~~ ~~~', '~~~~ ~~▌'], arrow(''), ...noHeart],
      [...rantLines.slice(2), [2, '~~~ ~~~~~ ~~~~ ~', '~~~ ~~~~~ ~▌'], arrow(''), ...noHeart],
      [[3, '~~~~~~ ~~~ ~~ ', '~~~~~~ ~~~ ~~▌'], arrow(''), ...noHeart],
      [arrow('o'), ...noHeart],
      [arrow('--o'), ...noHeart],
      [arrow('----o'), ...noHeart],
    ],
  ),
  zenith: project(
    'A code editor on the left and the binary search tree it builds, drawn live in a ghost panel on the right.',
    zenithArt,
    [
      [...cursorAt(1), [6, '▲ curr', '']],
      [...cursorAt(2), [1, '(50)', '[50]'], [6, '▲ curr', '']],
      [...cursorAt(3), [1, '(50)', '[50]'], [6, '▲ curr', '']],
      [...cursorAt(5), [3, '(70)', '[70]'], [6, '▲ curr', '']],
      [...cursorAt(3), [3, '(70)', '[70]'], [6, '▲ curr', '']],
      [...cursorAt(4), [5, '(60)', '[60]'], [6, '▲ curr', '']],
    ],
  ),
  surgipath: project(
    'A camera view locks onto a surgical instrument while a three-step training checklist advances.',
    surgiArt,
    [searching(0), searching(2), searching(4), searching(6), [[5, '[ LOCK ON ]', '']]],
  ),
  airdesk: project(
    'A raised hand writes the word hi in the air, and it appears on a laptop screen.',
    airArt,
    [
      screen(false, false, '~'),
      screen(false, false, '~ ~'),
      screen(true, false, '~ ~ ~>'),
      screen(true, true, '~ ~ ~>'),
    ],
  ),
  sanctuary: project(
    'A lotus flower floating on still water, under the words breathe, reflect, heal.',
    sanctuaryArt,
    [
      ripple('~-~~', '~~-~', 'breathe', false),
      ripple('~~-~', '~-~~', 'breathe · reflect', true),
      ripple('~~~-', '-~~~', 'breathe · reflect · heal', false),
      ripple('-~~~', '~~~-', 'breathe · reflect · heal', true),
    ],
  ),
};

// The three skills boxes. Same rules: the last frame is the finished picture.
const W = 28;
const row = (text = ''): string => `│${text.padEnd(W)}│`;
const editor = (code: readonly string[], preview: string): string =>
  [
    `┌─ app.tsx ${'─'.repeat(W - 10)}┐`,
    ...[0, 1, 2].map((i) => row(code[i])),
    `├─ localhost:3000 ${'─'.repeat(W - 17)}┤`,
    row(preview),
    `└${'─'.repeat(W)}┘`,
  ].join('\n');
const CODE = [' function App() {', '   return <h1>hello</h1>;', ' }'];

const pipelineArt = pic`
 .-----.    .-----.    .----.
 | api |--->| etl |--->| bq |
 '-----'    '-----'    '----'
                          |
              .-----.     |
     answer <-| llm |<----'
              '-----'
`;
const packet = (edits: readonly Edit[]): Edit[] => [...edits, [5, 'answer', '']];

const deployArt = pic`
 $ git push origin main
 [jenkins] build ...... ok
 [k8s]     pods [#][#][#]
      .--.
   .-(    ).    deployed
  (___.__)__)   to the cloud
`;
const deploy = (push: string, build: string, pods: string): Edit[] => [
  [0, '$ git push origin main', push],
  [1, '[jenkins] build ...... ok', build],
  [2, '[k8s]     pods [#][#][#]', pods],
  [4, 'deployed', ''],
  [5, 'to the cloud', ''],
];

export const groupArt: Readonly<Record<'languages' | 'ai-data' | 'cloud', GroupArt>> = {
  languages: {
    alt: 'A React component being typed in an editor, then rendered as hello in the browser below it.',
    frames: even([
      editor([' function Ap▌'], ''),
      editor([CODE[0] ?? '', '   return <h1>▌'], ''),
      editor(CODE, ' compiling...'),
      ...Array<string>(4).fill(editor(CODE, ' hello')),
    ]),
  },
  'ai-data': {
    alt: 'A data pipeline: an API feeds an ETL job into BigQuery, which feeds an LLM that returns an answer.',
    frames: animate(pipelineArt, [
      packet([[1, '| api |--->', '| api |o-->']]),
      packet([[1, '| api |--->', '| api |--o>']]),
      packet([[1, '| etl |--->', '| etl |o-->']]),
      packet([[1, '| etl |--->', '| etl |--o>']]),
      packet([[3, '|', 'o']]),
      packet([[4, '|', 'o']]),
      packet([[5, "<----'", "<--o-'"]]),
      packet([[5, "<----'", "o----'"]]),
    ]),
  },
  cloud: {
    alt: 'A git push triggers a Jenkins build, Kubernetes pods start one by one, and the app is deployed to the cloud.',
    frames: animate(deployArt, [
      deploy('$ git push▌', '', ''),
      deploy('$ git push origin main', '[jenkins] build ..', ''),
      deploy('$ git push origin main', '[jenkins] build ......', '[k8s]     pods [ ][ ][ ]'),
      deploy('$ git push origin main', '[jenkins] build ...... ok', '[k8s]     pods [#][ ][ ]'),
      deploy('$ git push origin main', '[jenkins] build ...... ok', '[k8s]     pods [#][#][ ]'),
    ]),
  },
};

/** Keyed by the skill's name exactly as it appears in `content/skills.ts`. Max 32 columns, max 10 lines. */
export const skillArt: Readonly<Record<string, string>> = {
  SQL: pic`
 SELECT * FROM t;
 ┌────┬──────┬────┐
 │ id │ name │ .. │
 ├────┼──────┼────┤
 │  1 │ ...  │ .. │
 │  2 │ ...  │ .. │
 └────┴──────┴────┘
`,
  Python: pic`
       ___
      / o \__
     |   ___/ ~
      \  \
    ___\  \___
   /  ___\    \
   \_/     \___>
`,
  'C++': pic`
 ┌─────────────────┐
 │                 │
 │  █▀▀   ▄    ▄   │
 │  █    ▄█▄  ▄█▄  │
 │  ▀▀▀   ▀    ▀   │
 └─────────────────┘
`,
  TypeScript: pic`
 ┌─────────────────┐
 │                 │
 │          ▀█▀ █▀▀│
 │           █  ▀▀█│
 │           ▀  ▀▀▀│
 └─────────────────┘
`,
  JavaScript: pic`
 ┌─────────────────┐
 │                 │
 │            █ █▀▀│
 │          █ █ ▀▀█│
 │          ▀▀▀ ▀▀▀│
 └─────────────────┘
`,
  React: pic`
    .---.     .---.
   /     \   /     \
  |       \ /       |
  |       (o)       |
  |       / \       |
   \     /   \     /
    '---'     '---'
`,
  'Next.js': pic`
     .-------.
   .'         '.
  |   █▄   █    |
  |   █ ▀▄ █    |
  |   ▀   ▀▀    |
   '.         .'
     '-------'
`,
  'Node.js': pic`
      ________
     /        \
    /          \
   (   node.js  )
    \          /
     \________/
`,
  Flask: pic`
       |    |
       |    |
      /      \
     /~~~~~~~~\
    /  o   .   \
   /   .  o  o  \
  '--------------'
`,
  'Tailwind CSS': pic`
        .--.
   .---'    '--.__
                  '--.
      .--.
 .---'    '--.__
                '--.
`,
  'React Native': pic`
   ┌───────────┐
   │ .-. . .-. │
   │(   (o)   )│
   │ '-' ' '-' │
   │           │
   │    ───    │
   └───────────┘
`,
  Streamlit: pic`
          |\
          | \
          |  \
          |___\
     _____|_____
     \_________/
  ~~~~~~~~~~~~~~~~~
`,
  'p5.js': pic`
 ┌─ sketch.js ──────┐
 │                  │
 │      .--.        │
 │     (    )       │
 │      '--'   ^    │
 │                  │
 └──────────────────┘
`,
  LLM: pic`
 ┌──────────────────┐
 │ the cat sat on ▌ │
 ├──────────────────┤
 │  the     0.62    │
 │  a       0.21    │
 │  my      0.09    │
 └──────────────────┘
`,
  'scikit-learn': pic`
   o   o      /  x
     o   o   /  x   x
   o    o   /     x
     o     /   x    x
   o   o  /  x   x
`,
  TensorFlow: pic`
  o ─┐    o    ┌─ o
  o ─┼─── o ───┼─ o
  o ─┼─── o ───┼─ o
  o ─┘    o    └─ o
  in    hidden    out
`,
  'Data Modeling': pic`
 ┌────────┐       ┌────────┐
 │ user   │ 1   n │ order  │
 │ ────── ├───────┤ ────── │
 │ id  pk │       │ id  pk │
 │ name   │       │ user fk│
 └────────┘       └────────┘
`,
  BigQuery: pic`
 ┌─────────────────┐
 │ ░░░ ░░ ░░░ ░░░░ │
 │ ░░ .----. ░░ ░░ │
 │ ░ /      \ ░░░░ │
 │ ░ \      / ░ ░░ │
 └────'----'\──────┘
             \\
`,
  'Apache Airflow': pic`
         ┌──▶ [ b ] ──┐
[ a ] ───┤            ├──▶ [ d ]
         └──▶ [ c ] ──┘
`,
  Talend: pic`
 ┌─────────┐
 │ extract │
 └────┬────┘
 ┌────▼────┐
 │transform│
 └────┬────┘
 ┌────▼────┐
 │  load   │
 └─────────┘
`,
  Gemini: pic`
         .
        / \
       /   \
  ----'     '----
  ----.     .----
       \   /
        \ /
         '
`,
  RAG: pic`
 ┌───┐ ┌───┐ ┌───┐
 │===│ │===│ │===│   query
 └─┬─┘ └───┘ └─┬─┘     │
   └─────┬─────┘       │
         ▼             ▼
    [ context  +  LLM ]
             │
          answer
`,
  OpenCV: pic`
 ┌─ ─ ─ ─ ─ ─ ─ ─ ─┐
     .-'''''''-.
 │  (    (@)    )  │
     '-.......-'
 └─ ─ ─ ─ ─ ─ ─ ─ ─┘
`,
  Oracle: pic`
   .-------------.
  (               )
  |'-------------'|
  |  legacy data  |
  |               |
  (               )
   '-------------'
`,
  FastAPI: pic`
        _____
       /    /
      /    /
     /    /___
    /___     /
       /    /
      /   /
     /  /
    / /
`,
  AWS: pic`
        .--.
     .-(    )-.
   .(          ).
  (______________)
   '-._______.-'>
`,
  GCP: pic`
        .--.
     .-(    )-.
   .(          ).
  (   o  o  o   )
   '------------'
`,
  'REST APIs': pic`
 client          server
   │   GET /items   │
   │───────────────▶│
   │   200 OK [..]  │
   │◀───────────────│
`,
  Git: pic`
 o───o───────────o───o  main
      \         /
       o───o───o        feature
`,
  Kubernetes: pic`
        .-----.
     \ /   |   \ /
      /    |    \
 ────(-----o-----)────
      \    |    /
     / \   |   / \
        '-----'
`,
  Jenkins: pic`
 ┌───────┐  ┌──────┐  ┌──────┐
 │ build ├─▶│ test ├─▶│ ship │
 └───────┘  └──────┘  └──────┘
    ok         ok        ..
`,
  Firebase: pic`
         (
        ) )
       ( ( (
      ) ) ) )
     (_(_(_(_)
    |_________|
`,
  WebRTC: pic`
 ┌───────┐            ┌───────┐
 │ (o_o) │◀──────────▶│ (^_^) │
 └───────┘    p2p     └───────┘
`,
  'OAuth 2.0': pic`
    .---.
   / .-. \_______________
   \ '-' /   _   _   _  /
    '---'   | |_| |_| |
        bearer token
`,
};
