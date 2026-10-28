# My Food Journey (student dashboard)

**Documentation role:** Explanation / product intent for the read-only student Custom Page.

**Acceptance behaviour:** [`../../features/student/student-journey.feature`](../../features/student/student-journey.feature)

**Implementation:** `src/products/student-journey/` · route `#/student-journey`

**GameBus setup:** [`../how-to/configure-student-food-journey-access.md`](../how-to/configure-student-food-journey-access.md)

---

## Purpose

Give each authenticated canteen participant a personal, motivating view of their **lunch declaration history**. The page is a GameBus **Custom Page** (not a task). It never posts activities and does not replace Student Lunch missions.

## Surface rules

| Rule | Detail |
|------|--------|
| Route | `#/student-journey` (`STUDENT_JOURNEY_HASH_ROUTE`) |
| Embed kind | Custom Page / AppEmbedPage (`postsActivity: false`) |
| Identity | `inputCollectionPari.me` only |
| Activities | Personal `studentLunchCheckin` via `kitchenGroupInputSelf.activities` (`GET /api/me/activities`) |
| Deduping | One row per `targetDate` (latest `submittedAt`) |
| No lunch | Counts as participation |
| Cross-account | History shown only when `activity.actor.id` equals authenticated `me.id` |
| Badges / streaks / plate waste | Not calculated in this SPA; UI states the GameBus limitation when data is unavailable |

## Tabs

1. **Overview** — My participation counts, most recent declaration, explicit unavailable copy for streak/badges, next-step pointer to the existing Student Lunch menu/task (no invented availability).
2. **My Progress** — Participation timeline, declaration history (service date, meal/No lunch, quantities), and a reserved plate-measurements section that stays unavailable until a verified measurement contract exists.

## Out of scope

- Changing Student Lunch, Kitchen Forecast, Service Closeout, Kitchen Skills, badge rules, streaks, or leaderboards
- Using administrator group activity collections (`kitchenGroupInput`, trainer feeds)
- Treating local storage or standalone fixtures as GameBus persistence proof
