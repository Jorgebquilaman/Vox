# Vox — Sistema de Encuestas Dinámicas con Puntaje

Vox es un sistema web de encuestas dinámicas con scoring, diseñado para instituciones educativas. Permite crear formularios con preguntas tipificadas, asignar puntajes a las respuestas, generar reportes y visualizar rankings. Incluye generación de encuestas mediante IA a partir de PDFs, integración con SIU-Guaraní, y autenticación JWT.

**Stack:** .NET 8 Clean Architecture (backend) + React 19 / Vite PWA (frontend) + PostgreSQL 16.

---

## Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND (React 19)                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────┐   │
│  │   Auth   │ │  Admin   │ │ Surveys │ │   Shared       │   │
│  │  (login) │ │(crud, AI)│ │(respond)│ │(Layout, QR…)   │   │
│  └──────────┘ └──────────┘ └──────────┘ └───────────────┘   │
│                        │  API (axios)                       │
├────────────────────────┼────────────────────────────────────┤
│                   BACKEND (.NET 8)                          │
│  ┌──────────┐  ┌──────────────┐  ┌───────────────────┐      │
│  │   Api    │→ │  Application │→ │  Infrastructure   │      │
│  │Controller│  │   (UseCases) │  │(EF, Auth, PDF, IA)│      │
│  └──────────┘  └──────┬───────┘  └────────┬──────────┘      │
│                       │                   │                 │
│                       ▼                   ▼                 │
│                 ┌──────────┐      ┌──────────────┐          │
│                 │  Domain  │      │  PostgreSQL  │          │
│                 │(Entities)│      │    (16)      │          │
│                 └──────────┘      └──────────────┘          │
└─────────────────────────────────────────────────────────────┘
                         │
                    ┌────┴────┐
                    │ DeepSeek│  (API de IA)
                    │   API   │
                    └─────────┘
```

### Capas

| Capa | Rol | Dependencias |
|------|-----|-------------|
| **Vox.Domain** | Entidades, interfaces de repositorio, enums | Ninguna |
| **Vox.Application** | Casos de uso, DTOs, interfaces de aplicación | Domain |
| **Vox.Infrastructure** | EF Core, autenticación, servicios de IA/PDF/email | Application |
| **Vox.Api** | Controladores REST, middleware, Program.cs | Application + Infrastructure |

---

## Funcionalidades

### 📋 Gestión de Encuestas
- CRUD completo de encuestas con editor visual
- 10 tipos de pregunta: `Section`, `InfoText`, `SingleChoice`, `MultipleChoice`, `Dropdown`, `FreeText`, `SimpleField`, `StarRating`, `Thumbs`, `FileUpload`
- Preguntas condicionales (dependen de alternativas previas)
- Secciones repetibles (grupos dinámicos de preguntas)
- Publicar / cerrar encuestas, toggle de resultados públicos
- Clonación de encuestas existentes

### 🤖 Generación por IA (DeepSeek)
- Subir un PDF con el modelo de encuesta → la IA extrae las preguntas
- Detecta tipo de pregunta, alternativas, y posición (página + coordenadas Y)
- Previsualización y edición antes de guardar
- Fallback offline si la API no está configurada

### 📄 PDF de Respuesta
- Al descargar el PDF de una respuesta, se mergean:
  1. **Páginas del PDF original** (si la encuesta se generó desde PDF) con las respuestas **superpuestas** en las posiciones detectadas
  2. **Página de resumen** con tabla de respuestas y puntajes
  3. **Código QR** para verificar la respuesta
- Usa `pdf-lib` + `jsPDF` + `jspdf-autotable`

### 🧮 Scoring & Rankings
- Cada alternativa tiene un puntaje configurable
- Cálculo automático del puntaje total por respuesta
- Ranking visual con posiciones y puntajes
- Reportes con demografía del estudiante

### 🔐 Autenticación y Roles
- JWT Bearer token
- Roles: `Admin` y `Student`
- Login, cambio de contraseña, recuperación por email
- Perfiles de usuario con datos del SIU-Guaraní

### 🧩 Integración SIU-Guaraní
- Sincronización opcional de aspirantes, documentos, propuestas
- Deshabilitable por configuración (fallback automático)

### ⚙️ Configuración
- **DeepSeek**: habilitar/deshabilitar, API key, base URL, modelo, timeout (persistido en DB)
- **Email**: servidor SMTP, credenciales, pruebas de envío

---

## Flujos Principales

### 1. Crear encuesta desde PDF
```
[Usuario] → Sube PDF → [Backend] Extrae texto (PdfPig)
                       → [DeepSeek API] Genera JSON estructurado
                       → [Frontend] Previsualiza en builder
                       → [Usuario] Edita y guarda
```

### 2. Responder encuesta
```
[Estudiante] → Login → Lista encuestas disponibles
              → Selecciona → Completa formulario
              → Envía → [Backend] Calcula puntaje
              → Confirma → Descarga PDF (opcional)
```

### 3. Ver resultados
```
[Admin] → Panel → Selecciona encuesta
         → Ranking con puntajes
         → Exporta PDF individual por respuesta
         → Visualiza analytics (distribución, demografía)
```

### 4. Generar PDF de respuesta
```
[Frontend] GET /surveys/{id}/my-response/pdf-data
         → Recibe originalPdfBase64 + respuestas + coordenadas
         → [pdf-lib] Embed páginas del PDF original
         → [pdf-lib] Dibuja respuestas en coordenadas detectadas
         → [jsPDF] Genera página de resumen + QR
         → Mergea todo → Descarga
```

---

## Tecnologías

### Backend
- .NET 8, C# 12
- Entity Framework Core 8 (Npgsql)
- AutoMapper
- PdfPig (extracción de texto PDF)
- System.Text.Json

### Frontend
- React 19, TypeScript 5
- Vite 8, Tailwind CSS 4
- TanStack React Query 5
- React Router 7
- Phosphor Icons
- jsPDF + jspdf-autotable
- pdf-lib
- QRCode (qrcode)

### Infraestructura
- PostgreSQL 16 (Docker Compose)
- PWA (vite-plugin-pwa + workbox)
- DeepSeek API (IA)

---

## Comandos

```bash
# Backend
dotnet build Vox.sln
dotnet test
dotnet run --project src/Vox.Api

# Migraciones
dotnet ef migrations add <Name> --project src/Vox.Infrastructure --startup-project src/Vox.Api
dotnet ef database update --project src/Vox.Infrastructure --startup-project src/Vox.Api

# Frontend
cd frontend
npm run dev      # desarrollo (localhost:5173)
npm run build    # producción (tsc + vite build)
npm run lint     # oxlint

# Base de datos
docker compose up -d   # inicia PostgreSQL 16
```

---

## Convenciones

- **Idioma**: textos de UI y dominio en español
- **Código**: sin comentarios, nombres descriptivos en inglés
- **Arquitectura**: Clean Architecture, dependencias hacia adentro (Domain no conoce Infrastructure)
- **Auth**: JWT Bearer, token en `localStorage` como `vox_token`
- **Estado**: borrador → publicado → cerrado
- **Migraciones**: no automáticas, aplicar con `dotnet ef database update`

---

## Licencia

Uso educativo-institucional. Proyecto desarrollado para IUPA (Instituto Universitario Patagónico de las Artes).
