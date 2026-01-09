# GitHub Integration Details

Explaining the internal mechanisms.

---

## Storage Path Structure

```
.agasteer/
├── notes/              # Home world
│   ├── metadata.json   # Metadata
│   ├── Note1/
│   │   ├── Leaf1.md
│   │   └── SubNote1/
│   │       └── Leaf3.md
│   └── Note2/
│       └── Leaf5.md
└── archive/            # Archive world
    ├── metadata.json
    └── ArchivedNote/
        └── Leaf.md
```

---

## How Push Works

- **Git Tree API** for batch Push
- **SHA optimization**: Unchanged files are not transferred
- **Delete/rename support**: Automatically reflected
- **force: true**: Personal app prioritizes success

---

## How Pull Works

**Priority-based progressive loading**:

1. Fetch leaf specified in URL with highest priority
2. Fetch leaves under the same note next
3. Fetch remaining with 10 parallel requests

---

## API Rate Limits

GitHub API has a limit of 5,000 requests per hour.

| Operation | Requests Consumed |
| --------- | ----------------- |
| Pull      | 1 + leaf count    |
| Push      | 3-5               |

Normal usage (a few Pull/Push per day) won't cause issues.
