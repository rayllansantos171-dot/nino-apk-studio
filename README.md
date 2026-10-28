# Nino APK Studio

Nino APK 02

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://nino-apk-studio.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/25bdd095-3532-434c-baf9-a6cce5ec59b8).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## App Android (APK)

O app Android usa Capacitor (`android/`) e abre o site publicado (`server.url` em `capacitor.config.ts`).
Sem internet, abre o Nino offline (`public/offline.html`). Para publicar mudanças do site no app, clique em **Publish** na Lovable.

**Gerar o APK sem computador:** no GitHub, abra a aba **Actions** → **Gerar APK do Nino** → **Run workflow**.
Ao terminar, baixe o arquivo `nino-ai-apk` (contém `app-debug.apk`) no fim da página da execução e instale no celular.

**No computador:**

```sh
npm install
npx cap sync android
cd android && ./gradlew assembleDebug
```

Para publicar na Play Store, gere um APK/AAB **assinado** (`./gradlew bundleRelease` com sua keystore).
