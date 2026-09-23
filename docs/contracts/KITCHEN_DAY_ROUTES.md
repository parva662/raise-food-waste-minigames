# Kitchen Day — GameBus left-menu route contract

**Status:** Encoded on `feature/kitchen-day-v1`. Ready for production GitHub Pages Custom Embed URLs.
**Active GameBus environment:** `https://foodtracker.gamebus.eu`
**Student posting:** Enabled for Trim / Rescue / Portion after manual schema verification.
**Tutor posting:** Still blocked pending verified trainer-on-behalf-of-student semantics.

Each row is a separate GameBus left-menu Custom Embed (or equivalent). Do not combine them into one student activity navigation.

| Page | Stable URL | Role | Posts | Required TASK templates | Required inputs |
|------|------------|------|-------|-------------------------|-----------------|
| Student Kitchen Day | `#/kitchen-day` (modules: `#/kitchen-day/reuse`, `#/kitchen-day/portion`, `#/kitchen-day/review`) | Student | `trimSmart`, `rescueAndReuse`, `portionPrecision` | Those three templates on one TASK | `inputCollectionPari.me`; group activities for hydration |
| Student Kitchen Day Progress | `#/kitchen-day-progress` | Student | none | none | `inputCollectionPari.me`; `kitchenGroupInput.activities` including own Trim/Reuse/Portion and `wastePracticeReview` history |
| Tutor Kitchen Day Dashboard | `#/kitchen-day-tutor` (selected session: `?sessionId=`) | Tutor | `wastePracticeReview` | `wastePracticeReview` on the tutor TASK | Group Kitchen Day activities + review activities |

Notes:

- Embedded student activity locks `sessionId` after TASK + authenticated user.
- Progress and tutor pages do not appear on the student Kitchen Day module nav.
- Production GitHub Pages URLs:
  - `https://parva662.github.io/raise-food-waste-minigames/#/kitchen-day`
  - `https://parva662.github.io/raise-food-waste-minigames/#/kitchen-day-progress`
  - `https://parva662.github.io/raise-food-waste-minigames/#/kitchen-day-tutor`
- Next GameBus action: create those three Custom Embed Pages on foodtracker.gamebus.eu.
- Tutor GameBus “on behalf of student” registration is still unresolved. Do not submit tutor review in production until that mechanism is confirmed.
- `#/waste/trim-smart` remains Trim Smart v1 and is unchanged.
