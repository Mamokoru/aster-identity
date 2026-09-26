---
description: "Use when writing or refactoring TypeScript and TSX. Apply SOLID design principles and choose suitable design patterns pragmatically."
applyTo: ["**/*.ts", "**/*.tsx"]
---

# SOLID and Design Pattern Guidelines

- Follow existing project and framework conventions first. For Next.js changes, read the relevant version-specific documentation required by the repository's `AGENTS.md`.
- Apply SOLID to improve cohesion, changeability, substitutability, and testability. Treat the principles as design guidance, not a checklist that requires extra layers.
- Give each component, module, and function one clear responsibility. Keep component props and interfaces focused on what their consumers need.
- Preserve established contracts when changing implementations; additions should remain substitutable for existing implementations.
- Use composition and isolate likely-to-change behavior when doing so reduces coupling. Introduce an abstraction only when it separates a real boundary, supports meaningful variation, or makes important behavior easier to test.
- Select the simplest design pattern that addresses a concrete recurring problem. Prefer the codebase's existing patterns; do not introduce factories, strategies, repositories, service layers, or dependency-injection frameworks speculatively.
- Keep domain or application decisions independent of infrastructure where that boundary is meaningful. Avoid creating interfaces for a single implementation without a concrete need.
- Before a broad structural change, state the design choice and its tradeoff. Keep routine edits focused and avoid unrelated refactoring.
