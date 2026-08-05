"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn"; // Usually cn utility is available or I will create a simple one if not. Let me use a custom inline one if I'm not sure. Wait, package.json had "tailwind-merge" and "clsx". I'll assume they have a standard cn, but to be perfectly safe, I'll inline a minimal version if needed. Actually, I can check if they have a lib/utils.ts, but standard apps often do. I will just rely on raw classes here if I want to skip dependencies, but I can check. Let's just use raw classNames.

interface TabsProps {
  tabs: {
    id: string;
    label: string;
    content: React.ReactNode;
  }[];
  defaultTab?: string;
}

export function Tabs({ tabs, defaultTab }: TabsProps) {
  const [activeTab, setActiveTab] = React.useState(defaultTab || tabs[0]?.id);

  return (
    <div className="w-full">
      <div className="flex space-x-1 border-b border-border/60 p-1 mb-6">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 outline-none
                ${
                  isActive
                    ? "text-brand bg-brand/10 shadow-sm ring-1 ring-brand/20"
                    : "text-text-muted hover:text-text-primary hover:bg-surface/50"
                }
              `}
            >
              {tab.label}
              {isActive && (
                <span className="absolute inset-x-2 -bottom-[5px] h-0.5 bg-brand" />
              )}
            </button>
          );
        })}
      </div>
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        {tabs.find((t) => t.id === activeTab)?.content}
      </div>
    </div>
  );
}
