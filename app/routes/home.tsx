import { Form } from "react-router";

import type { Route } from "./+types/home";
import { getUser } from "../auth.server";
import { db } from "../db.server";
import { useUser } from "../hooks/use-user";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to an automatically deployed React Router!" },
  ];
}

/**
 * Loader — runs on the server for GET. Reads the signed-in user, then loads
 * only *their* notes from the database. This is the read pattern to copy.
 */
export async function loader({ request }: Route.LoaderArgs) {
  const user = getUser(request);
  const notes = await db.note.findMany({
    where: { userEmail: user.email },
    orderBy: { createdAt: "desc" },
  });
  return { notes };
}

/**
 * Action — runs on the server for POST. Handles form submissions (create /
 * delete). This is the write pattern to copy. Note how every query is scoped
 * to `user.email` so users can only touch their own data.
 */
export async function action({ request }: Route.ActionArgs) {
  const user = getUser(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "create") {
    const body = String(formData.get("body") ?? "").trim();
    if (body) {
      await db.note.create({ data: { body, userEmail: user.email } });
    }
  }

  if (intent === "delete") {
    const id = String(formData.get("id") ?? "");
    // deleteMany with the userEmail filter ensures one user can't delete
    // another user's note even if they forge the id.
    await db.note.deleteMany({ where: { id, userEmail: user.email } });
  }

  return { ok: true };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const user = useUser();
  const { notes } = loaderData;

  return (
    <main className="mx-auto max-w-xl p-6">
      <h1 className="text-2xl font-semibold">My Notes</h1>
      <p className="mt-1 text-sm text-gray-500">Signed in as {user.email}</p>

      {/* Create */}
      <Form method="post" className="mt-6 flex gap-2">
        <input type="hidden" name="intent" value="create" />
        <input
          type="text"
          name="body"
          placeholder="Write a note…"
          required
          className="flex-1 rounded border border-gray-300 px-3 py-2 dark:bg-gray-800 dark:border-gray-700"
        />
        <button
          type="submit"
          className="rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
        >
          Add
        </button>
      </Form>

      {/* List */}
      <ul className="mt-6 space-y-2">
        {notes.length === 0 && (
          <li className="text-sm text-gray-500">No notes yet — add one above.</li>
        )}
        {notes.map((note) => (
          <li
            key={note.id}
            className="flex items-center justify-between rounded border border-gray-200 px-3 py-2 dark:border-gray-700"
          >
            <span>{note.body}</span>
            <Form method="post">
              <input type="hidden" name="intent" value="delete" />
              <input type="hidden" name="id" value={note.id} />
              <button
                type="submit"
                className="text-sm text-red-600 hover:underline"
                aria-label="Delete note"
              >
                Delete
              </button>
            </Form>
          </li>
        ))}
      </ul>
    </main>
  );
}
