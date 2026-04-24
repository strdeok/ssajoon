import { isAdmin } from "@/lib/auth/isAdmin";
import { redirect } from "next/navigation";
import { ProblemForm } from "@/components/admin/ProblemForm";

export default async function NewProblemPage() {
  const admin = await isAdmin();
  if (!admin) redirect("/");

  return (
    <div className="pb-12">
      <ProblemForm />
    </div>
  );
}
