//#region Imports
import { prismaClient } from "@/lib/prismaClient";
import { headers } from "next/headers";
import { Webhook } from "svix";
//#endregion

//#region Clerk Webhook Handler
// Escucha eventos de Clerk (user.created/updated/deleted, organization.*,
// organizationMembership.*) y mantiene sincronizada la DB.
//
// Config: en Clerk Dashboard → Webhooks → Add Endpoint
//   URL: https://<tu-dominio>/api/webhooks/clerk
//   Events: user.created, user.updated, user.deleted,
//           organization.created, organization.deleted,
//           organizationMembership.created, organizationMembership.deleted
// Copiar "Signing Secret" a CLERK_WEBHOOK_SECRET en .env.
const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

export async function POST(req: Request) {
  if (!WEBHOOK_SECRET) {
    console.error("[clerk-webhook] CLERK_WEBHOOK_SECRET no configurado");
    return new Response("Server misconfigured", { status: 500 });
  }

  const headerPayload = await headers();
  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response("Missing svix headers", { status: 400 });
  }

  const body = await req.text();
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: ClerkWebhookEvent;
  try {
    evt = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as ClerkWebhookEvent;
  } catch (err) {
    console.error("[clerk-webhook] signature verification failed", err);
    return new Response("Invalid signature", { status: 400 });
  }

  try {
    await handleEvent(evt);
    return new Response("ok", { status: 200 });
  } catch (err) {
    console.error("[clerk-webhook] handler error", evt.type, err);
    return new Response("Handler error", { status: 500 });
  }
}
//#endregion

//#region Event dispatcher
async function handleEvent(evt: ClerkWebhookEvent) {
  switch (evt.type) {
    case "user.created":
    case "user.updated":
      return upsertUser(evt.data as UserEvt);
    case "user.deleted": {
      const data = evt.data as { id?: string };
      if (data.id) await prismaClient.user.deleteMany({ where: { clerkId: data.id } });
      return;
    }
    case "organization.deleted": {
      const data = evt.data as { id?: string };
      if (data.id)
        await prismaClient.company.deleteMany({ where: { clerkOrgId: data.id } });
      return;
    }
    case "organizationMembership.created":
      return addMembership(evt.data as MembershipEvt);
    case "organizationMembership.deleted":
      return removeMembership(evt.data as MembershipEvt);
    default:
      return;
  }
}

async function upsertUser(data: UserEvt) {
  const email = data.email_addresses?.[0]?.email_address;
  if (!email) return;
  const name =
    [data.first_name, data.last_name].filter(Boolean).join(" ") || "Sin nombre";
  await prismaClient.user.upsert({
    where: { clerkId: data.id },
    create: { clerkId: data.id, email, name, profileImage: data.image_url ?? null },
    update: { email, name, profileImage: data.image_url ?? null },
  });
}

async function addMembership(data: MembershipEvt) {
  const user = await prismaClient.user.findUnique({
    where: { clerkId: data.public_user_data.user_id },
  });
  const company = await prismaClient.company.findUnique({
    where: { clerkOrgId: data.organization.id },
  });
  if (!user || !company) return;

  const role = mapClerkRole(data.role);
  await prismaClient.membership.upsert({
    where: { userId_companyId: { userId: user.id, companyId: company.id } },
    create: { userId: user.id, companyId: company.id, role },
    update: { role },
  });
}

async function removeMembership(data: MembershipEvt) {
  const user = await prismaClient.user.findUnique({
    where: { clerkId: data.public_user_data.user_id },
  });
  const company = await prismaClient.company.findUnique({
    where: { clerkOrgId: data.organization.id },
  });
  if (!user || !company) return;
  await prismaClient.membership.deleteMany({
    where: { userId: user.id, companyId: company.id },
  });
}

function mapClerkRole(clerkRole: string): "OWNER" | "ADMIN" | "EDITOR" | "VIEWER" {
  if (clerkRole === "org:admin") return "ADMIN";
  if (clerkRole === "org:member") return "EDITOR";
  return "EDITOR";
}
//#endregion

//#region Types
// Clerk webhook payloads son `unknown` post-svix-verify (firma valida el sobre,
// no el shape). Narrowing manual por `type` + cast al shape esperado.
type ClerkWebhookEvent = { type: string; data: unknown };

type UserEvt = {
  id: string;
  email_addresses?: Array<{ email_address: string }>;
  first_name?: string | null;
  last_name?: string | null;
  image_url?: string;
};

type MembershipEvt = {
  public_user_data: { user_id: string };
  organization: { id: string };
  role: string;
};
//#endregion
