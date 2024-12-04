import { createServersideClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = createServersideClient();

  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.error("Auth error:", userError);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!user) {
      return NextResponse.json({ error: "No user found" }, { status: 401 });
    }

    const body = await request.json();
    console.log("Request body:", body);

    const { canvasId, name, description } = body;

    if (!canvasId || !name) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify canvas ownership
    const { data: canvas, error: canvasError } = await supabase
      .from("canvases")
      .select("id")
      .eq("id", canvasId)
      .eq("user_id", user.id)
      .single();

    if (canvasError) {
      console.error("Canvas fetch error:", canvasError);
      return NextResponse.json(
        { error: "Failed to verify canvas ownership" },
        { status: 500 }
      );
    }

    if (!canvas) {
      return NextResponse.json(
        { error: "Canvas not found or unauthorized" },
        { status: 404 }
      );
    }

    // Create deployment
    const { data: deployment, error: deployError } = await supabase
      .from("deployments")
      .insert({
        user_id: user.id,
        canvas_id: canvasId,
        name,
        description: description || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (deployError) {
      console.error("Deployment creation error details:", {
        code: deployError.code,
        message: deployError.message,
        details: deployError.details,
        hint: deployError.hint,
      });
      return NextResponse.json(
        { error: `Failed to create deployment: ${deployError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ deployment });
  } catch (error: any) {
    console.error("Error creating deployment details:", {
      message: error.message,
      stack: error.stack,
      details: error,
    });
    return NextResponse.json(
      { error: `Failed to create deployment: ${error.message}` },
      { status: 500 }
    );
  }
}

export async function GET() {
  const supabase = createServersideClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { data: deployments, error } = await supabase
      .from("deployments")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ deployments });
  } catch (error) {
    console.error("Error fetching deployments:", error);
    return NextResponse.json(
      { error: "Failed to fetch deployments" },
      { status: 500 }
    );
  }
}
