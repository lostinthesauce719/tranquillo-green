"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";

interface AccordionItemProps {
  title: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export function AccordionItem({ title, children, defaultOpen = false }: AccordionItemProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  return (
    <div className="rounded-2xl border border-border/80 bg-surface/50 overflow-hidden text-sm transition-all duration-300">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between p-4 text-left font-medium text-text-primary hover:bg-surface-mid/50 outline-none"
      >
        {title}
        <ChevronDown
          className={`h-4 w-4 text-text-muted transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      <div
        className={`grid transition-all duration-300 ease-in-out ${
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="border-t border-border/50 p-4 text-text-muted bg-surface/30">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export function Accordion({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={`space-y-3 ${className}`}>
      {children}
    </div>
  );
}
