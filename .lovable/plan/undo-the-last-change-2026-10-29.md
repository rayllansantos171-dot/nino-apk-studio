# Undo the last change

Put the three files back exactly the way they were before the type-error fix.

## Technical details
- `src/nino/components/Chat.tsx`: `image?: string;`, `voiceText?: string | null;`, `onVoiceHandled?: () => void;` go back to how they were.
- `src/nino/pages/ChatPage.tsx`: `voiceText?: string | null;` and `onVoiceHandled?: () => void;` go back to how they were.
- `src/nino/pages/SkinShopPage.tsx`: `useState<string | null>(SKINS[0].id)` goes back to how it was.

Note: once this is undone, the three type errors you reported will show up again.

You can also undo it yourself, without this plan: click the revert button under my previous message, or open History.
