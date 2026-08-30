import { AskChat } from "@/components/site/ask-chat";

export const metadata = {
  title: "Ask Ugbanawaji",
  description: "Ask about Leonard Ugbanawaji's engineering work and explore the supporting sources.",
};

export default function AskPage() {
  return (
    <main className="min-h-[calc(100svh-4.5rem)] py-10 sm:py-14">
      <div className="container-shell max-w-5xl">
        <header className="mx-auto max-w-4xl">
          <h1 className="text-3xl font-extrabold tracking-[-0.04em] sm:text-4xl">
            Ask Ugbanawaji
          </h1>
          <p className="mt-2 text-base text-muted-foreground">
            Explore my engineering work, experience, and decisions—with sources.
          </p>
        </header>
        <AskChat />
      </div>
    </main>
  );
}
