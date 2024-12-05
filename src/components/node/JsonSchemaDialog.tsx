import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Editor from "@monaco-editor/react";

interface JsonSchemaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: any;
  onChange: (value: any) => void;
}

const defaultSchema = {
  name: "generate_response",
  description: "Generate a structured response",
  parameters: {
    type: "object",
    properties: {
      summary: {
        type: "string",
        description: "A brief summary of the response",
      },
      points: {
        type: "array",
        items: {
          type: "string",
        },
        description: "Key points from the response",
      },
    },
    required: ["summary", "points"],
  },
};

export function JsonSchemaDialog({
  open,
  onOpenChange,
  value,
  onChange,
}: JsonSchemaDialogProps) {
  const [activeTab, setActiveTab] = useState("editor");
  const [editorContent, setEditorContent] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Update editor content when value changes
  useEffect(() => {
    try {
      setEditorContent(JSON.stringify(value || defaultSchema, null, 2));
      setError(null);
    } catch (e) {
      setError("Invalid JSON schema");
    }
  }, [value]);

  const handleEditorChange = (value: string | undefined) => {
    if (!value) return;
    setEditorContent(value);
    try {
      const parsed = JSON.parse(value);
      setError(null);
      // Basic validation
      if (!parsed.name || !parsed.parameters) {
        setError("Schema must include 'name' and 'parameters' fields");
        return;
      }
      if (parsed.parameters.type !== "object") {
        setError("Parameters must be of type 'object'");
        return;
      }
    } catch (e) {
      setError("Invalid JSON");
    }
  };

  const handleSave = () => {
    try {
      const parsed = JSON.parse(editorContent);
      onChange(parsed);
      onOpenChange(false);
    } catch (e) {
      setError("Cannot save invalid JSON");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>JSON Schema Editor</DialogTitle>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 flex flex-col"
        >
          <TabsList>
            <TabsTrigger value="editor">Editor</TabsTrigger>
            <TabsTrigger value="examples">Examples</TabsTrigger>
          </TabsList>

          <TabsContent
            value="editor"
            className="flex-1 min-h-[400px] border rounded-md overflow-hidden"
          >
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
          </TabsContent>

          <TabsContent
            value="examples"
            className="flex-1 overflow-y-auto space-y-4"
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Simple Response</h3>
                <pre className="p-4 bg-muted rounded-md overflow-x-auto">
                  {JSON.stringify(
                    {
                      name: "generate_response",
                      description: "Generate a simple response",
                      parameters: {
                        type: "object",
                        properties: {
                          text: {
                            type: "string",
                            description: "The response text",
                          },
                        },
                        required: ["text"],
                      },
                    },
                    null,
                    2
                  )}
                </pre>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditorContent(
                      JSON.stringify(
                        {
                          name: "generate_response",
                          description: "Generate a simple response",
                          parameters: {
                            type: "object",
                            properties: {
                              text: {
                                type: "string",
                                description: "The response text",
                              },
                            },
                            required: ["text"],
                          },
                        },
                        null,
                        2
                      )
                    );
                    setActiveTab("editor");
                  }}
                >
                  Use This Template
                </Button>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-semibold">List Response</h3>
                <pre className="p-4 bg-muted rounded-md overflow-x-auto">
                  {JSON.stringify(
                    {
                      name: "generate_list",
                      description: "Generate a list of items",
                      parameters: {
                        type: "object",
                        properties: {
                          title: {
                            type: "string",
                            description: "The title of the list",
                          },
                          items: {
                            type: "array",
                            items: {
                              type: "string",
                            },
                            description: "The list items",
                          },
                        },
                        required: ["title", "items"],
                      },
                    },
                    null,
                    2
                  )}
                </pre>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditorContent(
                      JSON.stringify(
                        {
                          name: "generate_list",
                          description: "Generate a list of items",
                          parameters: {
                            type: "object",
                            properties: {
                              title: {
                                type: "string",
                                description: "The title of the list",
                              },
                              items: {
                                type: "array",
                                items: {
                                  type: "string",
                                },
                                description: "The list items",
                              },
                            },
                            required: ["title", "items"],
                          },
                        },
                        null,
                        2
                      )
                    );
                    setActiveTab("editor");
                  }}
                >
                  Use This Template
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {error && <div className="text-sm text-red-500 mt-2">{error}</div>}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!!error}>
            Save Schema
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
