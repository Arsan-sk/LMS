import { NextResponse } from "next/server"
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client"
import { writeFile, mkdir } from "fs/promises"
import path from "path"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
        }

        // Use Vercel Blob client-side upload in production (bypasses 4.5MB limit)
        if (process.env.BLOB_READ_WRITE_TOKEN) {
            const body = (await req.json()) as HandleUploadBody

            try {
                const jsonResponse = await handleUpload({
                    body,
                    request: req,
                    onBeforeGenerateToken: async (pathname) => {
                        // Validate file before generating upload token
                        return {
                            allowedContentTypes: [
                                "image/*",
                                "video/*",
                                "application/pdf",
                                "application/msword",
                                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                                "application/zip",
                                "application/x-zip-compressed",
                                "text/plain",
                            ],
                            tokenPayload: JSON.stringify({
                                userId: session.user.id,
                            }),
                        }
                    },
                    onUploadCompleted: async ({ blob, tokenPayload }) => {
                        console.log("Upload completed:", blob.url)
                    },
                })

                return NextResponse.json(jsonResponse)
            } catch (error) {
                console.error("Blob upload error:", error)
                return NextResponse.json({ message: "Upload failed" }, { status: 400 })
            }
        }

        // Fallback to local filesystem for development
        const formData = await req.formData()
        const file = formData.get("file") as File

        if (!file) {
            return NextResponse.json({ message: "No file uploaded" }, { status: 400 })
        }

        const buffer = Buffer.from(await file.arrayBuffer())
        const filename = Date.now() + "_" + file.name.replaceAll(" ", "_")

        // Ensure uploads directory exists
        const uploadDir = path.join(process.cwd(), "public", "uploads")
        try {
            await mkdir(uploadDir, { recursive: true })
        } catch (e) {
            // Ignore if exists
        }

        const filepath = path.join(uploadDir, filename)
        await writeFile(filepath, buffer)

        const url = `/uploads/${filename}`

        return NextResponse.json({ url, filename }, { status: 201 })
    } catch (error) {
        console.error("Upload error:", error)
        return NextResponse.json({ message: "Internal server error" }, { status: 500 })
    }
}
