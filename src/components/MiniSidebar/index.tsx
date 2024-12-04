"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Bot, Key, User, Rocket, FolderOpen } from "lucide-react";
import { PylonLogo } from "@/components/icons/PylonLogo";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  description: string;
}

export function MiniSidebar() {
  const pathname = usePathname();

  const mainNavigation: NavItem[] = [
    {
      name: "App",
      href: "/",
      icon: Bot,
      description: "Build AI workflows",
    },
    {
      name: "Canvases",
      href: "/canvases",
      icon: FolderOpen,
      description: "View saved canvases",
    },
    {
      name: "Deployments",
      href: "/deployments",
      icon: Rocket,
      description: "Manage deployments",
    },
    {
      name: "Credentials",
      href: "/credentials",
      icon: Key,
      description: "Manage API keys",
    },
  ];

  const profileNav: NavItem = {
    name: "Profile",
    href: "/profile",
    icon: User,
    description: "View profile settings",
  };

  const NavLink = ({ item }: { item: NavItem }) => {
    const Icon = item.icon;
    const isActive = pathname === item.href;

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            href={item.href}
            className={cn(
              "w-10 h-10 flex items-center justify-center rounded-lg transition-colors",
              isActive
                ? "bg-blue-600 text-white"
                : "text-gray-400 hover:bg-gray-800 hover:text-white"
            )}
          >
            <Icon className="w-5 h-5" />
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p className="font-medium">{item.name}</p>
          <p className="text-xs opacity-80">{item.description}</p>
        </TooltipContent>
      </Tooltip>
    );
  };

  return (
    <TooltipProvider>
      <div className="fixed left-0 top-0 h-full w-16 bg-gray-900 flex flex-col">
        {/* Logo Section */}
        <div className="py-4 border-b border-gray-800 w-full flex justify-center">
          <Link href="/" className="text-white">
            <PylonLogo className="w-8 h-8" />
          </Link>
        </div>

        {/* Main Navigation */}
        <div className="flex-1 w-full flex flex-col items-center py-4 space-y-2">
          {mainNavigation.map((item) => (
            <NavLink key={item.name} item={item} />
          ))}
        </div>

        {/* Profile Link (Bottom) */}
        <div className="w-full flex justify-center pb-4 pt-2 border-t border-gray-800">
          <NavLink item={profileNav} />
        </div>
      </div>
    </TooltipProvider>
  );
}
