# Security

Data storage locations and security considerations.

---

## Data Storage Locations

| Data         | Storage                              |
| ------------ | ------------------------------------ |
| GitHub Token | LocalStorage (plaintext)             |
| Note Content | IndexedDB + GitHub (HTTPS encrypted) |
| Settings     | LocalStorage                         |

---

## Recommendations

### Do

- Use only on trusted personal devices
- Set appropriate expiration for tokens
- Rotate tokens periodically

### Don't

- Don't use on shared devices
- Don't share tokens with others
