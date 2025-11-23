"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { X } from "lucide-react"

interface VideoModalProps {
    isOpen: boolean
    onClose: () => void
    videoUrl: string
    title: string
}

export function VideoModal({ isOpen, onClose, videoUrl, title }: VideoModalProps) {
    // Helper to get embed URL for YouTube
    const getEmbedUrl = (url: string) => {
        try {
            if (url.includes("youtube.com") || url.includes("youtu.be")) {
                let videoId = ""
                if (url.includes("youtu.be")) {
                    videoId = url.split("/").pop() || ""
                } else {
                    const urlObj = new URL(url)
                    videoId = urlObj.searchParams.get("v") || ""
                }
                return `https://www.youtube.com/embed/${videoId}?autoplay=1`
            }
            return url
        } catch (e) {
            return url
        }
    }

    const embedUrl = getEmbedUrl(videoUrl)
    const isYouTube = videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be")

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[800px] p-0 bg-black border-neutral-800 overflow-hidden">
                <div className="relative w-full aspect-video bg-black">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 z-50 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>

                    {isYouTube ? (
                        <iframe
                            src={embedUrl}
                            title={title}
                            className="w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        />
                    ) : (
                        <video
                            src={videoUrl}
                            controls
                            autoPlay
                            className="w-full h-full"
                        >
                            Your browser does not support the video tag.
                        </video>
                    )}
                </div>
                <div className="p-4 bg-neutral-900">
                    <h3 className="text-lg font-medium text-white">{title}</h3>
                </div>
            </DialogContent>
        </Dialog>
    )
}
