;
import { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import { Bell, Briefcase, MapPin, Clock, CheckCircle, Trash2, Mail, AlertCircle, User } from "lucide-react";
import { notificationService } from "../services/notification-service";
import { Link } from "react-router-dom";

const NotificationItem = ({ notification, onMarkAsRead, onDelete }) => {
  const getIcon = () => {
    const iconMap = {
      job_match: <Briefcase className="h-5 w-5 text-blue-600" />,
      application_update: <CheckCircle className="h-5 w-5 text-blue-600" />,
      profile_suggestion: <User className="h-5 w-5 text-green-600" />,
      system_alert: <AlertCircle className="h-5 w-5 text-orange-600" />,
      message: <Mail className="h-5 w-5 text-cyan-600" />,
      default: <Bell className="h-5 w-5 text-gray-600" />,
    };
    return iconMap[notification.type] || iconMap.default;
  };

  const handleAction = () => {
    if (!notification.read) {
      onMarkAsRead(notification._id);
    }
  };

  // Get the appropriate link URL based on notification type
  const getActionLink = () => {
    switch (notification.type) {
      case "job_match":
        return `/jobs/${notification.jobId}`;
      case "application_update":
        return `/applications/${notification.applicationId}`;
      case "profile_suggestion":
        return "/profile/edit";
      default:
        return "#";
    }
  };

  return (
    <div
      className={`bg-white rounded-lg border p-4 transition-all hover:shadow-md ${
        !notification.read ? "border-l-4 border-l-blue-700 bg-blue-50" : ""
      }`}
    >
      <div className="flex items-start gap-4">
        <Link
          to={getActionLink()}
          className="shrink-0 p-2 rounded-full bg-gray-100 hover:bg-gray-200 cursor-pointer"
          onClick={handleAction}
        >
          {getIcon()}
        </Link>

        <div className="flex-1">
          <div className="flex justify-between items-start">
            <Link
              to={getActionLink()}
              className="font-semibold cursor-pointer hover:text-blue-700"
              onClick={handleAction}
            >
              {notification.title}
            </Link>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">
                {new Date(notification.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              <button
                onClick={() => onDelete(notification._id)}
                className="text-gray-400 hover:text-red-500 transition-colors"
                aria-label="Delete notification"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mt-1">
            <p className="text-sm text-gray-600">{notification.message}</p>

            {notification.type === "job_match" && (
              <div className="mt-2">
                <div className="flex items-center gap-2 text-sm">
                  <Briefcase className="h-4 w-4" />
                  <span>{notification.company}</span>
                  <span>•</span>
                  <MapPin className="h-4 w-4" />
                  <span>{notification.location}</span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <div className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                    {notification.matchPercentage}% Match
                  </div>
                  <Link to={getActionLink()}>
                    <Button size="sm" className="bg-blue-700 hover:bg-blue-800" onClick={handleAction}>
                      View Job
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            {notification.type === "application_update" && (
              <div className="mt-2">
                <div className="flex items-center gap-2 text-sm">
                  <Briefcase className="h-4 w-4" />
                  <span>{notification.jobTitle}</span>
                  <span>•</span>
                  <Clock className="h-4 w-4" />
                  <span>Status: {notification.status}</span>
                </div>
                <div className="mt-2 flex justify-end">
                  <Link to={getActionLink()}>
                    <Button size="sm" className="bg-blue-700 hover:bg-blue-800" onClick={handleAction}>
                      View Application
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            {notification.type === "profile_suggestion" && (
              <div className="mt-2 flex justify-end">
                <Link to={getActionLink()}>
                  <Button size="sm" className="bg-blue-700 hover:bg-blue-800" onClick={handleAction}>
                    Update Profile
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        const data = await notificationService.getNotifications();
        setNotifications(data || []);
        setError(null);
      } catch (err) {
        console.error("Error fetching notifications:", err);
        setError("Failed to load notifications. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const markAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await notificationService.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
    } catch (err) {
      console.error("Error deleting notification:", err);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-gray-200 rounded w-1/3"></div>
            <div className="h-6 bg-gray-200 rounded w-1/2"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-100 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto text-center py-12">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">Error loading notifications</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()} className="bg-blue-700 hover:bg-blue-800">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Notifications</h1>
        {notifications.length > 0 ? (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification._id}
                notification={notification}
                onMarkAsRead={markAsRead}
                onDelete={deleteNotification}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No notifications available.</p>
          </div>
        )}
      </div>
    </div>
  );
}