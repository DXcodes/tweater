import { SignInButton, SignOutButton, useUser } from "@clerk/nextjs";
import { type NextPage } from "next";
import Link from "next/link";
import { Spinner, LoadingPage } from "~/components/loading";
import { api, RouterOutputs } from "~/utils/api";

import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import Image from "next/image";
import { useState } from "react";
import { toast } from "react-hot-toast";

dayjs.extend(relativeTime);

const CreatePostWizard = () => {
  const { user } = useUser();

  const [input, setInput] = useState("");

  const ctx = api.useContext();

  const { mutate, isLoading: isPosting } = api.post.create.useMutation({
    onSuccess: async () => {
      await ctx.post.getAll.invalidate();
      setInput("");
    },
    onError: (e) => {
      if (e.message) {
        toast.error(e.message);
      } else {
        toast.error("Failed to post! Please try again later.");
      }
    },
  });

  if (!user) return null;

  return (
    <div className="flex w-full flex-col">
      <div className="">
        <SignOutButton />
      </div>
      <div className="flex w-full gap-3">
        <Image
          className="h-14 w-14 rounded-full"
          src={user.profileImageUrl}
          alt="Profile image"
          width={56}
          height={56}
        />
        <div
          className={`flex w-full space-x-2 ${
            isPosting ? "brightness-50" : ""
          }`}
        >
          <input
            className={`grow rounded bg-transparent px-2 outline outline-1 outline-slate-400`}
            placeholder="Say something..."
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (input !== "") {
                  mutate({ content: input });
                }
              }
            }}
            disabled={isPosting}
          />
          {!isPosting && input != "" && (
            <button onClick={() => mutate({ content: input })}>Post</button>
          )}
          {isPosting && (
            <div className="flex items-center justify-center">
              <Spinner size={20} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

type PostWithUser = RouterOutputs["post"]["getAll"][number];

const PostView = (props: PostWithUser) => {
  const { post, author } = props;
  return (
    <div
      key={post.id}
      className="mx-6 flex items-center gap-2 border-b border-slate-400 px-2 py-8"
    >
      <Image
        className="h-12 w-12 rounded-full"
        src={author.profileImageUrl}
        alt="Author Image"
        width="56"
        height="56"
      />
      <div className="flex flex-col">
        <div className="flex text-slate-500">
          <Link href={`/${author.id}`}>
            <span className="font-semibold">{`@${author.id}`}</span>
          </Link>
          <span className="px-2">·</span>
          <Link href={`/post/${post.id}`}>
            <span className="font-light">{`${dayjs(
              post.createdAt
            ).fromNow()}`}</span>
          </Link>
        </div>
        <span>{post.content}</span>
      </div>
    </div>
  );
};

const Feed = () => {
  const { data, isLoading: postsLoading } = api.post.getAll.useQuery();

  if (postsLoading)
    return (
      <div className="relative h-full w-full">
        <LoadingPage />
      </div>
    );

  if (!data) return <div>Something went wrong</div>;

  return (
    <div className="flex flex-col">
      {data?.map((post) => (
        <PostView {...post} key={post.post.id} />
      ))}
    </div>
  );
};

const Home: NextPage = () => {
  const { user, isLoaded: userLoaded, isSignedIn } = useUser();

  //start fetching as soon as possible
  api.post.getAll.useQuery();

  if (!userLoaded) return <LoadingPage />; // TODO: add isSignedIn and return a signin page

  return (
    <>
      <main className="flex h-screen justify-center">
        <div className="h-full w-full border-x border-slate-400 md:max-w-2xl">
          <div className="flex border-b border-slate-400 p-4">
            {!isSignedIn && (
              <div className="flex justify-center">
                <SignInButton />
              </div>
            )}
            {!!isSignedIn && <CreatePostWizard />}
          </div>
          <Feed />
        </div>
      </main>
    </>
  );
};

export default Home;
