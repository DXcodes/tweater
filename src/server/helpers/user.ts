import type { User } from "@clerk/nextjs/dist/api";

export const filterUserForClient = (user: User) => {
    return { id: user.id, profileImageUrl: user.profileImageUrl };
}