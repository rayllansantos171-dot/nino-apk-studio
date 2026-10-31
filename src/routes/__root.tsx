import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from '@tanstack/react-router';
import { useEffect, type ReactNode } from 'react';

import appCss from '../styles.css?url';
import { reportLovableError } from '../lib/lovable-error-reporting';

function NotFoundComponent() {
  return (
    <div className='flex min-h-screen items-center justify-center bg-background px-4'>
      <div className='max-w-md text-center'>
        <h1 className='text-7xl font-bold text-foreground'>404</h1>
        <h2 className='mt-4 text-xl font-semibold text-foreground'>Página não encontrada</h2>
        <p className='mt-2 text-sm text-muted-foreground'>
          A página que você procura não existe ou foi movida.
        </p>
        <div className='mt-6'>
          <Link
            to='/'
            className='inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90'
          >
            Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: 'tanstack_root_error_component' });
  }, [error]);

  return (
    <div className='flex min-h-screen items-center justify-center bg-background px-4'>
      <div className='max-w-md text-center'>
        <h1 className='text-xl font-semibold tracking-tight text-foreground'>
          Esta página não carregou
        </h1>
        <p className='mt-2 text-sm text-muted-foreground'>
          Ocorreu um erro inesperado. Atualize a página ou volte ao início.
        </p>
        <div className='mt-6 flex flex-wrap justify-center gap-2'>
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className='inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90'
          >
            Tentar novamente
          </button>
          <a
            href='/'
            className='inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent'
          >
            Voltar ao início
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    // Fundo escuro desde o primeiro quadro (evita o flash branco ao abrir o app)
    styles: [{ children: 'html,body{background:#07040f}' }],
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Nino AI' },
      { name: 'description', content: 'Nino AI, seu agente virtual de IA para Android.' },
      { name: 'author', content: 'Nino AI' },
      { name: 'application-name', content: 'Nino AI' },
      { name: 'theme-color', content: '#07040f' },
      { name: 'mobile-web-app-capable', content: 'yes' },
      { name: 'apple-mobile-web-app-capable', content: 'yes' },
      { name: 'apple-mobile-web-app-title', content: 'Nino AI' },
      { property: 'og:site_name', content: 'Nino AI' },
      { property: 'og:locale', content: 'pt_BR' },
      { property: 'og:title', content: 'Nino AI — Agente virtual de IA para Android' },
      { property: 'og:description', content: 'Converse com uma IA e leve seu agente virtual para o Android.' },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary' },
      { name: 'twitter:title', content: 'Nino AI — Agente virtual de IA para Android' },
      { name: 'twitter:description', content: 'Converse com uma IA e leve seu agente virtual para o Android.' },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
      { rel: 'icon', href: '/favicon.ico', type: 'image/x-icon' },
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Press+Start+2P&display=swap',
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang='pt-BR'>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
    </QueryClientProvider>
  );
}
