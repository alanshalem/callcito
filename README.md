# callcito

**SaaS de catálogos con asistente de ventas de voz AI para PyMEs LATAM.**

Tu cliente entra a un catálogo público, habla con un asistente de voz, arma el carrito conversando y recibe un link de pago por MercadoPago. El vendedor administra productos (carga manual o bulk xlsx/csv), configura el asistente (idioma, voz, prompt) y ve las ventas en tiempo real.

---

## Features

### Para el vendedor
- **Onboarding**: creás tu empresa (Clerk Organization) en 1 minuto
- **Catálogos**: múltiples catálogos por empresa con URL pública (`/c/<empresa>/<catálogo>`)
- **Productos**: alta manual o bulk upload de **xlsx / csv** (hasta 6.000 filas)
- **Asistentes**: configurás nombre, idioma (ES/PT/EN), voz (11labs) y system prompt
- **Equipo**: invitá colaboradores con roles (OWNER / ADMIN / EDITOR / VIEWER)
- **QR del catálogo**: compartilo en local físico, flyer, etc.
- **Métricas**: productos, conversaciones, órdenes del mes
- **Billing**: upgrade de plan vía MercadoPago (suscripción recurrente)

### Para el comprador
- Entra al catálogo público sin registro
- Toca "Hablar con asistente" → conversación de voz en tiempo real
- El asistente busca productos, responde preguntas, arma el carrito
- Al cerrar: link de pago de MercadoPago → se abre checkout
- Páginas success/failure/pending con estado real vía webhook MP

### Asistente — qué puede hacer
El asistente tiene 6 "tools" que llaman a la DB vía endpoints server:

| Tool | Propósito |
|---|---|
| `search_products` | Busca por nombre, descripción, tags, precio máximo |
| `get_product` | Detalle de un producto por ID |
| `add_to_cart` | Agrega N unidades al carrito de la conversación |
| `view_cart` | Enumera items + total |
| `remove_from_cart` | Saca producto |
| `checkout` | Crea MP Preference y devuelve link de pago |

---

## Stack

- **Runtime**: Next.js 16 (App Router, RSC, Server Actions) + React 19
- **DB**: Postgres en Neon (serverless) + Prisma 7 con adapter Neon (WebSockets)
- **Auth**: Clerk (incl. Organizations) — nativo multi-tenant
- **Voice AI**: Vapi (GPT-4o-mini + 11labs TTS + Deepgram STT)
- **Payments**: MercadoPago SDK v2 (Preference + Preapproval + webhook HMAC)
- **UI**: shadcn/ui + Tailwind v4 + base-ui tooltips
- **Forms state**: Zustand (cuando aplica)
- **XLSX/CSV**: librería propia `src/lib/xlsx-parser` — zero-deps (reemplaza `xlsx` package, que tenía CVEs)
- **Otros**: Zod (validators), react-dropzone (uploads), react-qr-code, svix (webhook sig), sonner (toasts)

---

## Arquitectura

```
┌──────────────────────────────────────────────────────────────────────┐
│                        Browser (comprador)                           │
│   /c/[slug]/[catalog]  ──►  <VoiceWidget> ──► Vapi SDK                │
└──────────────────────────────────────────────────────────────────────┘
                │                                        ▲
                ▼                                        │
┌──────────────────────────────────────────────────────────────────────┐
│                    Next.js 16 (Vercel/Node)                          │
│                                                                      │
│   Server Components + Server Actions                                 │
│     ├─ /actions/company.ts, catalog.ts, product.ts, assistant.ts     │
│     ├─ /actions/order.ts, subscription.ts, conversation.ts           │
│     │                                                                │
│   API Routes                                                         │
│     ├─ /api/products/import        — bulk xlsx/csv                   │
│     ├─ /api/vapi/tools/{6 tools}   — expuestos al asistente          │
│     ├─ /api/webhooks/clerk         — user/org/membership sync        │
│     ├─ /api/webhooks/vapi          — transcript + status             │
│     └─ /api/webhooks/mercadopago   — payment + preapproval updates   │
│                                                                      │
│   Middleware (proxy.ts) — Clerk auth + ruta pública /c/*             │
└──────────────────────────────────────────────────────────────────────┘
        │                         │                         │
        ▼                         ▼                         ▼
  ┌──────────┐             ┌────────────┐           ┌──────────────┐
  │  Neon PG │             │ Vapi Cloud │           │ MercadoPago  │
  └──────────┘             └────────────┘           └──────────────┘
```

### Schema (Prisma)

- **User** — 1 fila por Clerk user
- **Company** — empresa vendedor, linked a Clerk Organization via `clerkOrgId`
- **Membership** — User × Company × Role (OWNER / ADMIN / EDITOR / VIEWER)
- **Catalog** — lista de productos publicable (`/c/slug/catalog-slug`)
- **Product** — name, description, price, currency, stock, images[], tags[]
- **Assistant** — config del bot (language, voice, systemPrompt) + `vapiAssistantId`
- **Conversation** — 1 por call Vapi (assistant + catalog + transcript)
- **Cart + CartItem** — construido por el asistente durante la call
- **Order** — snapshot del cart al hacer checkout + `mpPreferenceId` + `mpPaymentId`
- **Plan** — FREE / STARTER / PRO / ENTERPRISE con límites
- **Subscription** — Company × Plan con estado MP Preapproval

---

## Planes

| Plan | ARS/mes | Catálogos | Productos | Asistentes | Conversaciones/mes | Voice clone | Custom domain |
|---|--:|--:|--:|--:|--:|:-:|:-:|
| **Free** | 0 | 1 | 50 | 1 | 50 | ❌ | ❌ |
| **Starter** | 19.900 | 3 | 500 | 2 | 300 | ❌ | ❌ |
| **Pro** | 59.900 | 10 | 5.000 | 5 | 1.500 | ✅ | ✅ |
| **Enterprise** | custom | ∞ | ∞ | ∞ | ∞ | ✅ | ✅ + SLA |

Enforcement en `src/lib/plan-limits.ts` (chequeo antes de cada create). Upgrade redirige a MercadoPago Preapproval → webhook activa la subscription.

---

## Setup local

**Requisitos**: Node 20+, cuenta en Clerk, Neon, Vapi, MercadoPago (test credentials).

```bash
# 1. Clonar + instalar
git clone <repo> callcito
cd callcito
npm install

# 2. Env
cp .env.example .env
#    → completar claves (ver sección "Env vars")

# 3. DB
npx prisma generate
npx prisma db push            # aplica schema

# 4. Seed de Plans
npx tsx scripts/seed-plans.ts

# 5. Dev server
npm run dev
```

Abrir http://localhost:3000 → sign-up → te manda a `/onboarding/company`.

### Webhooks en local

Los 3 webhooks (Clerk, Vapi, MP) requieren URL pública. Usá **ngrok** o **Cloudflare Tunnel**:

```bash
# Ejemplo con ngrok
ngrok http 3000
#   Copiar la URL https://xxx.ngrok.io a:
#   - Clerk Dashboard → Webhooks → Endpoint URL: https://xxx.ngrok.io/api/webhooks/clerk
#   - Vapi Dashboard → Server URL: https://xxx.ngrok.io/api/webhooks/vapi
#   - MP Dashboard → Webhook URL: https://xxx.ngrok.io/api/webhooks/mercadopago
#   - Actualizar NEXT_PUBLIC_BASE_URL=https://xxx.ngrok.io en .env
```

---

## Env vars

Ver `.env.example`. Resumen:

| Variable | Origen | Descripción |
|---|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk | Public key del frontend |
| `CLERK_SECRET_KEY` | Clerk | Server-side secret |
| `CLERK_WEBHOOK_SECRET` | Clerk Webhooks | Valida firma svix |
| `DATABASE_URL` | Neon | Connection string Postgres |
| `NEXT_PUBLIC_VAPI_PUBLIC_KEY` | Vapi | Widget browser-side |
| `VAPI_PRIVATE_KEY` | Vapi | Crear/editar assistants |
| `VAPI_WEBHOOK_SECRET` | Vapi | Valida firma de tool calls + events |
| `MP_ACCESS_TOKEN` | MercadoPago | APP_USR-... |
| `MP_WEBHOOK_SECRET` | MP Webhooks | HMAC-SHA256 signature |
| `NEXT_PUBLIC_BASE_URL` | self | URL pública de la app |

---

## Deploy

### Vercel (recomendado)

1. Import project desde GitHub
2. Add env vars (todas del `.env.example`, producción)
3. Build command: `npm run build` (default)
4. Deploy
5. Ir a Clerk / Vapi / MP y setear la URL de producción en los webhooks
6. Correr `npx tsx scripts/seed-plans.ts` apuntando a la DB de prod (una vez)

### Migraciones

En prod: `npx prisma migrate deploy` (usa archivos de `prisma/migrations/`). En dev: `npx prisma db push` o `migrate dev`.

---

## Roadmap

### MVP actual (done)
- Clerk Orgs + onboarding empresa
- Catálogos + productos + bulk xlsx/csv
- Asistente Vapi + 6 tools + widget público
- MercadoPago checkout + preapproval
- Planes + plan-limits enforcement
- Órdenes list + dashboard metrics + QR del catálogo

### Next
- [ ] Dashboard analytics avanzado (top productos, conversion rate, drop-off)
- [ ] Abandoned cart recovery (email/WhatsApp al comprador)
- [ ] pgvector: búsqueda semántica de productos (embeddings)
- [ ] A/B testing de prompts del asistente
- [ ] PWA + offline fallback
- [ ] Export de órdenes a CSV/XLSX (usando la lib interna)
- [ ] Audit log de cambios en productos
- [ ] Custom domain por company (Plan Pro+)
- [ ] i18n del catálogo público (ES/PT/EN)
- [ ] Soft-delete universal (Catalog, Product)
- [ ] Soporte MP Marketplace (split platform + seller)

---

## Estructura de carpetas

```
src/
├── actions/               # Server actions (Clerk-protected)
│   ├── auth.ts, company.ts, catalog.ts, product.ts
│   ├── assistant.ts, conversation.ts, order.ts, subscription.ts
├── app/
│   ├── (auth)/            # /sign-in, /sign-up, /callback, /sign-out
│   ├── (protectedRoutes)/ # dashboard vendedor
│   │   ├── home, catalogs, assistants, orders
│   │   ├── settings/{billing,team,company}
│   │   └── onboarding/company
│   ├── c/[companySlug]/   # público: catálogo + órdenes
│   └── api/
│       ├── products/import
│       ├── vapi/tools/{6}
│       └── webhooks/{clerk,vapi,mercadopago}
├── components/
│   ├── ui/                # shadcn
│   └── ReusableComponent/
├── lib/
│   ├── prismaClient.ts, vapi.ts, mercadopago.ts
│   ├── plan-limits.ts, type.ts (Zod), utils.ts
│   ├── vapi-tool-helpers.ts
│   └── xlsx-parser/       # librería propia zero-dep
├── store/                 # Zustand (cuando aplica)
└── proxy.ts               # Clerk middleware (Next 16)
prisma/
├── schema.prisma
└── migrations/
scripts/
└── seed-plans.ts
```

---

## License

Privado — no redistribuir sin autorización.
