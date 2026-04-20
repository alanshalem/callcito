//#region Imports
import 'dotenv/config'
import { defineConfig } from '@prisma/config'
//#endregion

//#region Prisma Config
// Prisma 7 sacó `url` del schema.prisma → ahora va acá.
// `prisma migrate` / `prisma db push` leen este archivo para la URL.
// `dotenv/config` carga .env porque Prisma CLI no lo hace solo (a diferencia
// de Next.js). Sin esto, process.env.DATABASE_URL queda undefined.
export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL,
  },
})
//#endregion
