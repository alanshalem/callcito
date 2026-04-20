"use server";

//#region Imports
import { prismaClient } from "@/lib/prismaClient";
import { currentUser } from "@clerk/nextjs/server";
//#endregion

//#region onAuthenticateUser
// Sincroniza el Clerk user con nuestra DB. NO crea Company — eso ocurre en
// /onboarding/company (la Company se vincula con una Clerk Organization).
// Returns:
//   { status: 200, user } → user ya existía
//   { status: 201, user } → recién creado
//   { status: 403 }       → sin sesión
//   { status: 500, error } → fallo inesperado
export async function onAuthenticateUser() {
  try {
    const user = await currentUser();

    if (!user) return { status: 403 as const };

    const existing = await prismaClient.user.findUnique({
      where: { clerkId: user.id },
    });
    if (existing) return { status: 200 as const, user: existing };

    const created = await prismaClient.user.create({
      data: {
        clerkId: user.id,
        email: user.emailAddresses[0]?.emailAddress ?? "",
        name: [user.firstName, user.lastName].filter(Boolean).join(" ") || "Sin nombre",
        profileImage: user.imageUrl,
      },
    });
    return { status: 201 as const, user: created };
  } catch (error) {
    console.error("[onAuthenticateUser]", error);
    return { status: 500 as const, error: "Internal Server Error" };
  }
}
//#endregion
