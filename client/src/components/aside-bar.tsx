import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "./theme-provider";
import { isUserOnline } from "@/lib/helper";
import { Button } from "./ui/button";
import { Moon, Sun, Users, Settings, UserPlus, HelpCircle, LogOut, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  // DropdownMenuLabel,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import AvatarWithBadge from "./avatar-with-badge";
import { useNavigate } from "react-router-dom";


interface Props {
  onClose?: () => void;
}

const AsideBar = ({ onClose }: Props) => {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  const isOnline = isUserOnline(user?._id);

  const menuItems = [
    { icon: Users, label: "My Profile", action: () => navigate("/profile") },
    { icon: Users, label: "New Group", action: () => navigate("/groups?new=group") },
    { icon: Settings, label: "Settings", action: () => navigate("/settings") },
    { icon: UserPlus, label: "Invite Friends", action: () => navigate("/invite") },
    { icon: HelpCircle, label: "Website Features", action: () => navigate("/features") },
    { icon: HelpCircle, label: "Terms & Privacy", action: () => navigate("/legal") },
  ];

  return (
    <>
      {/* Mobile overlay: cover only the content area to the right of the sidebar so sidebar items stay clickable */}
      {onClose && (
        <div
          role="button"
          tabIndex={0}
          onClick={onClose}
          onKeyDown={(e) => (e.key === "Escape" ? onClose() : null)}
          className="fixed inset-y-0 left-80 right-0 bg-black/30 z-[9999] lg:hidden"
          aria-hidden="false"
        />
      )}

      <aside
        className="top-0 fixed inset-y-0 left-0 z-[10000000] h-svh shadow-sm w-80 overflow-y-auto bg-sidebar text-sidebar-foreground"
      >
        <div className="w-full h-full px-4 pt-6 pb-6 flex flex-col">
          {/* User Profile Section */}
          <div className="mb-6 pb-6 flex flex-col items-start border-b border-sidebar-border">
            {onClose && (
              <button
                type="button"
                aria-label="Close sidebar"
                onClick={onClose}
                className="ml-auto mb-2 p-1 rounded-md hover:bg-sidebar-accent/20 focus:outline-none focus:ring-2 focus:ring-sidebar-accent"
              >
                <X className="h-5 w-5" />
              </button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div role="button" className="flex items-center gap-3 w-full cursor-pointer group">
                  <AvatarWithBadge
                    name={user?.name || "Unknown"}
                    src={user?.avatar || ""}
                    isOnline={isOnline}
                    className="!bg-blue-400"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold truncate text-sidebar-foreground">
                      {user?.name || "Unknown"}
                    </h3>
                    <p className="text-sm truncate text-sidebar-foreground/70">
                      {user?.email || "+91 XXXX XXXXX"}
                    </p>
                  </div>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48 rounded-lg" align="start" style={{ zIndex: 10000001 }}>
                <DropdownMenuItem 
                  onClick={logout} 
                  className="cursor-pointer text-red-600 dark:text-red-500 font-bold focus:text-red-600 dark:focus:text-red-500"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Menu Items */}
          <div className="flex-1 space-y-1">
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <button
                  key={index}
                  onClick={() => {
                    item.action();
                    onClose?.();
                  }}
                  className="w-full flex items-center gap-4 px-4 py-3 rounded-lg transition-colors text-left text-sidebar-foreground hover:bg-sidebar-accent/10"
                >
                  <Icon className="h-6 w-6 flex-shrink-0 text-sidebar-accent-foreground" />
                  <span className="font-medium text-base">{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Theme Toggle */}
          <div className="mt-auto pt-4 flex items-center justify-between border-t border-sidebar-border">
            <span className="text-sm text-sidebar-foreground/70">Theme</span>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full border-sidebar-border bg-sidebar-accent/20 hover:bg-sidebar-accent/30"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            >
              <Sun
                className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90"
              />
              <Moon
                className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0"
              />
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default AsideBar;
