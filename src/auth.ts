import { PrismaClient, User } from '@prisma/client';
import { FastifyRequest } from 'fastify';
import { JwtPayload, verify } from 'jsonwebtoken';

export const APP_SECRET = process.env.APP_SECRET!;

export async function authenticateUser(
  prisma: PrismaClient,
  request: FastifyRequest
): Promise<User | null> {
  if (request?.headers?.authorization) {
    // 1
    const token = request.headers.authorization.split(' ')[1];
    // 2
    const tokenPayload = verify(token, APP_SECRET) as JwtPayload;
    // 3
    const userId = tokenPayload.userId;
    // 4
    return await prisma.user.findUnique({ where: { id: userId } });
  }

  return null;
}
