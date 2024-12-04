"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthWrapper } from "@/components/ui/auth-wrapper";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { Loader2, Copy, Key } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Deployment {
  id: string;
  name: string;
  description: string | null;
  canvas_id: string;
  created_at: string;
  updated_at: string;
}

export default function DeploymentsPage() {
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    fetch("/api/deployments")
      .then((res) => res.json())
      .then((data) => {
        setDeployments(data.deployments);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching deployments:", error);
        setLoading(false);
      });
  }, []);

  const copyEndpoint = (deploymentId: string) => {
    const endpoint = `${window.location.origin}/api/run/${deploymentId}`;
    navigator.clipboard.writeText(endpoint);
    toast({
      title: "Endpoint Copied",
      description: "API endpoint copied to clipboard",
    });
  };

  return (
    <AuthWrapper>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">My Deployments</h1>
          <Button
            onClick={() => router.push("/credentials")}
            className="space-x-2"
          >
            <Key className="w-4 h-4" />
            <span>Manage API Keys</span>
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : deployments.length === 0 ? (
          <div className="text-center py-8 space-y-4">
            <p className="text-gray-500">No deployments yet</p>
            <Button onClick={() => router.push("/")}>
              Create Your First Deployment
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {deployments.map((deployment) => (
              <div
                key={deployment.id}
                className="border rounded-lg p-4 space-y-2"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">{deployment.name}</h3>
                    {deployment.description && (
                      <p className="text-sm text-gray-500">
                        {deployment.description}
                      </p>
                    )}
                    <p className="text-xs text-gray-400">
                      Deployed{" "}
                      {formatDistanceToNow(new Date(deployment.created_at))} ago
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyEndpoint(deployment.id)}
                      className="space-x-2"
                    >
                      <Copy className="w-4 h-4" />
                      <span>Copy Endpoint</span>
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() =>
                        router.push(`/deployments/${deployment.id}`)
                      }
                      className="space-x-2"
                    >
                      <span>Manage</span>
                    </Button>
                  </div>
                </div>
                <div className="text-sm bg-gray-50 dark:bg-gray-900 p-2 rounded">
                  <code>POST /api/run/{deployment.id}</code>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AuthWrapper>
  );
}
