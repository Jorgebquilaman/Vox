# AGENTS.md

Vox: dynamic scoring-survey system. .NET 8 Clean Architecture backend + React 19/Vite PWA frontend. UI text and domain terms are in Spanish.

## Layout
- `src/Vox.Domain` — entities, domain interfaces (no dependencies).
- `src/Vox.Application` — use cases, DTOs, app interfaces. `AddApplication()` DI.
- `src/Vox.Infrastructure` — EF Core (Npgsql), repositories, auth, SIU-Guaraní integration. `AddInfrastructure()` DI in `DependencyInjection.cs`.
- `src/Vox.Api` — controllers, middleware, `Program.cs`. Only project that references Infrastructure.
- `tests/Vox.Domain.Tests`, `tests/Vox.Application.Tests` — xUnit + Moq.
- `frontend/` — Vite app, feature-sliced (`src/features/{admin,auth,surveys}`, `src/shared`).

Dependency direction: Api → Application/Infrastructure → Domain. Do not add outward references (e.g. Domain must not reference Infrastructure).

## Backend commands
Run from repo root.
- Build: `dotnet build Vox.sln`
- Test all: `dotnet test`
- Single test project: `dotnet test tests/Vox.Application.Tests`
- Filter one test: `dotnet test --filter "FullyQualifiedName~SomeTest"`
- Run API: `dotnet run --project src/Vox.Api` → http://localhost:5238, Swagger at `/swagger` (Development only).
- EF migrations (migrations live in Infrastructure, but startup project must be Api):
  `dotnet ef migrations add <Name> --project src/Vox.Infrastructure --startup-project src/Vox.Api`
  `dotnet ef database update --project src/Vox.Infrastructure --startup-project src/Vox.Api`

There is NO automatic migration on startup — apply migrations manually.

## Frontend commands
Run from `frontend/`.
- Dev: `npm run dev` → http://localhost:5173, proxies `/api` → `http://localhost:5238` (start the backend too).
- Build: `npm run build` (runs `tsc -b` then `vite build`; type errors fail the build).
- Lint: `npm run lint` (oxlint, not eslint).

## Setup / infra
- DB: `docker compose up -d` starts Postgres 16 (db `encuesta_puntaje`, user/pass `postgres`).
- Config: copy `.env.example`; secrets read from `appsettings.json` / env. `appsettings.Local.json` and `.env` are git-ignored.
- SIU-Guaraní integration is optional; toggled by `SiuGuarani:Enabled` config. When false, `SiuGuaraniDisabledFallback` is injected.

## Conventions / gotchas
- Auth is JWT Bearer; frontend stores token in `localStorage` as `vox_token`, auto-attached via axios interceptor (`frontend/src/shared/lib/api.ts`). 401 clears storage and redirects to `/login`.
- Repositories registered per-interface in `DependencyInjection.cs`; add new repos there.
- Some generated `obj/` artifacts still use the old assembly name `EncuestaConPuntaje`; current project/namespace is `Vox` — ignore stale obj references.
- No comments convention in code; keep changes idiomatic to each layer.

## Work summary

### Completed
- **Backend AI feature (full)**:
  - `DeepSeekSettingsEntity`, `IDeepSeekSettingsRepository`, `DeepSeekSettingsRepository` — DB persistence of DeepSeek config
  - `IDeepSeekSettingsProvider`/`DeepSeekSettingsProvider` — resolves effective config (DB > IOptions)
  - `DeepSeekService` now injects provider (not IOptions); calls `BuildDemoSurvey` when disabled
  - `DeepSeekSettingsDto` + controller GET/PUT `/settings/deepseek` (password hidden on read)
  - Migration `AddDeepSeekSettings` (table seeded with singleton row Id=1)
  - `SurveyAIService` orchestrates `IPdfTextExtractor` + `IDeepSeekService`
  - `POST /api/surveys/generate-from-pdf` (Admin, IFormFile)
  - DI setup: `services.Configure<DeepSeekSettings>`, `AddHttpClient<IDeepSeekService, DeepSeekService>`, repo/provider reg
- **Frontend AI UI**:
  - `GenerateWithAIModal` (file picker, drag/drop, loading, calls API, returns survey + usedAi + originalPdfBase64)
  - `generateSurveyFromPdf(file)` API helper
  - "Generar con IA" button in SurveyListPage → `/survey/new?ai=1`
  - Button in SurveyBuilderPage header → modal → prefill builder state
- **Original PDF storage (back + front merged)**:
  - Backend: `CreateSurveyDto` has `OriginalPdfBase64`, stored as `Survey.OriginalPdf` (byte[]?) on creation
  - Backend: `ResponsePdfData.OriginalPdfBase64` populated in `GetResponsePdfDataAsync`
  - Frontend: types extended (`originalPdfBase64` in CreateSurvey & ResponsePdfData)
  - Frontend: `GenerateWithAIModal` reads file to base64 after generation, passes to callback
  - Frontend: `SurveyBuilderPage` stores base64 in state, sends on POST (not PUT)
  - Frontend: `generateResponsePdf.ts` uses `pdf-lib` to merge original PDF pages + jsPDF response page + QR
  - `pdf-lib` installed
- **Frontend design unification ("Dean's Desk")**:
  - `SectionHeading` shared component (title + double rule + eyebrow + actions)
  - All pages use design tokens: primary #1e3a5f, accent #a16207, muted-text, border, surface, ink, success, error
  - Cards with amber top-rule (`border-t-2 border-t-accent/60`), 11px uppercase labels
  - LoginPage, StudentDashboard, SurveyResponsePage, PreinscripcionPage, VerifyResponsePage, ResultsPage, ResponseFormPage, SurveyBuilderPage, Layout, EmptyState, QuestionRenderer all unified
  - Profile/analytics: `provincia` and `pais` added (8 demographics total)
  - `JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase` in Program.cs
- **PWA workbox**: `maximumFileSizeToCacheInBytes` set to 4 MiB

### Active
- (none)

### Blocked
- (none)

### Remaining
- (none)

