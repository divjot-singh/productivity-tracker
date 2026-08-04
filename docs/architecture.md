Project Stack

Next.js App Router
Firebase Auth
Firestore
Firebase Admin
Tailwind v4
shadcn
TypeScript

Folder Structure

app/
components/
lib/
contexts/
docs/
models/
repositories/
services/
SVGs/

Rules

Business logic goes in repositories.

Global components goes in components

AuthContext and any other contexts or providers goes in contexts

Utilities, dashboard business logic, mocks, scoring engine, visualization business logic, fire store access utilities goes in lib

Interfaces goes in models

Firebase connection of entities which is used by backend goes in repositories

Other services goes in services

SVG Components goes in SVGs

Components remain presentational whenever possible.

No duplicate utility functions.

Use server actions only where appropriate.
