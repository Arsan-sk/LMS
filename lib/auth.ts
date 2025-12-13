import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { db } from "@/lib/db"
import bcrypt from "bcryptjs"
import { PrismaAdapter } from "@next-auth/prisma-adapter"

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(db),
    session: {
        strategy: "jwt",
    },
    pages: {
        signIn: "/login",
    },
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                username: { label: "Username", type: "text" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.username || !credentials?.password) {
                    return null
                }

                const user = await db.user.findUnique({
                    where: { username: credentials.username }
                })

                if (!user) {
                    return null
                }

                const isPasswordValid = await bcrypt.compare(
                    credentials.password,
                    user.passwordHash
                )

                if (!isPasswordValid) {
                    return null
                }

                let domainId = user.domainId

                // If user is a LEAD, check DomainLead table for assignment
                if (user.role === "LEAD") {
                    const domainLead = await db.domainLead.findFirst({
                        where: { userId: user.id }
                    })
                    if (domainLead) {
                        domainId = domainLead.domainId
                    }
                }

                return {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    domainId: domainId,
                    profilePhoto: user.profilePhoto,
                }
            }
        })
    ],
    callbacks: {
        async session({ session, token }) {
            if (token) {
                session.user.id = token.id
                session.user.username = token.username
                session.user.role = token.role
                session.user.domainId = token.domainId
                session.user.profilePhoto = token.profilePhoto
            }
            return session
        },
        async jwt({ token, user, trigger, session }) {
            if (user) {
                token.id = user.id
                token.username = user.username
                token.role = user.role
                token.domainId = user.domainId
                token.profilePhoto = user.profilePhoto
            }

            if (trigger === "update" && session?.user) {
                token.profilePhoto = session.user.profilePhoto
            }

            return token
        }
    }
}
