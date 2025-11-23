const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
    // Create Admin
    const adminPassword = await bcrypt.hash('password123', 10)
    const admin = await prisma.user.upsert({
        where: { username: 'admin' },
        update: {},
        create: {
            username: 'admin',
            email: 'admin@eliteclub.com',
            passwordHash: adminPassword,
            role: 'ADMIN',
            bio: 'System Administrator',
        },
    })
    console.log({ admin })

    // Create Domains
    const domains = ['AIML', 'Cyber Security', 'Web Dev']
    for (const name of domains) {
        const domain = await prisma.domain.upsert({
            where: { name },
            update: {},
            create: {
                name,
                description: `${name} Domain`,
            },
        })
        console.log({ domain })
    }
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
