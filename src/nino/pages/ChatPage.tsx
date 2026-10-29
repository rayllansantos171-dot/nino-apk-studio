import React from "react";
import Chat from "../components/Chat";

export default function ChatPage({
  onBack,
  voiceText,
  onVoiceHandled,
}: {
  onBack: () => void;
  voiceText?: string | null | undefined;
  onVoiceHandled?: (() => void) | undefined;
}) {
  return <Chat onBack={onBack} voiceText={voiceText} onVoiceHandled={onVoiceHandled} />;
}
