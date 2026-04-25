import { Suspense } from "react";
import { Show, SignInButton, UserButton } from "@clerk/tanstack-react-start";
import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import type { Doc } from "@cataster/backend/convex/_generated/dataModel";
import { api } from "@cataster/backend/convex/_generated/api";
import { Button } from "@cataster/ui/components/base/button";
import { FieldGroup } from "@cataster/ui/components/base/field";
import { toast } from "@cataster/ui/components/base/sonner";
import { useAppForm } from "@cataster/ui/components/form/hooks";
import { cn } from "@cataster/ui/lib/utils";

const postsQuery = convexQuery(api.posts.getPosts, {});

export const Route = createFileRoute("/")({
  component: RouteComponent,
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(postsQuery);
  },
});

function RouteComponent() {
  return (
    <main className="container h-screen py-16">
      <div className="flex flex-col items-center justify-center gap-4">
        <h1 className="text-5xl font-extrabold tracking-tight sm:text-[5rem]">
          Create <span className="text-primary">T3</span> Turbo
        </h1>

        <AuthShowcase />

        <Show when={"signed-in"}>
          <CreatePostForm />
        </Show>

        <div className="w-full max-w-2xl overflow-y-scroll">
          <Suspense
            fallback={
              <div className="flex w-full flex-col gap-4">
                <PostCardSkeleton />
                <PostCardSkeleton />
                <PostCardSkeleton />
              </div>
            }
          >
            <PostList />
          </Suspense>
        </div>
      </div>
    </main>
  );
}

function AuthShowcase() {
  return (
    <>
      <Show when={"signed-out"}>
        <SignInButton mode="modal">
          <Button size="lg">Sign in</Button>
        </SignInButton>
      </Show>
      <Show when={"signed-in"}>
        <UserButton />
      </Show>
    </>
  );
}

function CreatePostForm() {
  const createPost = useMutation({
    mutationFn: useConvexMutation(api.posts.createPost),
    onSuccess: () => form.reset(),
    onError: (err) => {
      toast.error(err.message || "Failed to create post");
    },
  });

  const form = useAppForm({
    defaultValues: {
      content: "",
      title: "",
    },
    validators: {
      onSubmit: z.object({
        title: z.string().min(1),
        content: z.string().min(1),
      }),
    },
    onSubmit: async (data) => await createPost.mutateAsync(data.value),
  });

  return (
    <form
      className="w-full max-w-2xl"
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      <FieldGroup>
        <form.AppField
          name="title"
          children={(field) => <field.Input label="Bug Title" />}
        />
        <form.AppField
          name="content"
          children={(field) => <field.Textarea label="Content" />}
        />
        <form.AppForm>
          <form.SubmitButton>Absenden</form.SubmitButton>
        </form.AppForm>
      </FieldGroup>
    </form>
  );
}

function PostList() {
  const { data: posts } = useSuspenseQuery(postsQuery);

  if (posts.length === 0) {
    return (
      <div className="relative flex w-full flex-col gap-4">
        <PostCardSkeleton pulse={false} />
        <PostCardSkeleton pulse={false} />
        <PostCardSkeleton pulse={false} />

        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/10">
          <p className="text-2xl font-bold text-white">No posts yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-4">
      {posts.map((p) => (
        <PostCard key={p._id} post={p} />
      ))}
    </div>
  );
}

function PostCard(props: { post: Doc<"posts"> }) {
  const deletePost = useMutation({
    mutationFn: useConvexMutation(api.posts.deletePost),
    onError: (err) => {
      toast.error(err.message || "Failed to delete post");
    },
  });

  return (
    <div className="bg-muted flex flex-row rounded-lg p-4">
      <div className="grow">
        <h2 className="text-primary text-2xl font-bold">{props.post.title}</h2>
        <p className="mt-2 text-sm">{props.post.content}</p>
      </div>
      <Show when={"signed-in"}>
        <Button
          variant="ghost"
          isLoading={deletePost.isPending}
          className="text-primary cursor-pointer text-sm font-bold uppercase hover:bg-transparent hover:text-white"
          onClick={() => deletePost.mutate({ postId: props.post._id })}
          disabled={deletePost.isPending}
        >
          Delete
        </Button>
      </Show>
    </div>
  );
}

function PostCardSkeleton(props: { pulse?: boolean }) {
  const { pulse = true } = props;
  return (
    <div className="bg-muted flex flex-row rounded-lg p-4">
      <div className="grow">
        <h2
          className={cn(
            "bg-primary w-1/4 rounded-sm text-2xl font-bold",
            pulse && "animate-pulse",
          )}
        >
          &nbsp;
        </h2>
        <p
          className={cn(
            "mt-2 w-1/3 rounded-sm bg-current text-sm",
            pulse && "animate-pulse",
          )}
        >
          &nbsp;
        </p>
      </div>
    </div>
  );
}
