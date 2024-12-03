import { createServersideClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = createServersideClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("credentials")
    .select("*")
    .eq("user_id", user.id);

  if (error) {
    console.error("Error fetching credentials:", error);
    return NextResponse.json(
      { error: "Failed to fetch credentials" },
      { status: 500 }
    );
  }

  return NextResponse.json({ credentials: data });
}

export async function POST(request: Request) {
  const supabase = createServersideClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { key, value } = await request.json();

    if (value === null) {
      // Handle deletion
      const { error } = await supabase
        .from("credentials")
        .delete()
        .match({ user_id: user.id, key });

      if (error) {
        console.error("Error deleting credential:", error);
        return NextResponse.json(
          { error: "Failed to delete credential" },
          { status: 500 }
        );
      }
    } else {
      // Handle upsert
      const { error } = await supabase.from("credentials").upsert(
        {
          user_id: user.id,
          key,
          value,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id,key",
          ignoreDuplicates: false,
        }
      );

      if (error) {
        console.error("Error saving credential:", error);
        return NextResponse.json(
          { error: "Failed to save credential" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
