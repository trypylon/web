import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Editor from "@monaco-editor/react";

interface JsonConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: any;
  onChange: (value: any) => void;
  title?: string;
}

export function JsonConfigDialog({
  open,
  onOpenChange,
  value,
  onChange,
  title = "JSON Editor",
}: JsonConfigDialogProps) {
  const [editorContent, setEditorContent] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Update editor content when value changes
  useEffect(() => {
    try {
      const contentStr =
        typeof value === "string"
          ? value
          : JSON.stringify(value || {}, null, 2);
      setEditorContent(contentStr);
      setError(null);
    } catch (e) {
      setError("Invalid JSON");
    }
  }, [value]);

  const handleEditorChange = (value: string | undefined) => {
    if (!value) return;
    setEditorContent(value);
    try {
      JSON.parse(value);
      setError(null);
    } catch (e) {
      setError("Invalid JSON");
    }
  };

  const handleSave = () => {
    try {
      const parsed = JSON.parse(editorContent);
      onChange(editorContent); // Save as string to preserve formatting
      onOpenChange(false);
    } catch (e) {
      setError("Cannot save invalid JSON");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-[400px] border rounded-md overflow-hidden">
          <Editor
            height="400px"
            defaultLanguage="json"
            value={editorContent}
            onChange={handleEditorChange}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              formatOnPaste: true,
              formatOnType: true,
              scrollBeyondLastLine: false,
              wordWrap: "on",
            }}
          />
        </div>

        {error && <div className="text-sm text-red-500 mt-2">{error}</div>}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!!error}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
