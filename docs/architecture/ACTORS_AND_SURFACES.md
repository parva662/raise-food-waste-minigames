# Actors and surfaces

Roles determine **who may use a surface**. They do **not** determine the source tree. Do not create `src/student/`, `src/chef/`, or `src/admin/` as architecture.

## Conceptual actors

### 1. Canteen participant

Person eating in the canteen. Older source and contracts still say “student” in places. That global terminology rename is **not** part of the repository architecture refactor.

Uses **Lunch Declaration** (default / empty hash).

### 2. Kitchen staff

People working in the kitchen (in this pilot they are often students of the kitchen programme). They use operational and practical kitchen workflows:

- Kitchen Forecast (`#/chef`)
- Service Closeout (`#/service-closeout`)
- Forecast Results participant (`#/chef-results`)
- Kitchen Skills Challenge (`#/kitchen-day*`)

### 3. Chef / trainer

Supervisory role. Uses the Kitchen Skills Challenge **trainer** surface (`#/kitchen-day-tutor`) to inspect student evidence and post `wastePracticeReview` as `SILENT_ACTIVITY` with `actors: [selectedStudentActorId]`. Trainer listing comes from `kitchenGroupInput.activities`. Live trainer posting is **enabled**.

### 4. Admin viewer

Read-only management / research viewer. Uses Forecast Results admin (`#/chef-results-admin`). Authorization is platform/GameBus visibility, not a frontend login.

## Surfaces vs domains

| Surface | Kind | Product |
|---------|------|---------|
| Lunch Declaration form | write | lunch-declaration |
| Kitchen Forecast form | write | kitchen-forecast |
| Service Closeout form | write | service-closeout |
| Forecast Results participant / admin | read | forecast-results |
| Kitchen Skills Challenge Trim / Reuse / Portion | write | kitchen-skills-challenge domain + challenge surface |
| Session review | read of current session | challenge surface, not a domain |
| Progress | historical read | progress surface, not a domain |
| Trainer | role-specific read + optional assessment write | trainer surface; assessment is the domain |

## Product folders, not role folders

```
src/products/kitchen-skills-challenge/
  domain/          trim, reuse, portion, assessment, session
  read/            projections
  surfaces/        challenge, progress, trainer
  gamebus/         adapters for this product
```
