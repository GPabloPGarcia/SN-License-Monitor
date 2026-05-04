import { prisma } from "@/lib/prisma/client";

export class InstanceRepository {
  static list() {
    return prisma.serviceNowInstance.findMany({
      orderBy: [{ client: { name: "asc" } }, { name: "asc" }],
      include: { client: true }
    });
  }

  static listActiveForCollection() {
    return prisma.serviceNowInstance.findMany({
      where: {
        active: true,
        client: {
          active: true
        }
      },
      include: { client: true },
      orderBy: [{ client: { name: "asc" } }, { name: "asc" }]
    });
  }

  static listActiveByClient(clientId: string) {
    return prisma.serviceNowInstance.findMany({
      where: {
        clientId,
        active: true,
        client: { active: true }
      },
      include: { client: true },
      orderBy: { name: "asc" }
    });
  }

  static findById(id: string) {
    return prisma.serviceNowInstance.findUnique({
      where: { id },
      include: { client: true }
    });
  }
}
