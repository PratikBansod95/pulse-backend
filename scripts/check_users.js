// scripts/check_users.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  console.log('Total users:', users.length);
  for (const u of users) {
    console.log(`- ID: ${u.id}, Name: ${u.name}, Email: ${u.email}, Profession: ${u.profession_primary}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
