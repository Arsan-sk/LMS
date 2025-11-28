"use client"

import { Dialog, DialogContent } from "@/components/ui/dialog"
import { X, Download } from "lucide-react"
import { Button } from "@/components/ui/button"

interface FilePreviewModalProps {
    isOpen: boolean
    onClose: () => void
    fileUrl: string
    title: string
    fileType: "PDF" | "IMAGE" | "DOC" | "DOCUMENT"
}

export function FilePreviewModal({ isOpen, onClose, fileUrl, title, fileType }: FilePreviewModalProps) {
    const handleDownload = () => {
        const link = document.createElement("a")
        link.href = fileUrl
        link.download = title
        link.target = "_blank"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[90vw] sm:max-h-[90vh] p-0 bg-white border-gray-200 overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
                    <h3 className="text-lg font-semibold text-gray-900 truncate pr-4">{title}</h3>
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleDownload}
                            className="flex items-center space-x-2"
                        >
                            <Download className="h-4 w-4" />
                            <span>Download</span>
                        </Button>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full hover:bg-gray-200 transition-colors"
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
                            className="w-full h-[80vh]"
                        />
                    ) : fileType === "IMAGE" ? (
                        <div className="flex items-center justify-center p-4 min-h-[80vh]">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={fileUrl}
                                alt={title}
                                className="max-w-full max-h-[80vh] object-contain"
                            />
                        </div>
                    ) : (
                        // For DOC/DOCUMENT types, try to use Google Docs Viewer
                        <iframe
                            src={`https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`}
                            title={title}
                            className="w-full h-[80vh]"
                        />
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
