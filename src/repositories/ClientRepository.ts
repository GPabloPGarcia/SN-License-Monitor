import { prisma } from "@/lib/prisma/client";

export class ClientRepository {
  static list() {
    return prisma.client.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { instances: true }
        }
      }
    });
  }

  static listActive() {
    return prisma.client.findMany({
      where: { active: true },
      orderBy: { name: "asc" }
    });
  }

  static findById(id: string) {
    return prisma.client.findUnique({
      where: { id },
      include: {
        instances: {
          orderBy: { name: "asc" }
        }
      }
    });
  }
}
