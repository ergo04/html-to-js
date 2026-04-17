import { cn } from "@/lib/utils";
import { Layers, Tag, GitBranch, FileType, HeartIcon } from "lucide-react";
import Link from "next/link";

const features = [
  {
    icon: Layers,
    label: "Nested structures",
    description: "Parent-child",
    hideOnMobile: true,
  },
  {
    icon: Tag,
    label: "Full attributes",
    description: "class, style, data-*",
    hideOnMobile: true,
  },
  {
    icon: FileType,
    label: "Native SVG",
    description: "createElementNS",
    hideOnMobile: true,
  },
  {
    icon: GitBranch,
    label: "Text nodes",
    description: "textContent & TextNode",
    hideOnMobile: true,
  },
  {
    icon: HeartIcon,
    label: <span>Made by <Link href={'https://simoneergotino.it'} target="_blank" className="underline hover:text-primary transition-all">Simone Ergotino</Link></span>
  }
];

export function FeaturesBar() {
  return (
    <div className="border-t border-border bg-card px-4 py-2.5">
      <div className="flex items-center justify-center gap-4 lg:gap-8 flex-wrap">
        {features.map((f, i) => (
          <div key={i} className={cn("flex items-center gap-2 text-xs text-muted-foreground", f.hideOnMobile && 'max-md:hidden')}>
            <f.icon className="size-3.5 text-primary" />
            <span className="font-medium text-foreground">{f.label}</span>
            {/* <span className="hidden sm:inline text-muted-foreground/60">
              {f.description}
            </span> */}
          </div>
        ))}
      </div>
    </div>
  );
}
