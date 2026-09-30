# Winter Arc Tracker — Firestore Security Specification

## 1. Data Invariants
1. **User Isolation**: A user can only read, create, update, or delete their own user profile document at `/users/{userId}` where `{userId}` strictly equals `request.auth.uid`.
2. **Challenge Isolation**: A user can only access challenge data under `/users/{userId}/challenge/{challengeId}` where `{userId}` matches `request.auth.uid` and document's internal `userId` equals `request.auth.uid`.
3. **Identity Immutability**: The `userId` / `id` field inside documents cannot be mutated once written (`incoming().userId == existing().userId`).
4. **Creation Temporal Integrity**: Documents must record valid timestamps (`updatedAt` and `createdAt` must be strings within reasonable length boundaries).
5. **No Spoofing**: Unauthenticated users cannot read or write user profiles or challenge tracking data.
6. **Path Hardening**: Path variables (`userId`, `challengeId`) must satisfy `isValidId` (`size() <= 128` and matching alphanumeric/hyphen characters).
7. **No Unbounded Fields**: Payloads must have bounded string lengths and conform to structural shape.
8. **Catch-All Default Deny**: Any path not explicitly matched must deny all reads and writes.

---

## 2. The "Dirty Dozen" Malicious Payloads

1. **Unauthenticated Read on `/users/victim_123`**:
   - Actor: `auth = null`
   - Target: `GET /users/victim_123`
   - Expected: `PERMISSION_DENIED`

2. **Foreign Profile Write (Identity Spoofing)**:
   - Actor: `uid = "attacker_456"`
   - Target: `CREATE /users/victim_123`
   - Payload: `{"id": "victim_123", "email": "victim@example.com", "createdAt": "...", "updatedAt": "..."}`
   - Expected: `PERMISSION_DENIED`

3. **Ghost Field Injection (Shadow Update)**:
   - Actor: `uid = "attacker_456"`
   - Target: `UPDATE /users/attacker_456`
   - Payload: `{"id": "attacker_456", "email": "attacker@example.com", "role": "admin", "isSuperUser": true}`
   - Expected: `PERMISSION_DENIED`

4. **Foreign Challenge State Read**:
   - Actor: `uid = "attacker_456"`
   - Target: `GET /users/victim_123/challenge/state`
   - Expected: `PERMISSION_DENIED`

5. **Foreign Challenge State Write**:
   - Actor: `uid = "attacker_456"`
   - Target: `SET /users/victim_123/challenge/state`
   - Payload: `{"userId": "victim_123", "version": 2, "days": {}, "settings": {}}`
   - Expected: `PERMISSION_DENIED`

6. **Cross-Tenant UserId Mismatch**:
   - Actor: `uid = "attacker_456"`
   - Target: `CREATE /users/attacker_456/challenge/state`
   - Payload: `{"userId": "victim_123", "version": 2, "days": {}, "settings": {}, "updatedAt": "..."}`
   - Expected: `PERMISSION_DENIED` (userId mismatch with path / auth)

7. **Immortal Field Mutation Attack (Hijack UserId)**:
   - Actor: `uid = "attacker_456"`
   - Target: `UPDATE /users/attacker_456/challenge/state`
   - Payload modifying `userId` from `"attacker_456"` to `"victim_123"`
   - Expected: `PERMISSION_DENIED`

8. **Huge String Injection (Denial of Wallet)**:
   - Actor: `uid = "attacker_456"`
   - Target: `CREATE /users/attacker_456`
   - Payload: `{"id": "attacker_456", "email": "attacker@example.com", "displayName": "A".repeat(50000)}`
   - Expected: `PERMISSION_DENIED`

9. **Invalid Path Injection (ID Poisoning)**:
   - Actor: `uid = "attacker_456"`
   - Target: `GET /users/attacker_456/challenge/../../evil` or ID containing invalid control characters
   - Expected: `PERMISSION_DENIED`

10. **Blanket Query Scraping Attack**:
    - Actor: `uid = "attacker_456"`
    - Target: `LIST /users`
    - Expected: `PERMISSION_DENIED`

11. **Direct Catch-All Access**:
    - Actor: `uid = "attacker_456"`
    - Target: `GET /secret_credentials/keys`
    - Expected: `PERMISSION_DENIED`

12. **Malformed Payload Structure**:
    - Actor: `uid = "attacker_456"`
    - Target: `SET /users/attacker_456/challenge/state`
    - Payload missing required fields like `days` or `settings`
    - Expected: `PERMISSION_DENIED`
