import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createRouteHandlerClient({ cookies });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    // Delete the deployment
    const { error } = await supabase
      .from("deployments")
      .delete()
      .eq("id", params.id)
      .eq("user_id", user.id);

    if (error) throw error;

    return NextResponse.redirect(new URL("/deployments", request.url));
  } catch (error) {
    console.error("Error deleting deployment:", error);
    return new NextResponse("Error deleting deployment", { status: 500 });
  }
}
