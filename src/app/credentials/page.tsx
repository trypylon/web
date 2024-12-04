"use client";

import { useEffect, useState } from "react";
import { Eye, EyeOff, Key, Trash2, Plus, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AuthWrapper } from "@/components/ui/auth-wrapper";
import { APIKeyType, API_KEY_LABELS } from "@/types/credentials";
import { useToast } from "@/hooks/use-toast";

export default function CredentialsPage() {
  const [credentials, setCredentials] = useState<Record<APIKeyType, string>>({
    [APIKeyType.OPENAI]: "",
    [APIKeyType.ANTHROPIC]: "",
    [APIKeyType.PINECONE]: "",
    [APIKeyType.QDRANT]: "",
    [APIKeyType.HUGGINGFACE]: "",
    [APIKeyType.COHERE]: "",
    [APIKeyType.META]: "",
  });
  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({});
  const { toast } = useToast();
  const [apiKeys, setApiKeys] = useState<
    Array<{ id: string; name: string; key: string }>
  >([]);
  const [newKeyName, setNewKeyName] = useState("");
  const [creatingKey, setCreatingKey] = useState(false);

  useEffect(() => {
    fetch("/api/credentials")
      .then((res) => res.json())
      .then((data) => {
        const existingCreds = data.credentials.reduce((acc: any, cred: any) => {
          acc[cred.key] = cred.value;
          return acc;
        }, {});
        setCredentials((prev) => ({ ...prev, ...existingCreds }));
      });
  }, []);

  useEffect(() => {
    fetch("/api/keys")
      .then((res) => res.json())
      .then((data) => {
        setApiKeys(data.keys);
      });
  }, []);

  const handleSave = async () => {
    try {
      await Promise.all(
        Object.entries(credentials).map(([key, value]) => {
          return fetch("/api/credentials", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ key, value }),
          });
        })
      );

      toast({
        title: "Success",
        description: "Credentials saved successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save credentials",
        variant: "destructive",
      });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCredentials((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const toggleVisibility = (key: string) => {
    setVisibleKeys((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleDelete = async (key: string) => {
    try {
      await fetch("/api/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value: null }),
      });

      setCredentials((prev) => ({
        ...prev,
        [key]: "",
      }));

      toast({
        title: "Success",
        description: "API key removed successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove API key",
        variant: "destructive",
      });
    }
  };

  const handleCreateKey = async () => {
    if (!newKeyName || creatingKey) return;

    try {
      setCreatingKey(true);
      const response = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newKeyName }),
      });

      if (!response.ok) {
        throw new Error("Failed to create API key");
      }

      const { key } = await response.json();
      setApiKeys([...apiKeys, { id: key, name: newKeyName, key }]);
      setNewKeyName("");
      toast({
        title: "API Key Created",
        description: "Your new API key has been created",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setCreatingKey(false);
    }
  };

  return (
    <AuthWrapper>
      <div className="max-w-4xl mx-auto px-4 py-8 w-full">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 rounded-lg bg-blue-500">
            <Key className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">API Credentials</h1>
            <p className="text-sm text-muted-foreground">
              Manage your API keys for various services
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {Object.entries(credentials).map(([key, value]) => (
            <div key={key} className="space-y-2">
              <label className="text-sm font-medium">
                {API_KEY_LABELS[key as APIKeyType]}
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    type={visibleKeys[key] ? "text" : "password"}
                    name={key}
                    value={value}
                    onChange={handleChange}
                    placeholder={`Enter your ${key.toLowerCase()}`}
                    className="font-mono pr-20"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-2">
                    {value && (
                      <button
                        onClick={() => toggleVisibility(key)}
                        className="p-1 hover:text-blue-500"
                      >
                        {visibleKeys[key] ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    )}
                    {value && (
                      <button
                        onClick={() => handleDelete(key)}
                        className="p-1 hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
          <Button onClick={handleSave} className="w-full mt-6">
            Save Changes
          </Button>
        </div>

        <div className="mt-12 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">API Keys</h2>
            <div className="flex items-center space-x-2">
              <Input
                placeholder="Key name"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                className="w-48"
              />
              <Button
                onClick={handleCreateKey}
                disabled={!newKeyName || creatingKey}
                className="space-x-2"
              >
                {creatingKey ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                <span>Create Key</span>
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {apiKeys.map((apiKey) => (
              <div
                key={apiKey.id}
                className="border rounded-lg p-4 flex items-center justify-between"
              >
                <div>
                  <h3 className="font-medium">{apiKey.name}</h3>
                  <code className="text-sm bg-gray-50 dark:bg-gray-900 px-2 py-1 rounded">
                    {apiKey.key}
                  </code>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(apiKey.key);
                    toast({
                      title: "Copied",
                      description: "API key copied to clipboard",
                    });
                  }}
                >
                  Copy
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AuthWrapper>
  );
}
