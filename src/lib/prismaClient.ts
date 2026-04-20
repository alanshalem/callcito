//#region Imports
import { PrismaClient } from '@prisma/client'
//#endregion

//#region Global Declaration
// Declara `prisma` en el scope global para reusar instancia entre HMR reloads
// en dev (Next.js recarga módulos y crearía múltiples clients → warning
// "Too many connections").
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}
//#endregion

//#region Prisma Singleton
// Reusa instancia global si existe; si no, crea una nueva.
// En production cada lambda/process arranca limpio → no hace falta cachear.
export const prismaClient = globalThis.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prismaClient
//#endregion
