# Code Review: Weight Tracker Feature
Date: 2026-06-23
Reviewer: AI Agent (fresh context)

## Summary

- **Files reviewed:** 17
- **Issues found:** 14 (0 critical, 5 major, 6 minor, 3 nit)

| Severity | Count |
|----------|-------|
| Critical | 0     |
| Major    | 5     |
| Minor    | 6     |
| Nit      | 3     |

---

## Critical Issues

*None.*

---

## Major Issues

- [ ] **[OBS]** Controller logs duplicate operation start/success entries that are already captured by `RequestLoggingFilter` (MDC-based middleware). The per-handler `log.info` calls are redundant and add noise; worse, they log `weightKg` for every weigh-in request — consider whether body values qualify as PII under the project's data-classification rules (body weight is health/biometric data). The mandatory context fields `correlationId`, `operation`, and `duration` are missing from the controller logs, which are already populated by MDC but not surfaced here. — [WeightController.java:34–56](file:///d:/ElectroGhiuraiOrg/mys/backend/mys/src/main/java/com/electroghiurai/mys/features/weight/WeightController.java#L34-L56)

- [ ] **[OBS]** `WeightService` has zero logging. The `logWeight` upsert path, `deleteWeight` authorization check, and `getWeights` fetch are all silent operations. Per the Logging and Observability Mandate, every operation entry point (service-layer business operations that touch the database) must log start, success, and failure with `correlationId`, `operation`, and `duration`. Although the `RequestLoggingFilter` covers HTTP-layer start/end, the service layer has no visibility into the business outcome (e.g., "was this a create or an update?", "which user's data was deleted?"). — [WeightService.java:27–62](file:///d:/ElectroGhiuraiOrg/mys/backend/mys/src/main/java/com/electroghiurai/mys/features/weight/WeightService.java#L27-L62)

- [ ] **[TEST]** `WeightControllerIT` uses `@SpringBootTest` but there is no Testcontainers setup, no H2 in-memory database configuration found in `src/test/resources/application.properties`. Integration tests must run against real infrastructure (Testcontainers per `testing-strategy.md`) or a correctly configured in-memory substitute. As written, the `@SpringBootTest` context requires a live database to start, making the test environment unclear and potentially broken in CI without a running PostgreSQL instance. — [WeightControllerIT.java:24–26](file:///d:/ElectroGhiuraiOrg/mys/backend/mys/src/test/java/com/electroghiurai/mys/features/weight/WeightControllerIT.java#L24-L26)

- [ ] **[TEST]** `WeightControllerIT` uses `@Transactional` on the test class to auto-rollback after each test — a common Spring Boot pattern — but `getWeightsReturnsChronologicalOrder` at line 181 posts three items without asserting the `status().isCreated()` for the setup requests. If any setup POST fails silently, the ordering assertion produces a misleading false-positive. All test setup HTTP calls must be asserted individually, as required by the test strategy's "test happy path AND at least one error path" rule for integration tests. — [WeightControllerIT.java:186–209](file:///d:/ElectroGhiuraiOrg/mys/backend/mys/src/test/java/com/electroghiurai/mys/features/weight/WeightControllerIT.java#L186-L209)

- [ ] **[TEST]** `WeightPage.spec.tsx` has no test for the `handleDeleteWeight` path. The delete flow involves `window.confirm`, a network call, and a refresh fetch — a three-step interaction that is not covered. The spec also does not test the error state (e.g., what is rendered when `fetchData` rejects). Per `testing-strategy.md`, error paths must be tested. — [WeightPage.spec.tsx:1–122](file:///d:/ElectroGhiuraiOrg/mys/frontend/src/features/weight/tests/WeightPage.spec.tsx#L1-L122)

---

## Minor Issues

- [ ] **[PAT]** `WeightService.deleteWeight` throws `IllegalArgumentException` for a not-found record (line 55). The project pattern (visible in `TrackerService` and confirmed by `GlobalExceptionHandler`) maps `IllegalArgumentException` → 400 Bad Request, while a missing resource should semantically return 404. The integration test at `WeightControllerIT:144–149` even asserts `status().isBadRequest()` for this case, which is a leaking implementation detail surfacing incorrectly as a client error. A domain-specific `ResourceNotFoundException` → 404 would align with `api-design-principles.md` ("Not Found Errors — Resource doesn't exist"). — [WeightService.java:54–55](file:///d:/ElectroGhiuraiOrg/mys/backend/mys/src/main/java/com/electroghiurai/mys/features/weight/WeightService.java#L54-L55)

- [ ] **[PAT]** `WeightPage.tsx` (line 156) computes `currentWeight` using the last element of the `weights` array (which arrives sorted ascending by `loggedDate` from the backend), but the `WeightHistoryTable` re-sorts the same array descending for display. This implicit dependency on backend sort order is fragile — if the backend order changes, the metrics silently compute the wrong "current weight". The array should be explicitly sorted before taking the last element. — [WeightPage.tsx:156](file:///d:/ElectroGhiuraiOrg/mys/frontend/src/features/weight/WeightPage.tsx#L156)

- [ ] **[PAT]** `WeightPage.tsx` uses a single shared `isLoading` boolean for all three async operations: `fetchData`, `handleLogWeight`, `handleUpdateGoals`, and `handleDeleteWeight`. When any one of these is in flight, all form buttons across the whole page become disabled. This creates confusing UX (e.g., clicking "Delete" disables the weight logger) and represents tight coupling of unrelated loading states. Each async operation should have its own loading flag. — [WeightPage.tsx:19](file:///d:/ElectroGhiuraiOrg/mys/frontend/src/features/weight/WeightPage.tsx#L19)

- [ ] **[PAT]** `WeightLogDto` exposes `Double weightKg` (boxed type, nullable by default in Java) rather than `double` (primitive). Since `weightKg` is `@Column(nullable = false)` and validated as `@NotNull` on the request DTO, the boxed return type in `WeightLogDto` introduces a spurious nullability signal that pollutes callers. Use `double` (primitive) in the record to align the type contract with the schema constraint. — [WeightDtos.java:19](file:///d:/ElectroGhiuraiOrg/mys/backend/mys/src/main/java/com/electroghiurai/mys/features/weight/WeightDtos.java#L19)

- [ ] **[INT]** `weight.api.ts` Zod schema uses `z.string()` for `id` (line 4) rather than a UUID-format string (e.g., `z.string().uuid()`). Backend always returns a UUID; the relaxed schema accepts any string, losing the validation signal at the boundary. Consistent with the "validate on ingress" rule from `typescript-idioms-and-patterns.md`. — [weight.api.ts:4](file:///d:/ElectroGhiuraiOrg/mys/frontend/src/features/weight/weight.api.ts#L4)

- [ ] **[INT]** `weight.api.ts` `logWeight` and `deleteWeight` parse the outer `request<T>` return directly (lines 29–39). The backend wraps all responses in `{ "data": ... }` (confirmed in `WeightController`), but the `weightApi` assumes the `request` function already unwraps the envelope and returns the inner object. This works if `apiFetch` unwraps, but the contract between `apiFetch` and `weightApi` is implicit and invisible at this layer. The `getWeights` call at line 24 calls `request<unknown>('/weights')` and then parses `raw` — if `raw` is the full `{ data: [...] }` envelope, parsing it as `z.array(WeightLogSchema)` will fail silently or throw. The envelope-unwrapping contract must be explicit and documented in `weight.api.ts`. — [weight.api.ts:23–40](file:///d:/ElectroGhiuraiOrg/mys/frontend/src/features/weight/weight.api.ts#L23-L40)

---

## Nit

- [ ] `WeightProgressBar.tsx` hardcodes the label `"Target Deficit Progress"` (line 17) even when `progressDirection` is `'gain'` (i.e., the user's goal is to gain weight, not lose it). The label should reflect the actual goal direction. — [WeightProgressBar.tsx:17](file:///d:/ElectroGhiuraiOrg/mys/frontend/src/features/weight/components/WeightProgressBar.tsx#L17)

- [ ] `WeightTrendChart.tsx` uses SVG `<linearGradient id="chartGradient">` with a hardcoded `id` (line 102). If this component is ever rendered more than once on a page (or alongside another chart using the same `id`), the gradient will be shared/overridden. Use a unique `id` derived from a `useId()` hook or a stable unique string. — [WeightTrendChart.tsx:102](file:///d:/ElectroGhiuraiOrg/mys/frontend/src/features/weight/components/WeightTrendChart.tsx#L102)

- [ ] `WeightPage.tsx` uses `window.confirm` for delete confirmation (line 137). `window.confirm` is not mocked in `WeightPage.spec.tsx`, meaning any future test that triggers `handleDeleteWeight` will block or produce unexpected results in JSDOM. Prefer a controlled in-component confirmation modal or at minimum mock `window.confirm` in the test suite. — [WeightPage.tsx:137](file:///d:/ElectroGhiuraiOrg/mys/frontend/src/features/weight/WeightPage.tsx#L137)

---

## Rules Applied

| Rule | Dimensions Checked |
|------|--------------------|
| `rule-priority.md` | Severity classification and conflict resolution |
| `security-principles.md` | Auth enforcement, PII in logs, input validation boundary |
| `logging-and-observability-mandate.md` | 3-point logging (start/success/failure), mandatory context fields, redundant vs. missing logging |
| `error-handling-principles.md` | Exception type appropriateness, HTTP status mapping, no silent failures |
| `api-design-principles.md` | HTTP status codes (404 vs 400), error envelope format, response wrapping contract |
| `testing-strategy.md` | Test pyramid (unit/integration/E2E), error path coverage, test infra (Testcontainers), IT setup assertions |
| `architectural-pattern.md` | Testability-first, I/O isolation, dependency direction |
| `typescript-idioms-and-patterns.md` | Zod boundary validation (`z.string().uuid()`), runtime schema enforcement |
| `code-organization-principles.md` | Single responsibility (shared `isLoading`), pattern consistency across feature |

---

## Cross-Boundary Dimensions Covered

| Dimension | Files / Queries Examined |
|-----------|--------------------------|
| Integration contract (API envelope) | `WeightController.java` response format vs. `weight.api.ts` Zod parsing |
| Authorization | `WeightService.deleteWeight` ownership check, `WeightControllerIT.deleteWeight_ofAnotherUser_returnsForbidden` |
| Input validation | `WeightDtos.LogWeightRequest` Bean Validation annotations, `WeightPage.tsx` client-side guard |
| DB schema | `WeightLog.java` entity constraints (`@UniqueConstraint`, `nullable = false`, `@PrePersist`) |
| Error handling pipeline | `GlobalExceptionHandler.java` — exception type mappings, sanitization |
| Observability infrastructure | `RequestLoggingFilter.java` MDC lifecycle, SLF4J usage across backend files |
| Test infrastructure | `application.properties` in `src/test/resources`, absence of Testcontainers, `@Transactional` rollback pattern |
| Frontend test mocking | `WeightPage.spec.tsx` — `vi.mock` coverage, `window.confirm` absence, missing delete/error path coverage |
