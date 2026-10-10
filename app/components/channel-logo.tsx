import Image from "next/image";

export const deliveryChannels = [
  { provider: "telegram", label: "Telegram", color: "#26A5E4" },
  { provider: "discord", label: "Discord", color: "#5865F2" },
  { provider: "zalo", label: "Zalo", color: "#0068FF" },
  { provider: "messenger", label: "Messenger", color: "#0866FF" },
  { provider: "whatsapp", label: "WhatsApp", color: "#25D366" },
  { provider: "email", label: "Email", color: "#475569" },
] as const;

type Channel = (typeof deliveryChannels)[number];

export default function ChannelLogo({ channel }: { channel: Channel }) {
  return (
    <span aria-hidden="true" className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-black/5" style={{ backgroundColor: `${channel.color}12`, color: channel.color }}>
      {channel.provider === "email" ? (
        <svg className="h-7 w-7" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24">
          <rect x="3" y="5" width="18" height="14" rx="3" />
          <path d="m4 7 8 6 8-6" />
        </svg>
      ) : (
        <Image alt="" width={28} height={28} src={`/assets/icons/channels/${channel.provider}.svg`} />
      )}
    </span>
  );
}
