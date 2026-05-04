import bcrypt from "bcrypt";
import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

const prodespInstances = [
  "pdspmain",
  "pdspdetran",
  "pdspcomercial",
  "pdspjcsp"
];

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@example.com";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "Admin@123456";
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: process.env.SEED_ADMIN_NAME ?? "Administrator",
      passwordHash,
      role: UserRole.ADMIN
    },
    create: {
      name: process.env.SEED_ADMIN_NAME ?? "Administrator",
      email: adminEmail,
      passwordHash,
      role: UserRole.ADMIN
    }
  });

  const prodesp = await prisma.client.upsert({
    where: { id: "prodesp" },
    update: {
      name: "PRODESP",
      description: "Cliente inicial para monitoramento de licencas ServiceNow.",
      active: true
    },
    create: {
      id: "prodesp",
      name: "PRODESP",
      description: "Cliente inicial para monitoramento de licencas ServiceNow.",
      active: true
    }
  });

  for (const name of prodespInstances) {
    await prisma.serviceNowInstance.upsert({
      where: {
        clientId_name: {
          clientId: prodesp.id,
          name
        }
      },
      update: {
        active: true
      },
      create: {
        clientId: prodesp.id,
        name,
        baseUrl: `https://${name}.service-now.com`,
        environment: "production",
        active: true
      }
    });
  }

  console.log(`Seed concluido. Admin: ${adminEmail}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
