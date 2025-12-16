import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import AsideMenuButton from "./aside-menu-button";
import NotificationBell from "@/components/notification-bell";
import UserAvatarMenu from "@/components/user-avatar-menu";

interface SectionHeaderProps {
  title: string;
  actions?: ReactNode;
  className?: string;
  titleClassName?: string;
}

const SectionHeader = ({ title, actions, className, titleClassName }: SectionHeaderProps) => {
  return (
    <div className={cn("flex items-center justify-between gap-3", className)}>
      <div className="flex items-center gap-3">
        <AsideMenuButton />
        <h1 className={cn("text-2xl font-bold tracking-tight", titleClassName)}>{title}</h1>
      </div>
      <div className="flex items-center gap-2">
        {actions}
        <UserAvatarMenu />
        <NotificationBell />
      </div>
    </div>
  );
};

export default SectionHeader;
