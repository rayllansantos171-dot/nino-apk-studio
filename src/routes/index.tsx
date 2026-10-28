import { createFileRoute, ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

const NinoApp = lazy(() => import("@/nino/App"));

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nino AI — Seu agente virtual" },
      { name: "description", content: "Nino AI: seu agente virtual estilo Minecraft, sempre com você." },
      { property: "og:title", content: "Nino AI — Seu agente virtual" },
      { property: "og:description", content: "Converse com o Nino, seu amigo digital estilo Minecraft." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://nino-apk-studio.lovable.app" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Press+Start+2P&display=swap",
      },
      {
        rel: "canonical",
        href: "https://nino-apk-studio.lovable.app",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <ClientOnly fallback={null}>
      <Suspense fallback={null}>
        <NinoApp />
      </Suspense>
    </ClientOnly>
  );
}
