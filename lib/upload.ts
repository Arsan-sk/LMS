"use client"

import { upload } from "@vercel/blob/client"

export async function uploadFile(file: File): Promise<string> {
    try {
        // In production, use Vercel Blob client-side upload (bypasses 4.5MB limit)
        if (process.env.NEXT_PUBLIC_VERCEL_ENV === "production" || process.env.NEXT_PUBLIC_USE_BLOB) {
            const blob = await upload(file.name, file, {
                access: "public",
                handleUploadUrl: "/api/upload",
            })
            return blob.url
        }

        // In development, use traditional FormData upload
        const formData = new FormData()
        formData.append("file", file)
        const uploadRes = await fetch("/api/upload", { method: "POST", body: formData })

        if (!uploadRes.ok) {
            throw new Error("Upload failed")
        }

        const uploadData = await uploadRes.json()
        return uploadData.url
    } catch (error) {
        console.error("File upload error:", error)
        throw new Error("File upload failed")
    }
}
