import { useState } from "react";
import { X, Search, MoreVertical } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import type { UserType } from "@/types/auth.type";
import { SubscriberActionDialog } from "./subscriber-action-dialog";

interface ViewSubscribersDialogProps {
  isOpen: boolean;
  onClose: () => void;
  subscribers: UserType[];
  admins: string[];
  currentUserId?: string;
  isAdmin?: boolean;
  onRemoveSubscriber: (userId: string) => void;
  onPromoteToAdmin: (userId: string) => void;
  onDemoteAdmin: (userId: string) => void;
}

export const ViewSubscribersDialog = ({
  isOpen,
  onClose,
  subscribers,
  admins,
  currentUserId,
  isAdmin = false,
  onRemoveSubscriber,
  onPromoteToAdmin,
  onDemoteAdmin,
}: ViewSubscribersDialogProps) => {
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const filteredSubscribers = subscribers.filter((s) =>
    s?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleActionClick = (userId: string) => {
    if (userId === currentUserId) return; // Can't perform actions on self
    setSelectedUserId(userId);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-[110]" onClick={onClose} />

      <div
        className={`fixed inset-x-4 top-1/2 -translate-y-1/2 z-[110] rounded-xl shadow-lg max-w-md mx-auto
          ${theme === "dark" ? "bg-slate-800" : "bg-white"}
          flex flex-col max-h-[70vh]`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">
            Subscribers ({subscribers.length})
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <input
              type="text"
              placeholder="Search by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                theme === "dark"
                  ? "bg-slate-900 border-slate-700"
                  : "bg-white border-gray-300"
              }`}
            />
          </div>
        </div>

        {/* Subscribers List */}
        <div className="flex-1 overflow-y-auto p-2 min-h-[200px] max-h-[400px]">
          {filteredSubscribers.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No subscribers found
            </div>
          ) : (
            <div className="space-y-1">
              {filteredSubscribers.map((subscriber) => {
                const isSubscriberAdmin = admins.includes(subscriber._id);
                const isCurrentUser = subscriber._id === currentUserId;

                return (
                  <div
                    key={subscriber._id}
                    className="group flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-semibold text-primary">
                          {subscriber.name[0].toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">
                          {subscriber.name}
                          {isCurrentUser && (
                            <span className="text-xs text-muted-foreground ml-2">
                              (You)
                            </span>
                          )}
                        </p>
                        {isSubscriberAdmin && (
                          <p className="text-xs text-muted-foreground">Admin</p>
                        )}
                      </div>
                    </div>
                    {isAdmin && !isCurrentUser && (
                      <button
                        onClick={() => handleActionClick(subscriber._id)}
                        className="p-2 hover:bg-muted-foreground/10 rounded-lg transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                      >
                        <MoreVertical className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t">
          <button
            onClick={onClose}
            className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
              theme === "dark"
                ? "bg-slate-700 hover:bg-slate-600"
                : "bg-gray-200 hover:bg-gray-300"
            }`}
          >
            Close
          </button>
        </div>
      </div>

      {/* Action Dialog */}
      {selectedUserId && (
        <SubscriberActionDialog
          isOpen={true}
          onClose={() => setSelectedUserId(null)}
          isAdmin={admins.includes(selectedUserId)}
          onPromote={() => {
            onPromoteToAdmin(selectedUserId);
            setSelectedUserId(null);
          }}
          onDemote={() => {
            onDemoteAdmin(selectedUserId);
            setSelectedUserId(null);
          }}
          onRemove={() => {
            onRemoveSubscriber(selectedUserId);
            setSelectedUserId(null);
          }}
        />
      )}
    </>
  );
};
