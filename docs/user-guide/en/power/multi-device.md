# Multi-Device Sync

Notes when using across multiple devices like PC and smartphone.

---

## Basic Flow

1. Edit on **Device A** → Push
2. Pull on **Device B** → Edit → Push
3. Pull on **Device A** → ...

---

## Caution

- **Conflict resolution UI is not yet implemented**
- If editing simultaneously on multiple devices, later Push overwrites
- Always Pull before editing

---

## Stale Warning

If edits were made on another device, a warning appears before Push.

- You can choose to overwrite or Pull first
- Background checks also run every 5 minutes
