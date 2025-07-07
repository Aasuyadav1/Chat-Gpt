"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { SearchDialog } from "./search-dialog";

export function SearchButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        className="w-full justify-start !text-[13px] font-normal gap-3 px-3 py-2 h-9"
        onClick={() => setOpen(true)}
      >
        <Search className="w-4 h-4" />
        <span>Search chats</span>
      </Button>
      <SearchDialog open={open} onOpenChange={setOpen} />
    </>
  );
} 