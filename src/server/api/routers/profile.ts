import type { User } from "@clerk/nextjs/dist/api";
import { clerkClient } from "@clerk/nextjs/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import dayjs from "dayjs";
import { createTRPCRouter, privateProcedure, publicProcedure } from "~/server/api/trpc";




import { Ratelimit } from "@upstash/ratelimit"; // for deno: see above
import { Redis } from "@upstash/redis";

const filterUserForClient = (user: User) => {
    return { id: user.id, profileImageUrl: user.profileImageUrl };
  }

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


export const profileRouter = createTRPCRouter({

    getUserByUsername: privateProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ctx, input}) => {
            const user = await clerkClient.users.getUser(input.id);

            if (!user) {
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "User not found",
                });
            }
            return filterUserForClient(user);
    })
  
});
