import { Submission } from "@/types/submission";
import { headers } from "next/headers";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

async function getSubmissions() {
  const host = (await headers()).get("host") || "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  const res = await fetch(`${protocol}://${host}/api/submissions`, {
    cache: "no-store", 
  });
  if (!res.ok) return [];
  return res.json() as Promise<Submission[]>;
}

export default async function SubmissionsPage() {
  const submissions = await getSubmissions();

  return (
    <div className="container mx-auto px-6 pt-12 pb-24">
      <div className="mb-12">
        <h1 className="text-4xl font-extrabold text-zinc-900 dark:text-white tracking-tight sm:text-5xl mb-4">
          Submissions
        </h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400">
          History of all mock code execution results.
        </p>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-zinc-50 dark:bg-black/40 border-b border-zinc-200 dark:border-white/5">
              <th className="px-6 py-4 text-sm font-semibold text-zinc-500 dark:text-zinc-400">ID</th>
              <th className="px-6 py-4 text-sm font-semibold text-zinc-500 dark:text-zinc-400">Problem</th>
              <th className="px-6 py-4 text-sm font-semibold text-zinc-500 dark:text-zinc-400">Language</th>
              <th className="px-6 py-4 text-sm font-semibold text-zinc-500 dark:text-zinc-400">Status</th>
              <th className="px-6 py-4 text-sm font-semibold text-zinc-500 dark:text-zinc-400">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-white/5">
            {submissions.map((sub) => (
              <tr key={sub.id} className="hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors">
                <td className="px-6 py-4 font-mono text-sm text-zinc-500 text-zinc-500 font-medium">
                  {sub.id}
                </td>
                <td className="px-6 py-4 font-medium text-zinc-900 dark:text-white">
                  {sub.problemId}
                </td>
                <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400 uppercase tracking-wider font-medium">
                  {sub.language || "unknown"}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    {sub.status === "AC" && (
                      <span className="flex items-center text-green-400 bg-green-500/10 px-3 py-1 rounded-full text-sm font-medium">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Accepted
                      </span>
                    )}
                    {sub.status === "WA" && (
                      <span className="flex items-center text-red-400 bg-red-500/10 px-3 py-1 rounded-full text-sm font-medium">
                        <XCircle className="w-4 h-4 mr-2" />
                        Wrong Answer
                      </span>
                    )}
                    {sub.status === "PENDING" && (
                      <span className="flex items-center text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full text-sm font-medium">
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Judging
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">
                  {new Date(sub.createdAt).toLocaleString()}
                </td>
              </tr>
            ))}
            
            {submissions.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                  No submissions yet. Go solve a problem!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
