import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { executeFlowApi } from "@/lib/execution";

// Create a Supabase client with service role
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
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
  const webhookData = await request.json();

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
    .single();

  if (deploymentError || !deployment) {
    return NextResponse.json(
      { error: "Deployment not found" },
      { status: 404 }
    );
  }

  let credentialsMap = {};

  // If API key is provided, try to get user credentials
  if (apiKey) {
    // Verify API key and get user
    const { data: keyData, error: keyError } = await supabase
      .from("api_keys")
      .select("*")
      .eq("key", apiKey)
      .single();

    if (keyError || !keyData) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
    }

    // Get user's credentials
    const { data: credentials } = await supabase
      .from("credentials")
      .select("*")
      .eq("user_id", keyData.user_id);

    if (credentials) {
      // Convert credentials array to map
      credentialsMap = credentials.reduce((acc, cred) => {
        acc[cred.key] = cred.value;
        return acc;
      }, {} as Record<string, string>);

      // Update last_used timestamp for API key
      await supabase
        .from("api_keys")
        .update({ last_used: new Date().toISOString() })
        .eq("key", apiKey);
    }
  }

  // Execute the flow with webhook context
  const result = await executeFlowApi(
    deployment.canvas.data.nodes,
    deployment.canvas.data.edges,
    credentialsMap,
    {
      source: "webhook",
      webhookData,
    }
  );

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ output: result.output });
}
