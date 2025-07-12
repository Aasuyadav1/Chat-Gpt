"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Key, Router } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";

const Page = () => {
  const router = useRouter();
  const [apiKey, setApiKey] = useState("");
  const [originalKey, setOriginalKey] = useState("");
  const [hasExistingKey, setHasExistingKey] = useState(false);

  useEffect(() => {
    // Load existing API key on component mount
    const existingKey = localStorage.getItem("gemini_api_key");
    if (existingKey) {
      setApiKey(existingKey);
      setOriginalKey(existingKey);
      setHasExistingKey(true);
    }
  }, []);

  const handleSave = () => {
    if (apiKey.trim()) {
      localStorage.setItem("gemini_api_key", apiKey);
      setOriginalKey(apiKey);
      if (hasExistingKey) {
        toast.success("API key updated successfully.");
      } else {
        toast.success("API key saved successfully.");
        setHasExistingKey(true);
      }
      router.push("/");
    } else {
      toast.error("Please enter a valid API key.");
    }
  };

  const handleKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setApiKey(e.target.value);
  };

  const isButtonDisabled =
    !apiKey.trim() || (hasExistingKey && apiKey === originalKey);

  return (
    <div className="h-full flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Connect Your API
          </h1>
          <p className="text-muted-foreground">
            Securely connect your Gemini API key to get started
          </p>
        </div>

        <Card className="border-0 shadow-lg">
          <CardHeader className="space-y-4 pb-6">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Key className="w-6 h-6 text-primary" />
            </div>
            <div className="text-center space-y-2">
              <CardTitle className="text-xl">API Key Setup</CardTitle>
              <CardDescription className="text-sm">
                Your API key is stored locally and never shared
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="apiKey" className="text-sm font-medium">
                Gemini API Key
              </Label>
              <Input
                id="apiKey"
                type="password"
                placeholder={
                  hasExistingKey
                    ? "Your current API key"
                    : "Enter your API key here..."
                }
                value={apiKey}
                onChange={handleKeyChange}
                className="h-11"
              />
              {!hasExistingKey && (
                <p className="text-xs text-muted-foreground">
                  Get your API key from{" "}
                  <Link
                    href="https://console.cloud.google.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:no-underline"
                  >
                    Google Cloud Console
                  </Link>
                </p>
              )}
            </div>
          </CardContent>

          <CardFooter className="pt-6">
            <Button
              onClick={handleSave}
              className="w-full h-11 text-sm font-medium"
              disabled={isButtonDisabled}
            >
              Connect API Key
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Page;
