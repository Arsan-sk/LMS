import { Role } from "@prisma/client"
import { DefaultSession } from "next-auth"

declare module "next-auth" {
    interface Session {
        user: {
            id: string
            username: string
            role: Role
            domainId: string | null
        } & DefaultSession["user"]
    }

    interface User {
        id: string
        username: string
        role: Role
        domainId: string | null
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string
        username: string
        role: Role
        domainId: string | null
    }
}
