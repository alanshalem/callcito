//#region Imports
import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'
//#endregion

//#region Global Declaration
// Declara `prisma` en el scope global para reusar instancia entre HMR reloads
// en dev (Next.js recarga módulos y crearía múltiples clients → warning
// "Too many connections").
declare global {
  var prisma: PrismaClient | undefined
}
//#endregion

//#region Prisma Singleton
// Prisma 7 exige adapter en el constructor (ya no lee `url` del schema).
// PrismaNeon usa WebSockets (neon/serverless) → apto para edge y node.
// Reusa instancia global si existe; si no, crea una nueva.
// En production cada lambda/process arranca limpio → no hace falta cachear.
const createPrismaClient = () =>
  new PrismaClient({
    adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL }),
  })

export const prismaClient = globalThis.prisma || createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prismaClient
//#endregion
