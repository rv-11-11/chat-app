import { useState } from "react";
import { useSettings } from "@/hooks/use-settings";
import { Bell, Trash2, MessageSquare, AlertCircle, Info, X } from "lucide-react";

const NotificationBell = () => {
  const { notifications, notificationsEnabled, markNotificationAsRead, clearNotification, clearAllNotifications } =
    useSettings();
  const [isOpen, setIsOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "message":
        return <MessageSquare className="w-4 h-4 text-blue-500" />;
      case "update":
        return <AlertCircle className="w-4 h-4 text-purple-500" />;
      case "system":
        return <Info className="w-4 h-4 text-green-500" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  if (!notificationsEnabled) {
    return null;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg transition hover:bg-base-200"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full sm:translate-x-1/2 sm:-translate-y-1/2">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-[99998]"
            onClick={() => setIsOpen(false)}
          />
          <div className="fixed left-0 right-0 bottom-0 z-[99999] rounded-t-lg shadow-xl border border-base-300 bg-base-100 max-h-[60vh] overflow-hidden sm:absolute sm:top-12 sm:right-0 sm:left-auto sm:bottom-auto sm:w-96 sm:max-h-96 sm:rounded-lg">
            <div className="sticky top-0 flex items-center justify-between p-4 border-b border-base-300 bg-base-200">
              <h3 className="font-semibold">Notifications</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded hover:bg-base-300 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto max-h-[55vh] sm:max-h-80">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <Bell className="w-8 h-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No notifications</p>
                </div>
              ) : (
                <div className="divide-y divide-base-300">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => markNotificationAsRead(notification.id)}
                      className={`p-3 cursor-pointer transition ${
                        notification.read
                          ? "hover:bg-base-200"
                          : "bg-primary/5 hover:bg-primary/10"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {getNotificationIcon(notification.type)}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm truncate">
                            {notification.title}
                          </h4>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground/80 mt-1">
                            {new Date(notification.timestamp).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            clearNotification(notification.id);
                          }}
                          className="p-1 rounded transition flex-shrink-0 hover:bg-base-200"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {notifications.length > 0 && (
              <div className="sticky bottom-0 p-2 border-t border-base-300 bg-base-200">
                <button
                  onClick={() => {
                    clearAllNotifications();
                    setIsOpen(false);
                  }}
                  className="w-full px-3 py-2 text-sm rounded transition bg-base-300 hover:bg-base-400 text-base-content"
                >
                  Clear All
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationBell;
