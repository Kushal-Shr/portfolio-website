# Journey fixtures (fake)

Made-up test data for unit and e2e tests. **None of this is a real journey entry.**

- 38 entries from 2026-10-05 to 2026-11-19, with gaps, so the archive, `ls` cap, streak and
  day-number rules all get exercised. 2026-11-01 (the end of US daylight saving) is included.
- `2026-11-18.md` carries `&`, `<`, quotes and an emoji for the RSS escaping tests.
- `2026-11-19.md` is the newest, with every optional field and Markdown notes.

Preview the populated page: `JOURNEY_DIR=tests/fixtures/journey pnpm dev`.
