import { makeExecutableSchema } from '@graphql-tools/schema';
import { GraphQLContext } from './context';
import typeDefs from './schema.graphql';
import { Link, User } from '@prisma/client';
// auth
import { APP_SECRET } from './auth';
import { compare, hash } from 'bcryptjs';
import { sign } from 'jsonwebtoken';

const resolvers = {
  Query: {
    info: () => `This is the API of a Hackernews Clone`,
    feed: async (parent: unknown, args: {}, context: GraphQLContext) => {
      return context.prisma.link.findMany();
    },
    me: (parent: unknown, args: {}, context: GraphQLContext) => {
      if (context.currentUser === null) {
        throw new Error('Unauthenticated!');
      }

      return context.currentUser;
    },
  },
  User: {
    links: (parent: User, args: {}, context: GraphQLContext) =>
      context.prisma.user.findUnique({ where: { id: parent.id } }).links(),
  },
  Link: {
    id: (parent: Link) => parent.id,
    description: (parent: Link) => parent.description,
    url: (parent: Link) => parent.url,
    postedBy: async (parent: Link, args: {}, context: GraphQLContext) => {
      if (!parent.postedById) {
        return null;
      }

      return context.prisma.link.findUnique({ where: { id: parent.id } }).postedBy();
    },
  },

  Mutation: {
    post: async (
      parent: unknown,
      args: { url: string; description: string },
      context: GraphQLContext
    ) => {
      if (context.currentUser === null) {
        throw new Error('Unauthenticated!');
      }

      const newLink = await context.prisma.link.create({
        data: {
          url: args.url,
          description: args.description,
          postedBy: { connect: { id: context.currentUser.id } },
        },
      });

      return newLink;
    },
    signup: async (
      parent: unknown,
      args: { email: string; password: string; name: string },
      context: GraphQLContext
    ) => {
      const password = await hash(args.password, 10);

      const user = await context.prisma.user.create({
        data: { ...args, password },
      });

      const token = sign({ userId: user.id }, APP_SECRET);

      return {
        token,
        user,
      };
    },
    login: async (
      parent: unknown,
      args: { email: string; password: string },
      context: GraphQLContext
    ) => {
      // 1
      const user = await context.prisma.user.findUnique({
        where: { email: args.email },
      });
      if (!user) {
        throw new Error('No such user found');
      }

      // 2
      const valid = await compare(args.password, user.password);
      if (!valid) {
        throw new Error('Invalid password');
      }

      const token = sign({ userId: user.id }, APP_SECRET);

      // 3
      return {
        token,
        user,
      };
    },
  },
};

export const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

//eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTY3NDg2NjA0OX0.C8fZ8DRU7UYZNn1kJDYXCddS9vcE0eyU_1GUcZqSdwQ
