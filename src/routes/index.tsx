import { createFileRoute, ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

const NinoApp = lazy(() => import("@/nino/App"));

const SITE_URL = "https://nino-apk-studio.lovable.app";

const structuredData = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Nino AI",
  alternateName: "Nino APK Studio",
  description:
    "Agente virtual para Android com chat de IA, sobreposição flutuante e experiência personalizável.",
  url: `${SITE_URL}/`,
  applicationCategory: "UtilitiesApplication",
  operatingSystem: "Android",
  inLanguage: "pt-BR",
  isAccessibleForFree: true,
  featureList: [
    "Chat com Nino AI",
    "Agente flutuante sobre outros aplicativos",
    "Personalização de aparência",
    "Configurações de movimento e interação"
  ],
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "BRL"
  },
  sameAs: ["https://github.com/rayllansantos171-dot/nino-apk-studio"]
};

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nino AI — Agente Virtual para Android com Chat de IA" },
      {
        name: "description",
        content:
          "Conheça o Nino AI, seu agente virtual para Android: converse por chat, mantenha o Nino sobre outros aplicativos e personalize sua experiência."
      },
      { name: "robots", content: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" },
      { name: "author", content: "Nino AI" },
      { property: "og:locale", content: "pt_BR" },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Nino AI" },
      { property: "og:title", content: "Nino AI — Agente Virtual para Android com Chat de IA" },
      {
        property: "og:description",
        content:
          "Converse com um agente virtual e leve o Nino AI para a tela do seu Android."
      },
      { property: "og:url", content: `${SITE_URL}/` },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Nino AI — Agente Virtual para Android" },
      {
        name: "twitter:description",
        content: "Um agente virtual para conversar, acompanhar e ajudar você durante o uso do Android."
      },
      { name: "twitter:url", content: `${SITE_URL}/` },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" }
    ],
    links: [
      { rel: "canonical", href: `${SITE_URL}/` },
      { rel: "alternate", hrefLang: "pt-BR", href: `${SITE_URL}/` },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Press+Start+2P&display=swap"
      }
    ]
  }),
  component: Index
});

function Index() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <ClientOnly fallback={null}>
        <Suspense fallback={null}>
          <NinoApp />
        </Suspense>
      </ClientOnly>
    </>
  );
}
