import { ProblemList } from "@/components/problem/ProblemList";
import { headers } from "next/headers";

async function getProblems() {
  const host = (await headers()).get("host") || "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  const res = await fetch(`${protocol}://${host}/api/problems`, {
    cache: "no-store",
  });
  if (!res.ok) {
    return [];
  }
  return res.json();
}

export default async function Home() {
  const problems = await getProblems();

  return (
    <div className="container mx-auto px-6 pt-12 pb-24">
      <div className="mb-12">
        <h1 className="text-4xl font-extrabold text-zinc-900 dark:text-white tracking-tight sm:text-5xl mb-4">
          Challenges
        </h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl">
          Solve algorithmic problems specifically curated for your learning journey.
        </p>
      </div>
      
      <ProblemList problems={problems} />
    </div>
  );
}
