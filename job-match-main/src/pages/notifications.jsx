import { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import { Bell, Briefcase, Trash2, Mail, AlertCircle, User, CheckCircle } from "lucide-react";
import { notificationService } from "../services/notification-service";
import { useAuth } from "../contexts/auth-context";
import { Skeleton } from "../components/ui/skeleton";

const NotificationItem = ({ notification, onMarkAsRead, onDelete }) => {
  const getIcon = () => {
    const iconMap = {
      jobAlert: <Briefcase className="h-5 w-5 text-blue-600" />,
      application_update: <CheckCircle className="h-5 w-5 text-green-600" />,
      profile_suggestion: <User className="h-5 w-5 text-purple-600" />,
      system_alert: <AlertCircle className="h-5 w-5 text-orange-600" />,
      message: <Mail className="h-5 w-5 text-cyan-600" />,
      default: <Bell className="h-5 w-5 text-gray-600" />,
    };
    return iconMap[notification.notificationType] || iconMap.default;
  };

  const handleAction = () => {
    if (!notification.read) {
      onMarkAsRead(notification.id); // Mark notification as read when clicked
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div
      className={`bg-white rounded-lg border p-4 transition-all hover:shadow-md ${
        !notification.read ? "border-l-4 border-l-blue-700 bg-blue-50" : "border-gray-200"
      }`}
    >
      <div className="flex items-start gap-4">
        <div 
          className="shrink-0 p-2 rounded-full bg-gray-100 cursor-pointer"
          onClick={handleAction}
        >
          {getIcon()}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start gap-2">
            <div 
              className="font-semibold text-gray-900 hover:text-blue-700 truncate cursor-pointer"
              onClick={handleAction}
            >
              {notification.jobTitle || "Notification"}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-gray-500 whitespace-nowrap">
                {formatDate(notification.createdAt)}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(notification.id);
                }}
                className="text-gray-400 hover:text-red-500 transition-colors"
                aria-label="Delete notification"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          <p className="mt-1 text-sm text-gray-600 break-words">
            <span className="font-medium">{notification.jobCompany}</span>
            {notification.jobMatchPercentage && (
              <span className="ml-2 text-gray-500">
                ({notification.jobMatchPercentage}% match)
              </span>
            )}
          </p>

          {notification.jobUrl && (
            <a
              href={notification.jobUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline text-sm"
            >
              View Job
            </a>
          )}

          <p className="mt-1 text-sm text-gray-600 break-words">
            {notification.content || "You have a new notification"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      try {
        setLoading(true);
        const response = await notificationService.getNotifications();
        console.log("Notifications Data:", response.notifications); // Debugging
        setNotifications(response.notifications || []);
        setHasUnread(response.notifications?.some(n => !n.read) || false);
        setError(null);
      } catch (err) {
        console.error("Error fetching notifications:", err);
        setError("Failed to load notifications. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [user]);

  const markAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
      setHasUnread(notifications.some(n => !n.read && n.id !== id));
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setHasUnread(false);
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await notificationService.deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      setHasUnread(notifications.some(n => !n.read && n.id !== id));
    } catch (err) {
      console.error("Error deleting notification:", err);
    }
  };

  const deleteAllNotifications = async () => {
    try {
      await notificationService.deleteAllNotifications();
      setNotifications([]);
      setHasUnread(false);
    } catch (err) {
      console.error("Error deleting all notifications:", err);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="flex justify-between items-center mb-6">
            <Skeleton className="h-8 w-48" />
            <div className="flex gap-2">
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-9 w-24" />
            </div>
          </div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="p-4 border rounded-lg space-y-3">
              <div className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto text-center py-12">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">
            Error loading notifications
          </h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <Button 
            onClick={() => window.location.reload()} 
            className="bg-blue-700 hover:bg-blue-800"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Notifications
          </h1>
          <div className="flex gap-2">
            {hasUnread && (
              <Button
                variant="outline"
                onClick={markAllAsRead}
                className="text-blue-700 border-blue-700 hover:bg-blue-50"
              >
                Mark all as read
              </Button>
            )}
            {notifications.length > 0 && (
              <Button
                variant="outline"
                onClick={deleteAllNotifications}
                className="text-red-700 border-red-700 hover:bg-red-50"
              >
                Clear all
              </Button>
            )}
          </div>
        </div>

        {notifications.length > 0 ? (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={markAsRead}
                onDelete={deleteNotification}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-1">
              No notifications yet
            </h3>
            <p className="text-gray-500">
              We'll notify you when there's something new.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}