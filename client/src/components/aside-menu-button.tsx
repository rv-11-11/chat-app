import { useState } from "react";
import { Menu } from "lucide-react";
import AsideBar from "./aside-bar";
import { cn } from "@/lib/utils";

interface AsideMenuButtonProps {
  className?: string;
}

const AsideMenuButton = ({ className }: AsideMenuButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-label="Toggle navigation menu"
        onClick={() => setIsOpen(true)}
        className={cn("p-1 rounded-md hover:bg-muted", className)}
      >
        <Menu className="h-5 w-5" />
      </button>
      {isOpen && <AsideBar onClose={() => setIsOpen(false)} />}
    </>
  );
};

export default AsideMenuButton;
