import SectionHeader from "@/components/section-header";
import {
  MessageCircle,
  Users,
  Megaphone,
  Bell,
  Download,
  Languages,
  Share2,
} from "lucide-react";

const featureCards = [
  {
    title: "Real-time chat",
    description: "Fast direct messages and group chats that update in real time.",
    icon: MessageCircle,
    accent: "bg-blue-500/10 text-blue-500",
  },
  {
    title: "Groups & channels",
    description: "Broadcast updates to large audiences or run tight-knit groups.",
    icon: Megaphone,
    accent: "bg-purple-500/10 text-purple-500",
  },
  {
    title: "Communities",
    description: "Organise conversations by topic and build your own community.",
    icon: Users,
    accent: "bg-emerald-500/10 text-emerald-500",
  },
  {
    title: "Notifications",
    description: "Smart in-app notifications with unread counts and a bell in the header.",
    icon: Bell,
    accent: "bg-amber-500/10 text-amber-500",
  },
  {
    title: "Auto downloads",
    description:
      "Control auto-download for photos, videos, and documents to save your data.",
    icon: Download,
    accent: "bg-cyan-500/10 text-cyan-500",
  },
  {
    title: "Languages",
    description: "Use the app in English, Hindi, Spanish, or Arabic.",
    icon: Languages,
    accent: "bg-rose-500/10 text-rose-500",
  },
  {
    title: "Invite friends",
    description: "Share a personal invite link so friends can join you quickly.",
    icon: Share2,
    accent: "bg-lime-500/10 text-lime-500",
  },
];

const FeaturesPage = () => {
  return (
    <div className="h-screen overflow-y-auto pb-20 bg-background">
      <div className="p-4">
        <SectionHeader title="Website features" className="mb-6" />

        <div className="max-w-4xl mx-auto space-y-8">
          <p className="text-sm text-muted-foreground">
            This app is designed to feel like a modern messaging experience with powerful
            tools for chats, channels, and communities.
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            {featureCards.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="group flex items-start gap-3 rounded-xl border border-base-300 bg-base-100/60 p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-md"
                >
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg text-base ${feature.accent}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-base-content">
                      {feature.title}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 rounded-xl border border-dashed border-primary/40 bg-primary/5 p-4 text-xs text-primary">
            You can extend this page any time with screenshots, demo videos, pricing, or a
            public roadmap to showcase what’s new and what is coming next.
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeaturesPage;
