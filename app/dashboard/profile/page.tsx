"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { User, Mail, Phone, Calendar, BookOpen, Save, Loader2, Lock, ShieldAlert } from "lucide-react"
import { useSession } from "next-auth/react"

interface UserProfile {
    id: string
    username: string
    email: string
    role: string
    phone: string | null
    year: string | null
    department: string | null
    bio: string | null
    profilePhoto: string | null
    domain: {
        name: string
    } | null
    createdAt: string
}

export default function ProfilePage() {
    const { data: session, update: updateSession } = useSession()
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [showPasswordField, setShowPasswordField] = useState(false)
    const [formData, setFormData] = useState({
        username: "",
        newPassword: "",
        currentPassword: "",
        phone: "",
        year: "",
        department: "",
        bio: "",
        profilePhoto: ""
    })

    useEffect(() => {
        fetchProfile()
    }, [])

    async function fetchProfile() {
        try {
            const res = await fetch("/api/user/profile")
            const data = await res.json()
            setProfile(data)
            setFormData({
                username: data.username || "",
                newPassword: "",
                currentPassword: "",
                phone: data.phone || "",
                year: data.year || "",
                department: data.department || "",
                bio: data.bio || "",
                profilePhoto: data.profilePhoto || ""
            })
        } catch (error) {
            console.error("Failed to fetch profile", error)
        } finally {
            setIsLoading(false)
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setIsSaving(true)

        try {
            const res = await fetch("/api/user/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.message || "Failed to update profile")
            }

            const updatedUser = await res.json()
            setProfile({ ...profile!, ...updatedUser })

            // Clear password fields and hide the password confirmation section
            setFormData(prev => ({
                ...prev,
                newPassword: "",
                currentPassword: ""
            }))
            setShowPasswordField(false)

            // Update session to reflect changes if necessary
            await updateSession()

            alert("Profile updated successfully!")
        } catch (error: any) {
            console.error("Update error:", error)
            alert(error.message)
        } finally {
            setIsSaving(false)
        }
    }

    if (isLoading) return <p>Loading profile...</p>
    if (!profile) return <p>Profile not found</p>

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">My Profile</h1>
                <p className="text-gray-500">Manage your account settings and preferences.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-[1fr_2fr]">
                <Card>
                    <CardContent className="pt-6 flex flex-col items-center text-center space-y-4">
                        <div className="h-32 w-32 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden ring-4 ring-white shadow-lg">
                            {formData.profilePhoto ? (
                                <img src={formData.profilePhoto} alt={profile.username} className="h-full w-full object-cover" />
                            ) : (
                                <User className="h-16 w-16 text-gray-400" />
                            )}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">{profile.username}</h2>
                            <p className="text-sm text-gray-500">{profile.email}</p>
                        </div>
                        <div className="w-full pt-4 border-t space-y-2 text-sm text-left">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Role</span>
                                <span className="font-medium">{profile.role}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Domain</span>
                                <span className="font-medium">{profile.domain?.name || "N/A"}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Joined</span>
                                <span className="font-medium">{new Date(profile.createdAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Edit Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-4 border-b pb-4">
                                <h3 className="text-sm font-medium text-gray-500">Account Settings</h3>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Username</label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                            <Input
                                                className="pl-9"
                                                value={formData.username}
                                                onChange={(e) => {
                                                    setFormData({ ...formData, username: e.target.value })
                                                    setShowPasswordField(true)
                                                }}
                                                placeholder="Username"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">New Password</label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                            <Input
                                                type="password"
                                                className="pl-9"
                                                value={formData.newPassword}
                                                onChange={(e) => {
                                                    setFormData({ ...formData, newPassword: e.target.value })
                                                    setShowPasswordField(true)
                                                }}
                                                placeholder="Leave blank to keep current"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {showPasswordField && (
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 animate-in fade-in slide-in-from-top-2">
                                        <div className="flex items-start space-x-3">
                                            <ShieldAlert className="h-5 w-5 text-yellow-600 mt-0.5" />
                                            <div className="space-y-2 w-full">
                                                <label className="text-sm font-medium text-yellow-900">
                                                    Current Password Required
                                                </label>
                                                <p className="text-xs text-yellow-700">
                                                    To save changes to your username or password, please enter your current password.
                                                </p>
                                                <Input
                                                    type="password"
                                                    value={formData.currentPassword}
                                                    onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                                                    placeholder="Enter current password"
                                                    className="bg-white"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Phone Number</label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                        <Input
                                            className="pl-9"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            placeholder="+1234567890"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Year / Batch</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                        <Input
                                            className="pl-9"
                                            value={formData.year}
                                            onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                                            placeholder="e.g. 2025"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Department</label>
                                <div className="relative">
                                    <BookOpen className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                    <Input
                                        className="pl-9"
                                        value={formData.department}
                                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                        placeholder="e.g. Computer Science"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Bio</label>
                                <textarea
                                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={formData.bio}
                                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                    placeholder="Tell us a bit about yourself..."
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Profile Photo URL</label>
                                <Input
                                    value={formData.profilePhoto}
                                    onChange={(e) => setFormData({ ...formData, profilePhoto: e.target.value })}
                                    placeholder="https://example.com/photo.jpg"
                                />
                                <p className="text-xs text-gray-500">Enter a direct URL to an image.</p>
                            </div>

                            <div className="pt-4 flex justify-end">
                                <Button type="submit" disabled={isSaving}>
                                    {isSaving ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="mr-2 h-4 w-4" />
                                            Save Changes
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
