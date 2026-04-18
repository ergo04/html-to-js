import { AppHeader } from "@/components/app-header";
import { HtmlConverter } from "@/components/html-converter-dynamic";
import { FeaturesBar } from "@/components/features-bar";

export default function Page() {
  return (
    <div className="flex flex-col h-dvh overflow-hidden">
      <AppHeader />
      <main className="flex-1 relative min-h-0">
        <HtmlConverter />
      </main>
      <FeaturesBar />
    </div>
  );
}
