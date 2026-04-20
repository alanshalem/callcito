//#region Imports
import { defineConfig } from '@prisma/config'
//#endregion

//#region Prisma Config
// Prisma 7 sacó `url` del schema.prisma → ahora va acá.
// `prisma migrate` / `prisma db push` leen este archivo para la URL.
export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL,
  },
})
//#endregion
