"use client";

import { useEffect, useState } from "react";
import { Eye, EyeOff, Key, Trash2 } from "lucide-react";
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
  });
  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

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
      </div>
    </AuthWrapper>
  );
}
