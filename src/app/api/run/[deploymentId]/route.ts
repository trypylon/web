import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { headers } from "next/headers";

// Create a Supabase client with service role
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Make sure to add this to your .env
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export async function POST(
  request: Request,
  { params }: { params: { deploymentId: string } }
) {
  const headersList = headers();
  const apiKey = headersList.get("x-api-key");

  console.log("Received API key:", apiKey);

  if (!apiKey) {
    return NextResponse.json({ error: "API key required" }, { status: 401 });
  }

  // Verify API key and get user using service role client
  const { data: keyData, error: keyError } = await supabase
    .from("api_keys")
    .select("*")
    .eq("key", apiKey)
    .single();

  console.log("API key lookup result:", { keyData, keyError });

  if (keyError) {
    console.error("API key verification error:", keyError);
    return NextResponse.json(
      {
        error: "Invalid API key",
        details: keyError.message,
      },
      { status: 401 }
    );
  }

  if (!keyData) {
    return NextResponse.json(
      {
        error: "API key not found",
      },
      { status: 401 }
    );
  }

  // Get deployment and canvas
  const { data: deployment, error: deploymentError } = await supabase
    .from("deployments")
    .select(
      `
      *,
      canvas:canvases (*)
    `
    )
    .eq("id", params.deploymentId)
    .eq("user_id", keyData.user_id)
    .single();

  if (deploymentError || !deployment) {
    return NextResponse.json(
      { error: "Deployment not found" },
      { status: 404 }
    );
  }

  // Update last_used timestamp for API key
  await supabase
    .from("api_keys")
    .update({ last_used: new Date().toISOString() })
    .eq("key", apiKey);

  // Execute the canvas flow using the existing execute logic
  const executeResponse = await fetch(`${request.url}/../../execute`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-deployment-execution": "true",
    },
    body: JSON.stringify({
      ...deployment.canvas.data,
      userId: keyData.user_id,
    }),
  });

  return executeResponse;
}
