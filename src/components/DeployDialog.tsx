"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface DeployDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canvasId: string;
}

export function DeployDialog({
  open,
  onOpenChange,
  canvasId,
}: DeployDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [deploying, setDeploying] = useState(false);
  const { toast } = useToast();

  const handleDeploy = async () => {
    if (deploying) return;

    try {
      setDeploying(true);
      const response = await fetch("/api/deployments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          canvasId,
          name,
          description,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to deploy");
      }

      const { deployment } = await response.json();

      toast({
        title: "Deployment Created",
        description: "Your canvas has been deployed successfully",
      });
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeploying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Deploy Canvas</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Production API v1"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Description (optional)
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this deployment do?"
            />
          </div>
          <Button
            onClick={handleDeploy}
            className="w-full"
            disabled={deploying}
          >
            {deploying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deploying...
              </>
            ) : (
              "Deploy"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
