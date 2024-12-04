"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { useFlowStore } from "@/store/flowStore";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface SaveCanvasDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: "save" | "saveAs";
}

export function SaveCanvasDialog({
  open,
  onOpenChange,
  mode = "save",
}: SaveCanvasDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const saveCanvas = useFlowStore((state) => state.saveCanvas);
  const currentCanvasId = useFlowStore((state) => state.currentCanvasId);
  const { toast } = useToast();

  const handleSave = async () => {
    if (saving) return;

    try {
      setSaving(true);
      await saveCanvas(name, description, mode === "saveAs");
      toast({
        title: mode === "saveAs" ? "Canvas Saved" : "Canvas Updated",
        description:
          mode === "saveAs"
            ? "Your new canvas has been saved"
            : "Your canvas has been updated",
      });
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === "saveAs" ? "Save as New Canvas" : "Save Canvas"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My awesome workflow"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Description (optional)
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this workflow do?"
            />
          </div>
          <Button onClick={handleSave} className="w-full" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {currentCanvasId ? "Updating..." : "Saving..."}
              </>
            ) : currentCanvasId ? (
              "Update Canvas"
            ) : (
              "Save Canvas"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
