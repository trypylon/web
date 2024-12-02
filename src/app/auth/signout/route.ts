import { createServersideClient } from "@/lib/supabase/server";
import { getBaseUrl } from "@/lib/utils";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = createServersideClient();

  // Sign out the user
  await supabase.auth.signOut();

  // Redirect to home page
  return NextResponse.redirect(new URL("/", getBaseUrl()));
}
