import { createFileRoute } from '@tanstack/react-router';
import {
  ArrowRight,
  Bot,
  Check,
  Globe2,
  MessageCircle,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Zap,
} from 'lucide-react';

const siteUrl = 'https://nino-apk-studio.lovable.app';
const pageUrl = `${siteUrl}/nino-ai`;
const description =
  'Conheça o Nino AI, um agente virtual de IA para Android que conversa com você, pode aparecer sobre outros aplicativos e oferece personalização completa.';

const features = [
  {
    icon: Bot,
    title: 'Agente de IA',
    description:
      'Converse com uma inteligência artificial que entende suas perguntas e mantém o histórico da conversa.',
  },
  {
    icon: Smartphone,
    title: 'Agente flutuante',
    description:
      'Ative o Nino sobre outros aplicativos do Android para acompanhar você durante a navegação.',
  },
  {
    icon: Sparkles,
    title: 'Personalização',
    description:
      'Escolha temas, tamanho, velocidade, brilho, partículas, sons e o comportamento do seu agente.',
  },
  {
    icon: MessageCircle,
    title: 'Conversas contínuas',
    description:
      'Faça perguntas, peça sugestões e continue a conversa sem perder o contexto das últimas mensagens.',
  },
  {
    icon: ShieldCheck,
    title: 'Controle local',
    description:
      'Ative ou pause recursos, configure o comportamento e mantenha as preferências sob seu controle.',
  },
  {
    icon: Globe2,
    title: 'Uso flexível',
    description:
      'Conheça o projeto pela web ecompanhe a experiência também no aplicativo Android.',
  },
];

const steps = [
  {
    number: '01',
    title: 'Abra o Nino AI',
    description:
      'Inicie a experiência pela página do aplicativo e conheça o agente virtual.',
  },
  {
    number: '02',
    title: 'Converse com a IA',
    description:
      'Envie uma pergunta pelo chat e receba uma resposta contextualizada pelo serviço de IA.',
  },
  {
    number: '03',
    title: 'Ative no Android',
    description:
      'Permita a sobreposição de tela para usar o Nino como agente flutuante em outros aplicativos.',
  },
  {
    number: '04',
    title: 'Deixe com sua cara',
    description:
      'Personalize o visual e ajuste movimento, tamanho, efeitos, som e vibração.',
  },
];

const faqItems = [
  {
    question: 'O Nino AI usa IA real?',
    answer:
      'Sim. Com internet, as conversas do Nino são encaminhadas para o serviço de IA do projeto. Se a conexão cair, o aplicativo mantém respostas locais básicas para continuar interagindo.',
  },
  {
    question: 'O Nino pode aparecer sobre outros aplicativos?',
    answer:
      'Sim. No Android, o recurso de agente flutuante usa a permissão de sobreposição de tela. Depois de ativado, o Nino pode acompanhar você enquanto usa outros aplicativos.',
  },
  {
    question: 'Posso personalizar o Nino?',
    answer:
      'Sim. Você pode escolher o tema, o tamanho, a velocidade, os efeitos de brilho, as partículas, os sons, o movimento e o comportamento do agente.',
  },
  {
    question: 'O Nino funciona sem internet?',
    answer:
      'O aplicativo continua disponível e o chat possui respostas locais básicas. Para conversar com a IA remota, é necessário estar conectado.',
  },
  {
    question: 'Como começo a usar o Nino AI?',
    answer:
      'Abra o Nino AI, comece uma conversa e ative o agente flutuante. No Android, conceda a permissão de sobreposição quando o sistema solicitar.',
  },
];

const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'SoftwareApplication',
      '@id': `${pageUrl}/#application`,
      name: 'Nino AI',
      url: siteUrl,
      applicationCategory: 'UtilitiesApplication',
      operatingSystem: 'Android, Web',
      description,
      inLanguage: 'pt-BR',
    },
    {
      '@type': 'FAQPage',
      '@id': `${pageUrl}/#faq`,
      mainEntity: faqItems.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer,
        },
      })),
    },
  ],
};

export const Route = createFileRoute('/nino-ai')({
  head: () => ({
    meta: [
      { title: 'Nino AI — Seu agente virtual de IA para Android' },
      { name: 'description', content: description },
      { name: 'robots', content: 'index, follow, max-image-preview:large' },
      { property: 'og:site_name', content: 'Nino AI' },
      { property: 'og:locale', content: 'pt_BR' },
      { property: 'og:title', content: 'Nino AI — Seu agente virtual de IA para Android' },
      { property: 'og:description', content: description },
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: pageUrl },
      { name: 'twitter:card', content: 'summary' },
      { name: 'twitter:title', content: 'Nino AI — Seu agente virtual de IA para Android' },
      { name: 'twitter:description', content: description },
    ],
    links: [{ rel: 'canonical', href: pageUrl }],
  }),
  component: NinoAiLanding,
});

function NinoAiLanding() {
  return (
    <main className='min-h-screen overflow-hidden bg-[#07040f] text-slate-100'>
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <div className='pointer-events-none fixed inset-0 opacity-70'>
        <div
          className='absolute -left-40 -top-40 h-[34rem] w-[34rem] rounded-full blur-3xl'
          style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.28), transparent 68%)' }}
        />
        <div
          className='absolute -right-48 top-[20rem] h-[38rem] w-[38rem] rounded-full blur-3xl'
          style={{ background: 'radial-gradient(circle, rgba(37,99,235,0.18), transparent 68%)' }}
        />
      </div>

      <nav className='relative z-20 border-b border-white/10 bg-[#07040f]/80 backdrop-blur-xl'>
        <div className='mx-auto flex max-w-6xl items-center justify-between gap-5 px-5 py-4 sm:px-8'>
          <a href='/' className='flex items-center gap-3 font-black tracking-tight text-white'>
            <span className='grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 text-lg shadow-lg shadow-purple-950/40'>
              N
            </span>
            <span>Nino AI</span>
          </a>
          <div className='flex items-center gap-3 text-sm font-semibold text-slate-300 sm:gap-6'>
            <a href='#recursos' className='hidden transition-colors hover:text-white sm:block'>
              Recursos
            </a>
            <a href='#perguntas' className='hidden transition-colors hover:text-white sm:block'>
              Perguntas
            </a>
            <a
              href='/'
              className='rounded-xl bg-white px-4 py-2.5 font-bold text-[#120b22] transition-transform hover:-translate-y-0.5'
            >
              Abrir Nino AI
            </a>
          </div>
        </div>
      </nav>

      <section className='relative z-10 mx-auto grid max-w-6xl items-center gap-14 px-5 pb-24 pt-20 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:pb-32 lg:pt-28'>
        <div>
          <div className='inline-flex items-center gap-2 rounded-full border border-purple-400/30 bg-purple-400/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-purple-200'>
            <Sparkles size={14} />
            IA real em um agente virtual
          </div>
          <h1 className='mt-7 max-w-3xl text-4xl font-black leading-[1.08] tracking-tight text-white sm:text-6xl'>
            Seu agente de IA para acompanhar todos os dias
          </h1>
          <p className='mt-6 max-w-2xl text-lg leading-8 text-slate-300'>
            O Nino AI combina chat com inteligência artificial, agente flutuante no Android e
            personalização completa em uma experiência leve e intuitiva.
          </p>
          <div className='mt-9 flex flex-col gap-3 sm:flex-row'>
            <a
              href='/'
              className='inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-3.5 font-bold text-white shadow-xl shadow-purple-950/40 transition-transform hover:-translate-y-0.5'
            >
              Conversar com o Nino
              <ArrowRight size={18} />
            </a>
            <a
              href='#recursos'
              className='inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 px-6 py-3.5 font-bold text-slate-100 transition-colors hover:bg-white/10'
            >
              Conhecer os recursos
            </a>
          </div>
          <div className='mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-400'>
            {['Chat com IA', 'Agente flutuante', 'Temas personalizáveis'].map((item) => (
              <span key={item} className='inline-flex items-center gap-2'>
                <span className='grid h-5 w-5 place-items-center rounded-full bg-emerald-400/15 text-emerald-300'>
                  <Check size={13} />
                </span>
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className='relative mx-auto w-full max-w-lg'>
          <div className='absolute -inset-5 rounded-[2.5rem] bg-gradient-to-br from-purple-600/30 via-transparent to-blue-500/20 blur-2xl' />
          <div className='relative overflow-hidden rounded-[2rem] border border-white/15 bg-[#100a1d]/90 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur'>
            <div className='flex items-center justify-between border-b border-white/10 px-5 py-4'>
              <div className='flex items-center gap-3'>
                <span className='grid h-10 w-10 place-items-center rounded-xl bg-purple-500/20 text-purple-200'>
                  <Bot size={22} />
                </span>
                <div>
                  <strong className='block text-sm text-white'>Nino</strong>
                  <span className='block text-xs text-emerald-300'>Online</span>
                </div>
              </div>
              <span className='rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-300'>
                IA ativa
              </span>
            </div>
            <div className='space-y-5 p-5 sm:p-7'>
              <div className='flex items-end gap-3'>
                <span className='grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-purple-500 to-blue-600'>
                  <Bot size={18} />
                </span>
                <div className='max-w-[78%] rounded-2xl rounded-bl-md bg-white/10 px-4 py-3 text-sm leading-6 text-slate-100'>
                  Olá! Eu sou o Nino. Como posso te ajudar hoje?
                </div>
              </div>
              <div className='flex justify-end'>
                <div className='max-w-[80%] rounded-2xl rounded-br-md bg-purple-600 px-4 py-3 text-sm leading-6 text-white'>
                  Me ajuda a começar.
                </div>
              </div>
              <div className='flex items-end gap-3'>
                <span className='grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-purple-500 to-blue-600'>
                  <Bot size={18} />
                </span>
                <div className='max-w-[78%] rounded-2xl rounded-bl-md bg-white/10 px-4 py-3 text-sm leading-6 text-slate-100'>
                  Vamos lá. Você pode me ativar sobre outros aplicativos, conversar pelo chat e
                  personalizar meu visual.
                </div>
              </div>
            </div>
            <div className='border-t border-white/10 bg-black/10 p-4'>
              <div className='flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-500'>
                <MessageCircle size={17} />
                Digite sua mensagem
                <span className='ml-auto grid h-8 w-8 place-items-center rounded-lg bg-purple-600 text-white'>
                  <ArrowRight size={15} />
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id='recursos' className='relative z-10 border-y border-white/10 bg-white/[0.025]'>
        <div className='mx-auto max-w-6xl px-5 py-24 sm:px-8'>
          <div className='max-w-2xl'>
            <p className='text-sm font-bold uppercase tracking-[0.2em] text-purple-300'>
              Mais do que um chat
            </p>
            <h2 className='mt-3 text-3xl font-black tracking-tight text-white sm:text-5xl'>
              Um agente feito para acompanhar sua rotina
            </h2>
            <p className='mt-5 text-lg leading-8 text-slate-400'>
              Reúna conversa, presença flutuante e preferências personalizadas em um único projeto.
            </p>
          </div>
          <div className='mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3'>
            {features.map((feature) => {
              const FeatureIcon = feature.icon;
              return (
                <article
                  key={feature.title}
                  className='rounded-2xl border border-white/10 bg-[#100a1d]/80 p-7 transition-colors hover:border-purple-400/40 hover:bg-[#140c25]'
                >
                  <span className='grid h-12 w-12 place-items-center rounded-xl bg-purple-500/15 text-purple-300'>
                    <FeatureIcon size={23} />
                  </span>
                  <h3 className='mt-6 text-xl font-bold text-white'>{feature.title}</h3>
                  <p className='mt-3 leading-7 text-slate-400'>{feature.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className='relative z-10 mx-auto max-w-6xl px-5 py-24 sm:px-8'>
        <div className='grid gap-14 lg:grid-cols-[0.8fr_1.2fr]'>
          <div>
            <p className='text-sm font-bold uppercase tracking-[0.2em] text-blue-300'>Como começar</p>
            <h2 className='mt-3 text-3xl font-black tracking-tight text-white sm:text-5xl'>
              Pronto para conhecer o Nino?
            </h2>
            <p className='mt-5 leading-8 text-slate-400'>
              São poucos passos para transformar o agente em um companheiro de tela que responde,
              acompanha e se adapta às suas preferências.
            </p>
          </div>
          <ol className='grid gap-4 sm:grid-cols-2'>
            {steps.map((step) => (
              <li
                key={step.number}
                className='rounded-2xl border border-white/10 bg-white/[0.035] p-6'
              >
                <span className='font-mono text-sm font-bold text-purple-300'>{step.number}</span>
                <h3 className='mt-4 text-lg font-bold text-white'>{step.title}</h3>
                <p className='mt-2 text-sm leading-6 text-slate-400'>{step.description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className='relative z-10 mx-auto max-w-6xl px-5 pb-24 sm:px-8'>
        <div className='overflow-hidden rounded-[2rem] border border-purple-400/20 bg-gradient-to-br from-purple-700/30 via-[#120b22] to-blue-700/25 p-8 sm:p-12 lg:p-16'>
          <div className='grid items-center gap-10 lg:grid-cols-[1.2fr_0.8fr]'>
            <div>
              <span className='inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.15em] text-purple-100'>
                <Zap size={14} />
                Personalização total
              </span>
              <h2 className='mt-6 text-3xl font-black tracking-tight text-white sm:text-4xl'>
                Um agente com a sua cara
              </h2>
              <p className='mt-4 max-w-2xl text-lg leading-8 text-slate-300'>
                Escolha entre diferentes temas e ajuste tamanho, velocidade, movimento, brilho,
                partículas, sons, vibração e balões de conversa.
              </p>
              <a
                href='/'
                className='mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 font-bold text-[#120b22] transition-transform hover:-translate-y-0.5'
              >
                Experimentar agora
                <ArrowRight size={18} />
              </a>
            </div>
            <div className='grid grid-cols-2 gap-4'>
              {['Temas', 'Tamanho', 'Movimento', 'Efeitos', 'Som', 'Vibração'].map((item) => (
                <div
                  key={item}
                  className='rounded-xl border border-white/10 bg-black/20 px-4 py-4 text-sm font-semibold text-slate-200'
                >
                  <Check className='mb-2 text-emerald-300' size={16} />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id='perguntas' className='relative z-10 border-t border-white/10 bg-white/[0.025]'>
        <div className='mx-auto max-w-4xl px-5 py-24 sm:px-8'>
          <div className='text-center'>
            <p className='text-sm font-bold uppercase tracking-[0.2em] text-purple-300'>
              Perguntas frequentes
            </p>
            <h2 className='mt-3 text-3xl font-black tracking-tight text-white sm:text-5xl'>
              Tudo sobre o Nino AI
            </h2>
          </div>
          <div className='mt-12 space-y-4'>
            {faqItems.map((item) => (
              <details
                key={item.question}
                className='group rounded-2xl border border-white/10 bg-[#100a1d]/80 px-6 py-5 open:border-purple-400/30'
              >
                <summary className='flex cursor-pointer list-none items-center justify-between gap-6 font-bold text-white'>
                  <span>{item.question}</span>
                  <span className='grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/5 text-xl font-normal text-purple-300 transition-transform group-open:rotate-45'>
                    +
                  </span>
                </summary>
                <p className='mt-4 max-w-3xl leading-7 text-slate-400'>{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className='relative z-10 mx-auto max-w-6xl px-5 py-24 sm:px-8'>
        <div className='rounded-[2rem] border border-white/10 bg-[#100a1d] px-6 py-14 text-center sm:px-12'>
          <span className='mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-purple-500 to-blue-600 text-white shadow-xl shadow-purple-950/40'>
            <Bot size={28} />
          </span>
          <h2 className='mt-6 text-3xl font-black tracking-tight text-white sm:text-4xl'>
            Converse com seu novo agente virtual
          </h2>
          <p className='mx-auto mt-4 max-w-xl text-lg leading-8 text-slate-400'>
            Conheça o Nino AI, experimente o chat e leve seu agente para o Android.
          </p>
          <a
            href='/'
            className='mt-8 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 px-7 py-3.5 font-bold text-white shadow-xl shadow-purple-950/40 transition-transform hover:-translate-y-0.5'
          >
            Abrir o Nino AI
            <ArrowRight size={18} />
          </a>
        </div>
      </section>

      <footer className='relative z-10 border-t border-white/10'>
        <div className='mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-8 text-sm text-slate-500 sm:flex-row sm:px-8'>
          <p>Nino AI — seu agente virtual de IA.</p>
          <div className='flex gap-6'>
            <a href='/' className='transition-colors hover:text-white'>
              Aplicativo
            </a>
            <a href='#recursos' className='transition-colors hover:text-white'>
              Recursos
            </a>
            <a href='#perguntas' className='transition-colors hover:text-white'>
              Perguntas
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
