# Domain Docs

How the engineering skills should consume this repo's domain documentation.

## Before exploring, read these

- **CONTEXT.md** at the repo root if it exists
- **docs/adr/** - read ADRs that touch the area you're about to work in

If any of these files don't exist, **proceed silently**. Don't flag their absence.

## File structure

Single-context repo:

`
/
+-- CONTEXT.md
+-- docs/adr/
+-- src/
`

## Use the glossary vocabulary

When your output names a domain concept, use the term as defined in CONTEXT.md. Don't drift to synonyms the glossary explicitly avoids.

## Flag ADR conflicts

If your output contradicts an existing ADR, surface it explicitly rather than silently overriding.
