//#region Imports
import { auth } from "@clerk/nextjs/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
//#endregion

//#region POST /api/blob/upload
// Vercel Blob client-upload endpoint.
// Flow: client llama `upload()` del SDK → pega acá con body→ esta route
// genera token firmado → client sube directo al Blob store → retorna URL pública.
// Auth: solo user logueado. Tipos: images/*. Max 5MB.
export async function POST(req: Request) {
  const body = (await req.json()) as HandleUploadBody;

  try {
    const response = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async () => {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");
        return {
          allowedContentTypes: ["image/png", "image/jpeg", "image/webp", "image/gif"],
          maximumSizeInBytes: 5 * 1024 * 1024,
        };
      },
      onUploadCompleted: async ({ blob }) => {
        // Hook post-upload si querés trackear en DB o revalidar path.
        console.log("[blob-upload] completed", blob.pathname);
      },
    });
    return Response.json(response);
  } catch (error) {
    console.error("[blob-upload]", error);
    const msg = error instanceof Error ? error.message : "upload failed";
    return Response.json({ error: msg }, { status: 400 });
  }
}
//#endregion
