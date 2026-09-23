# Kitchen Day — GameBus left-menu route contract

**Status:** Encoded on `feature/kitchen-day-v1`. Not production-activated.  
**LIVE E2E BLOCKED BY GAMEBUS ADMIN ALIGNMENT.**

Each row is a separate GameBus left-menu Custom Embed (or equivalent). Do not combine them into one student activity navigation.

| Page | Stable URL | Role | Posts | Required TASK templates | Required inputs |
|------|------------|------|-------|-------------------------|-----------------|
| Student Kitchen Day | `#/kitchen-day` (modules: `#/kitchen-day/reuse`, `#/kitchen-day/portion`, `#/kitchen-day/review`) | Student | `trimSmart`, `rescueAndReuse`, `portionPrecision` | Those three templates on one TASK | `inputCollectionPari.me`; group activities for hydration |
| Student Kitchen Day Progress | `#/kitchen-day-progress` | Student | none | none | `inputCollectionPari.me`; `kitchenGroupInput.activities` including own Trim/Reuse/Portion and `wastePracticeReview` history |
| Tutor Kitchen Day Dashboard | `#/kitchen-day-tutor` (selected session: `?sessionId=`) | Tutor | `wastePracticeReview` | `wastePracticeReview` on the tutor TASK | Group Kitchen Day activities + review activities |

Notes:

- Embedded student activity locks `sessionId` after TASK + authenticated user.
- Progress and tutor pages do not appear on the student Kitchen Day module nav.
- Tutor GameBus “on behalf of student” registration is out of scope until the live tutor mechanism is verified.
- `#/waste/trim-smart` remains Trim Smart v1 and is unchanged.
