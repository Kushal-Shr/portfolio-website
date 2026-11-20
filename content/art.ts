// ASCII pictures for the detail pages (phase 6): a hero picture per project and an icon per
// skill. They are images, so pages render them aria-hidden; project pictures carry an `alt`.
// Edit freely, but keep each picture inside its width budget (tests/unit/art.test.ts checks).

export type ProjectArt = { art: string; alt: string };

/** Strips the leading and trailing newline that the template literals below carry for readability. */
const pic = (strings: TemplateStringsArray): string => String.raw(strings).replace(/^\n|\n$/g, '');

/** Keyed by project slug. Max 56 columns, max 10 lines. */
export const projectArt: Readonly<Record<string, ProjectArt>> = {
  'rant-and-heal': {
    alt: 'A speech bubble of scribbled venting turns into a heart: rant, then heal.',
    art: pic`
 .---------------------.
 | ~~~~ ~~ ~~~~~~ ~~~  |
 | ~~~ ~~~~~ ~~~~ ~    |
 | ~~~~~~ ~~~ ~~       |   ---->    _  _
 '--------.  .---------'           ( \/ )
          | /                       \  /
          |/                         \/
        rant                        heal
`,
  },
  zenith: {
    alt: 'A code editor on the left and the binary search tree it builds, drawn live in a ghost panel on the right.',
    art: pic`
┌─ demo.cpp ──────────────┬─ ghost ───────────────────┐
│ 1  Node* search(r, t) { │            (50)  O(log n) │
│ 2    if (!root) ...     │          /      \         │
│ 3    if (t < r->data)   │     (30)        (70)      │
│ 4      return search(.. │    /    \      /    \     │
│ 5 ▌  return search(..); │  (20)  (40)  (60)  (80)   │
│ 6  }                    │               ▲ curr      │
└─────────────────────────┴───────────────────────────┘
`,
  },
  surgipath: {
    alt: 'A camera view locks onto a surgical instrument while a three-step training checklist advances.',
    art: pic`
┌─ camera ────────────────────┐   syllabus
│                             │
│     ┌─ ─ ─ ─ ─ ─ ─ ─ ─┐     │   [x] step 1  found
│       o═════════════<       │   [>] step 2  scanning
│     └─ ─ ─ ─ ─ ─ ─ ─ ─┘     │   [ ] step 3
│         [ LOCK ON ]         │
└─────────────────────────────┘   tip: ...
`,
  },
  airdesk: {
    alt: 'A raised hand writes the word hi in the air, and it appears on a laptop screen.',
    art: pic`
      _                 ┌───────────────────────┐
     | |                │                       │
     | |_ _ _           │    |_  .              │
    _| | | | |          │    | | |   _          │
   | \       |          │               ^       │
    \        /  ~ ~ ~>  │                       │
     \______/           └───────────────────────┘
                       ═══════════════════════════
`,
  },
  sanctuary: {
    alt: 'A lotus flower floating on still water, under the words breathe, reflect, heal.',
    art: pic`
                 .
                / \
          .    /   \    .
         / \  /  |  \  / \
        /   \/   |   \/   \
        \    \   |   /    /
     ~~~~'----'--'--'----'~~~~
      breathe · reflect · heal
`,
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
