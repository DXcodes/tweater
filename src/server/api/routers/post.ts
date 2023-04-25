import type { User } from "@clerk/nextjs/dist/api";
import { clerkClient } from "@clerk/nextjs/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import dayjs from "dayjs";
import { createTRPCRouter, privateProcedure, publicProcedure } from "~/server/api/trpc";

const filterUserForClient = (user: User) => {
  return { id: user.id, profileImageUrl: user.profileImageUrl };
}

import { Ratelimit } from "@upstash/ratelimit"; // for deno: see above
import { Redis } from "@upstash/redis";

// Create a new ratelimiter, that allows 3 requests per 1 minute
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(3, "1 m"),
  analytics: true,
  /**
   * Optional prefix for the keys used in redis. This is useful if you want to share a redis
   * instance with other applications and want to avoid key collisions. The default prefix is
   * "@upstash/ratelimit"
   */ 
  prefix: "@upstash/ratelimit",
});


export const postRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    const posts = await ctx.prisma.post.findMany({
      take: 100,
      orderBy: [
        {createdAt: 'desc'}
      ]
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

  create: privateProcedure
    .input(
        z.object({
          content: z.string().min(1).max(280),
        })
    ).mutation(async ({ ctx, input }) => {
    const authorId = ctx.userId;

    const limiter = await ratelimit.limit(authorId);
    const waitCount = Math.floor((limiter.reset - Date.now())/1000);
    if (!limiter.success) throw new TRPCError({ message: `Wait ${waitCount} seconds` , code: "TOO_MANY_REQUESTS"});

    const post = await ctx.prisma.post.create({
      data: {
        authorId,
        content: input.content,
      },
    });

    return post;
  }),
});
