"use client"

import { useState, useRef, useEffect } from "react"
import { MessageCircle, X, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface Message {
    id: string
    text: string
    sender: "user" | "bot"
    timestamp: Date
}

export function ChatbotWidget() {
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "1",
            text: "Hi! I'm the Elite Club AI assistant. How can I help you today?",
            sender: "bot",
            timestamp: new Date()
        }
    ])
    const [inputText, setInputText] = useState("")
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const handleSend = async () => {
        if (!inputText.trim()) return

        const userMessage: Message = {
            id: Date.now().toString(),
            text: inputText,
            sender: "user",
            timestamp: new Date()
        }

        setMessages(prev => [...prev, userMessage])
        setInputText("")

        // Simulate bot response
        setTimeout(() => {
            const botResponse: Message = {
                id: (Date.now() + 1).toString(),
                text: getBotResponse(userMessage.text),
                sender: "bot",
                timestamp: new Date()
            }
            setMessages(prev => [...prev, botResponse])
        }, 1000)
    }

    const getBotResponse = (text: string): string => {
        const lower = text.toLowerCase()
        if (lower.includes("hello") || lower.includes("hi")) return "Hello there! Ask me about assignments or quizzes."
        if (lower.includes("assignment")) return "You can view your assignments in the Assignments tab. Make sure to submit before the deadline!"
        if (lower.includes("quiz")) return "Quizzes are a great way to test your knowledge. Check the Quizzes tab for active ones."
        if (lower.includes("point") || lower.includes("score")) return "You earn points by completing assignments and quizzes. Check the Leaderboard to see where you stand!"
        return "I'm still learning! I can help you navigate the dashboard or answer basic questions about the LMS."
    }

    return (
        <div className="fixed bottom-6 right-6 z-50">
            {!isOpen && (
                <Button
                    onClick={() => setIsOpen(true)}
                    className="h-14 w-14 rounded-full shadow-lg bg-primary-600 hover:bg-primary-700 text-white"
                >
                    <MessageCircle className="h-8 w-8" />
                </Button>
            )}

            {isOpen && (
                <Card className="w-80 h-96 shadow-xl flex flex-col">
                    <CardHeader className="bg-primary-600 text-white p-4 rounded-t-lg flex flex-row justify-between items-center space-y-0">
                        <CardTitle className="text-sm font-medium flex items-center">
                            <MessageCircle className="mr-2 h-4 w-4" />
                            AI Assistant
                        </CardTitle>
                        <button onClick={() => setIsOpen(false)} className="text-white hover:text-gray-200">
                            <X className="h-4 w-4" />
                        </button>
                    </CardHeader>
                    <CardContent className="flex-1 p-4 overflow-y-auto flex flex-col space-y-4 bg-gray-50">
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                            >
                                <div
                                    className={`max-w-[80%] rounded-lg p-3 text-sm ${msg.sender === "user"
                                        ? "bg-primary-600 text-white rounded-br-none"
                                        : "bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm"
                                        }`}
                                >
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </CardContent>
                    <div className="p-3 border-t bg-white rounded-b-lg">
                        <form
                            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                            className="flex space-x-2"
                        >
                            <Input
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                placeholder="Type a message..."
                                className="flex-1"
                            />
                            <Button type="submit" size="sm" disabled={!inputText.trim()} className="w-9 px-0">
                                <Send className="h-4 w-4" />
                            </Button>
                        </form>
                    </div>
                </Card>
            )}
        </div>
    )
}
