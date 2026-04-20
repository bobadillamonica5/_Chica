import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const serviceClient = createServiceClient();
  const { data, error } = await serviceClient
    .from("evaluations")
    .select("error_type")
    .eq("student_id", user.id)
    .neq("error_type", "none")
    .order("timestamp", { ascending: false });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  // Count occurrences of each error type
  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    counts[row.error_type] = (counts[row.error_type] ?? 0) + 1;
  }

  const topErrors = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([error_type, count]) => ({ error_type, count }));

  return Response.json({ topErrors, totalMistakes: data?.length ?? 0 });
}
