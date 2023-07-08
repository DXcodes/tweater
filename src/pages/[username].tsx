import { GetServerSideProps, GetStaticProps, type NextPage } from "next";
import Head from "next/head";
import { api } from "~/utils/api";

const ProfilePage: NextPage<{ trpcState: any; username: string }> = ({
  trpcState,
  username,
}) => {
  const { data, isLoading } = api.profile.getUserByUsername.useQuery({
    id: username,
  });

  if (isLoading) return <div>Loading...</div>;

  if (!data) return <div>Something went wrong...</div>;

  return (
    <>
      <Head>
        <title>{username}</title>
      </Head>
      <main className="flex h-screen justify-center">
        <div>{data.id}</div>
      </main>
    </>
  );
};

import { createServerSideHelpers } from "@trpc/react-query/server";
import { prisma } from "~/server/db";
import { appRouter } from "~/server/api/root";
import superjson from "superjson";
import { getAuth } from "@clerk/nextjs/server";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { req } = context;
  const sesh = getAuth(req);
  const userId = sesh.userId;

  const serverSideHelper = createServerSideHelpers({
    router: appRouter,
    ctx: { prisma, userId },
    transformer: superjson,
  });

  const slug = context.params?.username;

  if (typeof slug !== "string") throw new Error("no slug");

  const username = slug.replace("@", "");
  await serverSideHelper.profile.getUserByUsername.prefetch({ id: username });

  return {
    props: {
      trpcState: serverSideHelper.dehydrate(),
      username,
    },
  };
};

export default ProfilePage;
