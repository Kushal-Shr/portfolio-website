# content/

Every fact on the site lives here, once. Pages, the shell, the resume and the dashboard all read from these files.

| Path                    | What it holds                                                                             |
| ----------------------- | ----------------------------------------------------------------------------------------- |
| `*.ts`                  | Structured facts: profile, jobs, projects, leadership, wins, skills, guide, portrait      |
| `art.ts`                | ASCII pictures: one per project, one icon per skill (checked by `tests/unit/art.test.ts`) |
| `projects/<slug>.md`    | The long write-up on each project's page                                                  |
| `experience/<id>.md`    | The long write-up on each job's page                                                      |
| `leadership/<slug>.md`  | The long write-up on each leadership role's page                                          |
| `achievements/<id>.md`  | The long write-up on each competition win's page                                          |
| `journey/YYYY-MM-DD.md` | Daily journey entries, written by Kushal (format and workflow: `journey/README.md`)       |

## Write-ups

Each write-up is Markdown with a little frontmatter:

```md
---
reviewed: false # flip to true once Kushal has read and approved it
draft: false # true hides the body; the page shows a placeholder instead
sources: # where every fact came from
  - design/source/resume.md
---
```

- The first drafts were written by Claude **only from documented sources**: the resume, the repo READMEs and the Devpost pages listed under `sources`. Nothing was guessed.
- Where those sources say nothing, the file holds a question as an HTML comment, `<!-- TODO(kushal): … -->`. Comments never render on the page. Answer the question in prose and delete the comment.
- `pnpm content:todos` lists every unreviewed write-up and every open `TODO(kushal)` question (from phase 6 on).
- On team projects (Sanctuary, SurgiPath, PickHacks), say only what _you_ built.

Workflow: edit → `pnpm check` → commit.
