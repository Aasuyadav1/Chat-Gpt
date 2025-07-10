"use client";
import React, { useState } from "react";
import { Button } from "../ui/button";
import { toast } from "sonner";

type ClipboardProps = {
  textClip: string;
  setCopy?: React.Dispatch<React.SetStateAction<boolean>>;
  className?: string;
  beforeCopy?: React.ReactNode;
  afterCopy?: React.ReactNode;
};

const DevClipboard = ({
  textClip,
  beforeCopy = "Copy",
  afterCopy = "Copied",
  className,
}: ClipboardProps) => {
  const [copy, setCopy] = useState(false);
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(textClip);
      if (setCopy) {
        setCopy(true);
        setTimeout(() => setCopy(false), 1000); // Reset copied state after 1 seconds
      }
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  return (
      <Button
        className={className}
        onClick={copyToClipboard}
        variant="ghost"
        size="icon"
        aria-label="Copy to clipboard"
        data-state="closed"
      >
        {copy ? afterCopy : beforeCopy}
      </Button>
  );
};

export default DevClipboard;