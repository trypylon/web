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
    .from("canvases")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Error fetching canvases:", error);
    return NextResponse.json(
      { error: "Failed to fetch canvases" },
      { status: 500 }
    );
  }

  return NextResponse.json({ canvases: data });
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
    const { id, name, description, data } = await request.json();

    // If id is provided, update existing canvas
    if (id) {
      const { error } = await supabase
        .from("canvases")
        .update({
          name,
          description,
          data,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;

      return NextResponse.json({ success: true, id });
    }

    // Check if user has reached limit for new canvases
    const { count, error: countError } = await supabase
      .from("canvases")
      .select("*", { count: "exact" })
      .eq("user_id", user.id);

    if (countError) {
      throw new Error("Failed to check canvas count");
    }

    if (count && count >= 5) {
      return NextResponse.json(
        { error: "Free users can only save up to 5 canvases" },
        { status: 403 }
      );
    }

    // Insert new canvas
    const { data: newCanvas, error } = await supabase
      .from("canvases")
      .insert({
        user_id: user.id,
        name,
        description,
        data,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, id: newCanvas.id });
  } catch (error) {
    console.error("Error saving canvas:", error);
    return NextResponse.json(
      { error: "Failed to save canvas" },
      { status: 500 }
    );
  }
}
