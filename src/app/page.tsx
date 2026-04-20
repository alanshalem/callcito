//#region Imports
import { Waitlist } from '@clerk/nextjs'
//#endregion

//#region Home Page
// Landing "/". Renderiza el componente Waitlist de Clerk para captar emails
// antes del launch. La ruta está protegida por el middleware: si no está
// en `isPublicRoute`, exige login.
export default function Home() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <Waitlist />
      </main>
    </div>
  )
}
//#endregion
