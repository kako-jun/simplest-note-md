# Priority Leaf

A feature that aggregates prioritized paragraphs scattered across multiple leaves into one display.

---

## Marking Priority Paragraphs

Add `[n]` markers (n is a number) to paragraphs.

```markdown
[1] Highest priority task

This is a normal paragraph.

Important work [2]

[3] Complete within this week
```

### Rules

- At paragraph start: `[n] ` (space after)
- At paragraph end: ` [n]` (space before)

> **Note**: Spaces are required to distinguish from `text[1]` (citation numbers) or `array[0]` (arrays).

---

## Priority Leaf Display

A "Priority" leaf appears at the top of the home screen.

- Sorted by priority (numbers ascending)
- Same priority: sorted by note order, then leaf order
- Opens in preview mode when clicked (read-only)

---

## Source Display

The original leaf name and note name are displayed below each paragraph.

```
**[1]** Highest priority task
_— Task Management @ Work Note_
```

---

## Specifications

- **Virtual leaf**: Not saved to GitHub
- **Real-time updates**: Auto-reflects when markers are added/removed
- **Excluded from stats**: Character/line counts not included in home statistics
