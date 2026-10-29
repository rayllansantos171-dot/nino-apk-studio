import { createFileRoute, ClientOnly } from '@tanstack/react-router';
import { lazy, Suspense } from 'react';

const NinoApp = lazy(() => import('@/nino/App'));
const siteUrl = 'https://nino-apk-studio.lovable.app';
const description = 'Nino AI é um agente virtual de IA para Android que conversa, acompanha você pela tela e pode ser personalizado.';

const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': `${siteUrl}/#website`,
      url: siteUrl,
      name: 'Nino AI',
      description,
      inLanguage: 'pt-BR',
    },
    {
      '@type': 'SoftwareApplication',
      '@id': `${siteUrl}/#app`,
      name: 'Nino AI',
      url: siteUrl,
      applicationCategory: 'UtilitiesApplication',
      operatingSystem: 'Android, Web',
      description,
      inLanguage: 'pt-BR',
    },
  ],
};

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [
      { title: 'Nino AI — Agente virtual de IA para Android' },
      { name: 'description', content: description },
      { name: 'robots', content: 'index, follow, max-image-preview:large' },
      { property: 'og:site_name', content: 'Nino AI' },
      { property: 'og:locale', content: 'pt_BR' },
      { property: 'og:title', content: 'Nino AI — Agente virtual de IA para Android' },
      { property: 'og:description', content: description },
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: siteUrl },
      { name: 'twitter:card', content: 'summary' },
      { name: 'twitter:title', content: 'Nino AI — Agente virtual de IA para Android' },
      { name: 'twitter:description', content: description },
    ],
    links: [{ rel: 'canonical', href: siteUrl }],
  }),
  component: Index,
});

function Index() {
  return (
    <>
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <noscript>
        <main className='min-h-screen bg-[#07040f] px-6 py-16 text-slate-100'>
          <section className='mx-auto max-w-3xl'>
            <p className='text-sm font-bold uppercase tracking-[0.25em] text-purple-300'>Nino AI</p>
            <h1 className='mt-4 text-4xl font-black'>Agente virtual de IA para Android</h1>
            <p className='mt-5 max-w-2xl text-lg leading-8 text-slate-300'>
              Converse com uma IA, mantenha o Nino sobre outros aplicativos e personalize tema, movimento, tamanho e comportamento.
            </p>
            <a href='/nino-ai' className='mt-8 inline-flex rounded-xl bg-purple-600 px-6 py-3 font-bold text-white'>
              Conheça o Nino AI
            </a>
          </section>
        </main>
      </noscript>
      <ClientOnly fallback={null}>
        <Suspense fallback={null}>
          <NinoApp />
        </Suspense>
      </ClientOnly>
    </>
  );
}
