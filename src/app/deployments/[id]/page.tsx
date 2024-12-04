"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthWrapper } from "@/components/ui/auth-wrapper";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { Loader2, Copy, ArrowLeft, Trash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Deployment {
  id: string;
  name: string;
  description: string | null;
  canvas_id: string;
  created_at: string;
  updated_at: string;
}

export default function DeploymentPage({ params }: { params: { id: string } }) {
  const [deployment, setDeployment] = useState<Deployment | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    fetch(`/api/deployments/${params.id}`)
      .then((res) => res.json())
      .then((data) => {
        setDeployment(data.deployment);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching deployment:", error);
        setLoading(false);
      });
  }, [params.id]);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to undeploy this canvas?")) return;

    try {
      const response = await fetch(`/api/deployments/${params.id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to undeploy");

      toast({
        title: "Success",
        description: "Canvas undeployed successfully",
      });
      router.push("/deployments");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to undeploy canvas",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <AuthWrapper>
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      </AuthWrapper>
    );
  }

  if (!deployment) {
    return (
      <AuthWrapper>
        <div className="text-center py-8">Deployment not found</div>
      </AuthWrapper>
    );
  }

  return (
    <AuthWrapper>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{deployment.name}</h1>
              {deployment.description && (
                <p className="text-gray-500">{deployment.description}</p>
              )}
            </div>
          </div>
          <Button
            variant="destructive"
            onClick={handleDelete}
            className="space-x-2"
          >
            <Trash className="w-4 h-4" />
            <span>Undeploy</span>
          </Button>
        </div>

        <div className="space-y-6">
          <div className="border rounded-lg p-4">
            <h2 className="font-medium mb-2">Endpoint</h2>
            <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-900 p-2 rounded">
              <code>POST /api/run/{deployment.id}</code>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(
                    `${window.location.origin}/api/run/${deployment.id}`
                  );
                  toast({
                    title: "Copied",
                    description: "API endpoint copied to clipboard",
                  });
                }}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="text-sm text-gray-500">
            Deployed {formatDistanceToNow(new Date(deployment.created_at))} ago
          </div>
        </div>
      </div>
    </AuthWrapper>
  );
}
