"use client"

import { Dialog, DialogContent } from "@/components/ui/dialog"
import { X, Download, Maximize2, Minimize2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"

interface FilePreviewModalProps {
    isOpen: boolean
    onClose: () => void
    fileUrl: string
    title: string
    fileType: "PDF" | "IMAGE" | "DOC" | "DOCUMENT"
}

export function FilePreviewModal({ isOpen, onClose, fileUrl, title, fileType }: FilePreviewModalProps) {
    const [isFullscreen, setIsFullscreen] = useState(false)

    const handleDownload = () => {
        const link = document.createElement("a")
        link.href = fileUrl
        link.download = title
        link.target = "_blank"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    const toggleFullscreen = () => {
        setIsFullscreen(!isFullscreen)
    }

    // For documents, use Google Docs Viewer
    const getDocumentUrl = () => {
        if (fileType === "DOC" || fileType === "DOCUMENT") {
            // Use Google Docs Viewer for better compatibility
            return `https://docs.google.com/gview?url=${encodeURIComponent(fileUrl)}&embedded=true`
        }
        return fileUrl
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent
                className={`p-0 bg-white border-gray-200 overflow-hidden flex flex-col ${isFullscreen ? "sm:max-w-[98vw] sm:max-h-[98vh]" : "sm:max-w-[90vw] sm:max-h-[90vh]"
                    }`}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 shrink-0">
                    <h3 className="text-lg font-semibold text-gray-900 truncate pr-4 flex-1">{title}</h3>
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={toggleFullscreen}
                            className="flex items-center space-x-2"
                            title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                        >
                            {isFullscreen ? (
                                <Minimize2 className="h-4 w-4" />
                            ) : (
                                <Maximize2 className="h-4 w-4" />
                            )}
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleDownload}
                            className="flex items-center space-x-2"
                        >
                            <Download className="h-4 w-4" />
                            <span className="hidden sm:inline">Download</span>
                        </Button>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-md hover:bg-gray-200 transition-colors"
                            title="Close"
                        >
                            <X className="h-5 w-5 text-gray-600" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto bg-gray-100">
                    {fileType === "PDF" ? (
                        <iframe
                            src={fileUrl}
                            title={title}
                            className={`w-full ${isFullscreen ? "h-[calc(98vh-4rem)]" : "h-[80vh]"}`}
                        />
                    ) : fileType === "IMAGE" ? (
                        <div className={`flex items-center justify-center p-4 ${isFullscreen ? "min-h-[calc(98vh-4rem)]" : "min-h-[80vh]"}`}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={fileUrl}
                                alt={title}
                                className={`max-w-full object-contain ${isFullscreen ? "max-h-[calc(98vh-4rem)]" : "max-h-[80vh]"}`}
                            />
                        </div>
                    ) : (
                        // For DOC/DOCUMENT types, use Google Docs Viewer
                        <iframe
                            src={getDocumentUrl()}
                            title={title}
                            className={`w-full ${isFullscreen ? "h-[calc(98vh-4rem)]" : "h-[80vh]"}`}
                        />
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
