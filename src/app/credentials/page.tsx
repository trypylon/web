"use client";

import { Key } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function CredentialsPage() {
  const [credentials, setCredentials] = useState({
    OPENAI_API_KEY: "",
    ANTHROPIC_API_KEY: "",
    PINECONE_API_KEY: "",
    QDRANT_API_KEY: "",
    HUGGINGFACE_API_KEY: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCredentials(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSave = () => {
    // Save credentials to local storage or secure storage
    Object.entries(credentials).forEach(([key, value]) => {
      if (value) {
        localStorage.setItem(key, value);
      }
    });
  };

  return (
    <div className="container mx-auto p-8 ml-16">
      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
          <div className="p-2 rounded-lg bg-blue-500">
            <Key className="w-6 h-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl">API Credentials</CardTitle>
            <p className="text-sm text-muted-foreground">
              Manage your API keys for various services
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {Object.entries(credentials).map(([key]) => (
            <div key={key} className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {key.split('_').join(' ')}
              </label>
              <Input
                type="password"
                name={key}
                value={credentials[key as keyof typeof credentials]}
                onChange={handleChange}
                placeholder={`Enter your ${key.toLowerCase()}`}
                className="font-mono"
              />
            </div>
          ))}
          <Button onClick={handleSave} className="w-full">
            Save Credentials
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}