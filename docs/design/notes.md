# Frontend design — taste skill

- Work: photographic editor; preserve the image engine, recipes, JSON and downloads.
- Objects: original photos, crop/rotation recipes, camera metadata, 16 frames, backgrounds, export settings, ZIP and JSON files.
- People: photographers adjusting several images, at a desktop for longer sessions and on a phone for quick edits.
- Most frequent job: inspect the framed result, change a setting, export.
- Screen question: What will this photograph look like when exported?
- Signature: the real photograph and its capture metadata lead the workspace; a contact-sheet filmstrip scopes every per-photo control.
- Face: cool neutral proofing surface, IBM Plex Sans UI, the existing framing mark in restrained teal. The photo supplies the colour.
- Direction: Framed sheet, seed 138635225; no redraw. A 48px chrome bar, inset sheet, neutral tool tabs, large preview and a stable inspector.
- Grid: 1440 = 8 + 1 + 1054 + 368 + 1 + 8; the sheet has one 24px content gutter, with 16px on small screens.
- Real data: existing sample photograph and its EXIF, no new fabricated content or stock photos.

## Before critique

Tiny type (7–10px), cream/orange chrome competing with photography, decorative English labels and index numbers, three narrow regions at tablet width, floating preview toolbar. Baseline inspector: 4 FAIL / 3 WARN (micro-label, text-shadow, edge-text, tiny-text; palette, contrast, unloaded Inter).

Top three changes: replace the type scale and actually load the UI font; make the frame and navigation neutral; reclaim the left rail for the photograph and fold into one-column tools at tablet/phone widths.

## Round 1 critique

1. The photo is the largest object and answers the export-preview question first; real capture metadata gives the selected photograph context.
2. The inset sheet closes its edges; the 2-column frame picker is too tall and pushes EXIF sizing below the first screen.
3. Only the mark and photographic content carry hue; selection and primary controls are neutral. Cool proofing grey distinguishes the canvas from the white inspector.
4. Photo dimensions, capture data, selection and format are taken from existing state. The sample is excluded from the real-photo count (0), visibly labelled sample.
5. The library count is a real zero; no EXIF uses an honest empty state. Footer metadata remains secondary.
6. No charts or invented metrics. Swatches represent actual photo backgrounds.
7. Tablet now folds the rail to a bottom bar and gives the photo its full width. Phone controls remain reachable but the opening view can expose settings sooner.

Top three fixes: increase operational labels to 13–14px; condense the frame picker into two rows of three; reduce phone preview height slightly while retaining 44px touch targets. Round 1 inspector: 0 FAIL / 1 WARN (68% of DOM text under 13px).

## Final critique (round 3)

1. **Question / hierarchy:** the photograph remains dominant; its file name and real capture metadata identify what is being edited. The frame picker and EXIF size control are both visible on desktop.
2. **Edges / density:** one sheet, one inspector edge and repeated content gutters. The picker is now two rows of three; no empty navigation rail wastes photo width. Canvas space is reserved for different photo orientations, rather than decorative filler.
3. **Colour / face:** cool neutral proofing ground, white sheet and loaded IBM Plex Sans. The existing mark uses teal. Navigation, buttons and ranges use ink; dark mode uses neutral lightness steps. Background swatches retain their true colours because they edit the photo.
4. **Consistency:** source dimensions and metadata are derived from the selected photo. The 0 real-photo count intentionally excludes the labelled demonstration photo. No new metrics, people or external images were introduced.
5. **States:** empty library, edited draft, selected background, preview loading, disabled export, dark appearance and focus/hover states were inspected. Original/edit/export behaviour is covered by the existing functional suite.
6. **Encoding:** no charts; no legends to invent. Frame sketches and colour swatches are choices, not fabricated data. Crop thirds use actual line marks, not gradient fills.
7. **Phone / tablet:** the same six tools become an accessible bottom bar, the photo uses the available width, and settings stack underneath. Fine adjustments may need scrolling on a phone; the full-preview modal is available throughout.

### Before / after

| Check                               | Before                                    | After                                 |
| ----------------------------------- | ----------------------------------------- | ------------------------------------- |
| Skill inspector at 1440 / 768 / 390 | 4 FAIL, 3 WARN                            | 0 FAIL, 1 WARN                        |
| Text below 11px                     | 41 blocks                                 | 0                                     |
| Small tracked decorative labels     | 5                                         | 0                                     |
| Main title                          | 14 / 14 / 12px                            | 18px at all widths                    |
| Declared UI font                    | Inter, not loaded                         | IBM Plex Sans, self-hosted and loaded |
| Tablet composition                  | narrow canvas beside a rail and inspector | full-width photo, stacked settings    |

The remaining inspector warning is the proportion of 11–12px text: it is reserved for capture metadata, secondary help, status and compact phone destinations; operational field labels are 14px and desktop tools are 14px. This is a deliberate density choice, with contrast passing. Source lint has 0 FAIL; its seven warnings are two real timestamp/date paddings and five functional overlay/mask shadows (menu, transient preview state, crop mask, toast and dialog), not resting-panel decoration. No inspector rule was disabled.

Direction: Framed sheet, seed 138635225; no redraws. Existing sample photograph retained; no found pictures, new stock imagery or fabricated sample records. Optional Tip/Poster sample headings replace Latin filler without changing the drawing formulas or option schema.

Validation: existing six browser scenarios, nineteen standalone engine/state tests, forty-eight reference frame comparisons and three collage comparisons pass; TypeScript build, ESLint and Prettier pass. Screenshots live in `.taste-skill/before`, `.taste-skill/after`, `docs/workspace-*.png` and `docs/design/workspace-*.png`. No commit, push or deployment performed.
