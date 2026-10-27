import React from "react";
import Chat from "../components/Chat";

export default function ChatPage({ onBack }: { onBack: () => void }) {
  return <Chat onBack={onBack} />;
}
