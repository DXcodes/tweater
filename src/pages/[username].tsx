import { type NextPage } from "next";
import Head from "next/head";
import { api } from "~/utils/api";

const ProfilePage: NextPage = () => {
  const { data, isLoading } = api.profile.getUserByUsername.useQuery({
    id: "user_2OJ1zMRQmoMt8g2CPODk1inQ3Ka",
  });

  if (isLoading) return <div>Loading...</div>;

  if (!data) return <div>Something went wrong...</div>;

  return (
    <>
      <Head>
        <title>Profile</title>
      </Head>
      <main className="flex h-screen justify-center">
        <div>{data.id}</div>
      </main>
    </>
  );
};

export default ProfilePage;
