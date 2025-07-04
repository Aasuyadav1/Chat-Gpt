import React from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { ChevronDown, MoreHorizontal, RefreshCcw, ListTodo, Check, Network } from "lucide-react"

const Header = () => {
  return (
    <header className="z-50 absolute top-0 left-0 w-full flex items-center justify-between bg-background px-4 py-2">
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 px-2 py-1.5">
              <span className="text-lg font-normal">ChatGPT</span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[320px]">
            <DropdownMenuItem className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded bg-primary/10">
                <Network className="h-6 w-6" />
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                <span className="font-semibold">ChatGPT Plus</span>
                <span className="text-sm text-muted-foreground">Our smartest model</span>
              </div>
              <Button variant="outline" className="ml-auto">
                Upgrade
              </Button>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded bg-primary/10">
                <Network className="h-6 w-6" />
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                <span className="font-semibold">ChatGPT</span>
                <span className="text-sm text-muted-foreground">Great for everyday tasks</span>
              </div>
              <Check className="ml-auto h-5 w-5" />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>


      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="rounded-full">
          <RefreshCcw className="h-5 w-5" />
        </Button>

        <Button variant="ghost" size="icon" className="rounded-full">
          <ListTodo className="h-5 w-5" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              Get Plus
            </DropdownMenuItem>
            <DropdownMenuItem>
              Settings
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

export default Header