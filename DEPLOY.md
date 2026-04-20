# Deploy en Vercel — guía de configuración

Setup completo para deployar callcito en Vercel con webhooks funcionando end-to-end.

---

## 1. Prerequisitos

- Cuenta en [Vercel](https://vercel.com)
- Cuenta en [Neon](https://console.neon.tech) (Postgres)
- Cuenta en [Clerk](https://dashboard.clerk.com)
- Cuenta en [Vapi](https://vapi.ai/dashboard)
- Cuenta en [MercadoPago Developers](https://www.mercadopago.com.ar/developers/panel/app)
- Repo en GitHub con el código de callcito

---

## 2. Deploy inicial (sin webhooks)

1. En Vercel → **New Project** → importá tu repo de GitHub
2. Framework: **Next.js** (auto-detect)
3. Build Command: `prisma generate && next build` (ya en `package.json`)
4. Root directory: dejar por default
5. Antes de hacer deploy, agregá las env vars de abajo (sección 3)
6. **Deploy** — fallará la primera vez si faltan webhooks, eso es normal

Una vez deployado, te queda URL tipo `https://callcito.vercel.app` (o tu custom domain).

---

## 3. Variables de entorno en Vercel

Settings del proyecto → **Environment Variables** → agregar una por una (production + preview + development).

### Bloque Clerk — auth + organizations

| Variable | Dónde sacarla |
|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk Dashboard → API Keys → Publishable key |
| `CLERK_SECRET_KEY` | Clerk Dashboard → API Keys → Secret key |
| `NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL` | valor fijo: `/callback` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL` | valor fijo: `/callback` |
| `CLERK_WEBHOOK_SECRET` | Se configura después del primer deploy (sección 5.1) |

Activar **Organizations** en Clerk: Configure → Organizations → Enable.

### Bloque Database — Neon

| Variable | Dónde sacarla |
|---|---|
| `DATABASE_URL` | Neon Console → tu proyecto → Connection details → Connection string (pooled) |

Ejemplo: `postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require`

### Bloque Vapi — voice AI

| Variable | Dónde sacarla |
|---|---|
| `NEXT_PUBLIC_VAPI_PUBLIC_KEY` | Vapi Dashboard → Public Key |
| `VAPI_PRIVATE_KEY` | Vapi Dashboard → Private Key |
| `VAPI_WEBHOOK_SECRET` | Generar local: `openssl rand -hex 32` — mismo valor se pega en Vapi (sección 5.2) |

### Bloque MercadoPago

| Variable | Dónde sacarla |
|---|---|
| `MP_ACCESS_TOKEN` | MP Developers → tu app → Credenciales → **Access Token** (producción o test) |
| `MP_WEBHOOK_SECRET` | MP Developers → tu app → Webhooks → **Clave secreta** (después de crear webhook, sección 5.3) |

### Bloque App

| Variable | Valor |
|---|---|
| `NEXT_PUBLIC_BASE_URL` | `https://<tu-proyecto>.vercel.app` (o custom domain). Sin trailing slash. |

---

## 4. DB setup (1 sola vez)

Desde tu local, apuntando a la DB de Neon prod:

```bash
# Asegurate que DATABASE_URL en .env apunta a Neon prod
npx prisma db push              # crea tablas
npx tsx scripts/seed-plans.ts   # seed de planes Free/Starter/Pro/Enterprise
```

Alt: correr desde Vercel con `vercel env pull` + los comandos arriba localmente.

---

## 5. Configurar webhooks (post-deploy)

Hay tres webhooks que apuntan a tu URL de Vercel:

### 5.1 Clerk → `/api/webhooks/clerk`

1. Clerk Dashboard → **Webhooks** → **Add Endpoint**
2. Endpoint URL: `https://<tu-proyecto>.vercel.app/api/webhooks/clerk`
3. **Subscribe only to these events**:
   - `user.created`
   - `user.updated`
   - `user.deleted`
   - `organization.deleted`
   - `organizationMembership.created`
   - `organizationMembership.deleted`
4. Create → copiar **Signing Secret**
5. Pegar en Vercel env: `CLERK_WEBHOOK_SECRET=whsec_...`
6. Redeploy en Vercel (Deployments → Redeploy)

### 5.2 Vapi → `/api/webhooks/vapi` + tools

1. Vapi Dashboard → **Settings** (sidebar izq) → **Server URL**
2. URL: `https://<tu-proyecto>.vercel.app/api/webhooks/vapi`
3. **Authorization** → **+ Add New** (custom credential)
4. Crear una credencial tipo **Custom Header**:
   - Header name: `x-vapi-secret`
   - Header value: mismo hex de `VAPI_WEBHOOK_SECRET`
5. Seleccionar esa credencial en el dropdown → **Save**

Los endpoints de tools (`/api/vapi/tools/*`) usan el mismo secret via mismo header.

### 5.3 MercadoPago → `/api/webhooks/mercadopago`

1. MP Developers → tu app → **Webhooks** → **Configurar notificaciones**
2. Modo: **Producción** (o Test si estás probando)
3. URL de producción: `https://<tu-proyecto>.vercel.app/api/webhooks/mercadopago`
4. Eventos: seleccionar **Pagos** + **Suscripciones**
5. Guardar → copiar **Clave secreta**
6. Pegar en Vercel env: `MP_WEBHOOK_SECRET=...`
7. Redeploy

### 5.4 Post-webhooks → redeploy

Cada vez que agregás/cambiás env vars, Vercel necesita redeploy:
- Deployments → ⋯ → **Redeploy** (sin cache)

---

## 6. MercadoPago — Preapproval Plans (subscripciones SaaS)

Para que el upgrade de plan funcione (`/settings/billing`), hay que crear los planes en MP:

1. MP Developers → tu app → **Suscripciones** → **Crear plan**
2. Crear 3 planes: Starter (ARS 19.900), Pro (ARS 59.900). Free no requiere plan MP.
3. Copiar **Preapproval Plan ID** de cada uno
4. Update la DB (Prisma Studio o SQL directo):
   ```sql
   UPDATE "Plan" SET "mpPlanId" = 'xxx' WHERE tier = 'STARTER';
   UPDATE "Plan" SET "mpPlanId" = 'yyy' WHERE tier = 'PRO';
   ```

Enterprise es "contactar ventas" → no necesita plan automatizado.

---

## 7. Verificación end-to-end

1. Abrí `https://<tu-proyecto>.vercel.app` → ves landing
2. Sign up → crea user en Clerk + row en DB (via webhook)
3. `/onboarding/company` → crear empresa → crea Clerk Org + Company + Membership
4. `/catalogs/new` → crear catálogo
5. `/catalogs/[id]` → agregar producto manual
6. `/catalogs/[id]/import` → subir xlsx test (10 filas) → verificar aparezcan
7. `/assistants/new` → crear asistente → se sincroniza a Vapi (verificar en Vapi dashboard que aparece)
8. Asignar asistente al catálogo, publicar
9. Abrir URL pública `/c/<slug>/<catalog-slug>` → click "Hablar con asistente" → call real con Vapi
10. Pedir "agregá 2 productos al carrito" + "cobrame" → verifica link MP generado
11. Pagar en MP (modo test) → webhook MP actualiza order a APPROVED

Si algo falla, ver **Vercel → Runtime Logs** + **Vapi Dashboard → Logs** + **MP Dashboard → Webhooks → History**.

---

## 8. Debugging

| Problema | Causa probable | Fix |
|---|---|---|
| Loop /home ↔ /onboarding | Clerk orgId sin Company match | Ver [ActiveOrgGuard](src/components/ActiveOrgGuard.tsx) + onboarding page |
| Webhook Clerk 401 | `CLERK_WEBHOOK_SECRET` mal o falta redeploy | Verificar env + redeploy |
| Vapi tools 401 | Header `x-vapi-secret` no matcha | Chequear credencial Vapi y env |
| MP webhook invalid signature | `MP_WEBHOOK_SECRET` distinto al del panel | Resetear secret en MP + env |
| Prisma "Client not initialized" | Falta `prisma generate` en build | Ya está en `postinstall` + `build` |
| Assistant no aparece post-create | Vapi sync falló | Ver Vercel Runtime Log + Vapi Dashboard |

---

## 9. Custom Domain (opcional)

Vercel → Settings → Domains → agregar tu dominio. Actualizar:
- `NEXT_PUBLIC_BASE_URL` en Vercel env
- URLs en Clerk / Vapi / MP webhooks al nuevo dominio
- DNS CNAME según instrucciones Vercel

---

## Checklist rápido

- [ ] Deploy inicial OK
- [ ] Env vars (11 totales) cargadas
- [ ] `prisma db push` + seed plans corrido
- [ ] Clerk webhook creado + secret en Vercel
- [ ] Vapi server URL + custom header configurado
- [ ] MP webhook creado + secret en Vercel
- [ ] MP Preapproval plans creados + IDs en DB
- [ ] Test end-to-end pasa
