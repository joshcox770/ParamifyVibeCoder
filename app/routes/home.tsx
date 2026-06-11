import type { Route } from "./+types/home";
import { Welcome } from "../welcome/welcome";
import { useUser } from "../hooks/use-user";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to an automatically deployed React Router!" },
  ];
}

export default function Home() {
  // Globally available, fully typed, no props threaded down. In prod this is
  // the Google identity from Traefik; locally it's the dev fallback.
  const user = useUser();

  return (
    <main className="pt-16 p-4 container mx-auto">
      <p className="text-sm text-gray-500">Signed in as {user.email}</p>
      <Welcome />
    </main>
  );
}
