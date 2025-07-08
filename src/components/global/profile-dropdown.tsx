"use server";
import { auth, signOut } from "@/auth";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "../ui/dropdown-menu";
import { Button } from "../ui/button";
import { User, LogOut, Settings as SettingsIcon, HelpCircle, Star, SlidersHorizontal } from "lucide-react";
import Image from "next/image";
import Logout from "./logout";

export default async function ProfileDropdown() {
  const session = await auth();
  const user = session?.user;
  const initials = user?.name
    ? user.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  const handleSignOut = async () => {
    'use server';
    await signOut();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          {user?.image ? (
            <Image
              src={user.image}
              alt={user.name || "User"}
              width={32}
              height={32}
              className="rounded-full object-cover"
            />
          ) : (
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-foreground font-bold text-base">
              {initials}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[220px] *:!cursor-pointer">
        <div className="flex flex-col items-start px-3 py-2">
          <span className="text-sm font-medium text-foreground mb-1">{user?.email}</span>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <Star className="w-4 h-4 mr-2" /> Upgrade plan
        </DropdownMenuItem>
        <DropdownMenuItem>
          <SlidersHorizontal className="w-4 h-4 mr-2" /> Customize ChatGPT
        </DropdownMenuItem>
        <DropdownMenuItem>
          <SettingsIcon className="w-4 h-4 mr-2" /> Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <HelpCircle className="w-4 h-4 mr-2" /> Help
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <Logout>
          <DropdownMenuItem asChild>
            <button type="button" className="w-full flex items-center">
              <LogOut className="w-4 h-4 mr-2" /> Log out
            </button>
          </DropdownMenuItem>
        </Logout>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 