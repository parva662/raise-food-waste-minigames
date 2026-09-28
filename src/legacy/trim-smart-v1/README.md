# Legacy Trim Smart v1

Deprecated implementation of the original Trim Smart GameBus embed.

## Why it is still here

This module is retained temporarily so the live Custom Embed route `#/waste/trim-smart` keeps working until that GameBus URL is confirmed unused.

Do **not** use this code for new Kitchen Skills Challenge work.

## What it posts

Activity slug: `trimSmart` (same slug as the current Kitchen Skills Challenge Trim step).

Payload is the **old** Trim Smart property set, including `practice` and `participantWasteGrams`. That is not the current Kitchen Skills Challenge Trim payload (`trimTechniques`, `estimatedWasteGrams`, `actualWasteGrams`, `duration`, and related properties).

Do **not** rewrite this payload.

## Current product

Kitchen Skills Challenge Trim lives in `src/products/kitchen-skills-challenge/` and is served from `#/kitchen-day`.

This legacy module must not be imported by that product.

## Deletion

Delete this folder only after live GameBus route usage for `#/waste/trim-smart` is confirmed unused.
