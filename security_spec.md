# Security Specification - JasaDekat

## 1. Data Invariants
1. A provider cannot approve their own registration; status transitions to 'approved', 'rejected', or 'disabled' require admin authorization.
2. Unapproved provider profiles ('pending', 'rejected', 'disabled') cannot be read by public unauthenticated visitors.
3. Only the authenticated provider owner or an admin can update provider profile information.
4. Users cannot escalate their own role to 'admin' in the database.
5. Bootstrapped admin is verified by trusted admin document lookup or configured runtime admin email (jamhur48229@gmail.com).
6. Categories can be read by everyone (public), but modified only by admins.
7. Providers can safely record view and click metrics for analytics.

## 2. Dirty Dozen Threat Vectors & Mitigations
1. **Self-Approval Attack**: A pending provider submits an update setting `status: 'approved'`. Blocked: provider updates cannot modify `status`.
2. **Ghost Provider Insertion**: An unauthenticated user attempts to create a provider profile. Blocked: `isSignedIn()` required, and initial status must be `'pending'`.
3. **Role Escalation**: Normal user updates `role: 'admin'` in `users/{uid}`. Blocked: users cannot alter role field.
4. **Data Hijacking**: Attacker tries to modify another provider's WhatsApp or details. Blocked: must match `resource.data.userId == request.auth.uid` or `isAdmin()`.
5. **PII Scraping**: Public user tries to list all pending or rejected providers. Blocked: `allow list` requires `resource.data.status == 'approved'`.
6. **Malicious Category Injection**: Non-admin adds fraudulent service categories. Blocked: only `isAdmin()` can write categories.
7. **Junk Field Injection**: Attacker injects 1MB arbitrary metadata properties. Blocked: `hasOnly` and property size limits.
8. **Invalid ID Injection**: Document ID tampering with special characters. Blocked: `isValidId(id)` pattern checking.
9. **Timestamp Falsification**: Client sends future `createdAt`. Blocked: server timestamp validation.
10. **Provider Impersonation**: Setting `userId` to a different user's UID on create. Blocked: `incoming().userId == request.auth.uid`.
11. **Admin Document Tampering**: Attacker tries writing directly to `admins/{uid}`. Blocked: only existing admins can write.
12. **Blanket List Leak**: Querying `/providers` without constraints attempting to view pending records. Blocked: rules evaluate `resource.data.status == 'approved'`.
