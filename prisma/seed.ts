import bcrypt from "bcrypt";
import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

const prodespInstances = [
  "pdspmain",
  "pdspdetran",
  "pdspcomercial",
  "pdspjcsp"
];

function getRequiredSeedValue(key: string) {
  const value = process.env[key]?.trim();

  if (value) {
    return value;
  }

  throw new Error(`${key} e obrigatorio para executar seed.`);
}

async function main() {
  const adminName = getRequiredSeedValue("SEED_ADMIN_NAME");
  const adminEmail = getRequiredSeedValue("SEED_ADMIN_EMAIL");
  const adminPassword = getRequiredSeedValue("SEED_ADMIN_PASSWORD");
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: adminName,
      passwordHash,
      role: UserRole.ADMIN,
      active: true
    },
    create: {
      name: adminName,
      email: adminEmail,
      passwordHash,
      role: UserRole.ADMIN,
      active: true
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
