import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { generateDefaultAvatar, getInitials } from "@/lib/helper";

const UserAvatarMenu = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  if (!user) return null;

  // Auto-load profile picture for users without avatar
  const avatarUrl = user.avatar || generateDefaultAvatar(user.name);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <button className="relative rounded-full transition hover:ring-2 hover:ring-primary/50">
          <img
            src={avatarUrl}
            alt={user.name}
            className="w-9 h-9 rounded-full object-cover"
            onError={(e) => {
              // Fallback to initials if image fails to load
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const fallback = target.nextElementSibling as HTMLElement;
              if (fallback) fallback.style.display = 'flex';
            }}
          />
          <div className="w-9 h-9 rounded-full bg-primary/10 items-center justify-center hidden">
            <span className="text-sm font-semibold text-primary">
              {getInitials(user.name)}
            </span>
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 z-50">
        <div 
          className="px-3 py-2 border-b border-base-300 cursor-pointer hover:bg-base-200 rounded-t"
          onClick={() => {
            navigate("/profile");
            setIsOpen(false);
          }}
        >
          <p className="font-semibold text-sm">{user.name}</p>
          {user.username && (
            <p className="text-xs text-primary/70">@{user.username}</p>
          )}
          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
        </div>
        <DropdownMenuItem
          onClick={() => {
            logout();
            setIsOpen(false);
          }}
          className="cursor-pointer text-destructive focus:text-destructive"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserAvatarMenu;
