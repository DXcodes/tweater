import type { User } from "@clerk/nextjs/dist/api";
import { clerkClient } from "@clerk/nextjs/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

const filterUserForClient = (user: User) => {
  return { id: user.id, profileImageUrl: user.profileImageUrl };
}

export const postRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    const posts = await ctx.prisma.post.findMany({
      take: 100,
    });

    const users = (
      await clerkClient.users.getUserList({
        userId: posts.map((post) => post.authorId),
        limit: 100,
      })
    ).map((user: User) => filterUserForClient(user));

    return posts.map((post) => {
      const author = users.find((user) => user.id === post.authorId);

      if (!author || !author.id) throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Author or post not found"
      });
      
      return {
        post,
        author,
      };
    });
  }),
});
