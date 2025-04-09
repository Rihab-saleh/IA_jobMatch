"use client";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger,
} from "../components/ui/tabs";
import { Button } from "../components/ui/button";
import { 
  Bell, 
  Briefcase, 
  MapPin, 
  Clock, 
  CheckCircle, 
  Trash2, 
  Settings,
} from "lucide-react";
import { notificationService } from "../services/notification-service";

const NotificationItem = ({ notification, onMarkAsRead, onDelete }) => {
  const getIcon = () => {
    switch (notification.type) {
      case "job_match":
        return <Briefcase className="h-5 w-5 text-purple-600" />;
      case "application_update":
        return <CheckCircle className="h-5 w-5 text-blue-600" />;
      case "profile_suggestion":
        return <Bell className="h-5 w-5 text-green-600" />;
      default:
        return <Bell className="h-5 w-5 text-gray-600" />;
    }
  };

  return (
    <div className={`bg-white rounded-lg border p-4 ${!notification.read ? "border-l-4 border-l-purple-700" : ""}`}>
      <div className="flex items-start gap-4">
        <div className="shrink-0 p-2 rounded-full bg-gray-100">
          {getIcon()}
        </div>

        <div className="flex-1">
          <div className="flex justify-between items-start">
            <h3 className="font-semibold">{notification.title}</h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">{notification.time}</span>
              {!notification.read && (
                <button
                  onClick={() => onMarkAsRead(notification.id)}
                  className="text-purple-700 hover:text-purple-900 text-xs font-medium"
                >
                  Mark as read
                </button>
              )}
              <button 
                onClick={() => onDelete(notification.id)} 
                className="text-gray-400 hover:text-red-500"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {notification.type === "job_match" && (
            <div>
              <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                <Briefcase className="h-4 w-4" />
                <span>{notification.company}</span>
                <span>•</span>
                <MapPin className="h-4 w-4" />
                <span>{notification.location}</span>
              </div>
              <div className="mt-2 flex items-center">
                <div className="bg-purple-100 text-purple-800 text-xs font-medium px-2 py-1 rounded-full">
                  {notification.matchPercentage}% Match
                </div>
                <div className="ml-auto">
                  <Link to={`/jobs/${notification.id}`}>
                    <Button size="sm" className="bg-purple-700 hover:bg-purple-800">
                      View Job
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}

          {notification.type === "application_update" && (
            <div>
              <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                <Briefcase className="h-4 w-4" />
                <span>{notification.company}</span>
                <span>•</span>
                <Clock className="h-4 w-4" />
                <span>Status: {notification.status}</span>
              </div>
              <div className="mt-2 flex items-center">
                <div className="ml-auto">
                  <Link to={`/applications/${notification.id}`}>
                    <Button size="sm" className="bg-purple-700 hover:bg-purple-800">
                      View Application
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}

          {notification.type === "profile_suggestion" && (
            <div>
              <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
              <div className="mt-2 flex items-center">
                <div className="ml-auto">
                  <Link to="/profile">
                    <Button size="sm" className="bg-purple-700 hover:bg-purple-800">
                      Update Profile
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await notificationService.getNotifications(); // API call to fetch notifications
        setNotifications(response);
      } catch (error) {
        console.error("Error fetching notifications:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const markAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id); // API call to mark notification as read
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === id ? { ...notification, read: true } : notification
        )
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await notificationService.deleteNotification(id); // API call to delete notification
      setNotifications((prev) => prev.filter((notification) => notification.id !== id));
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const unreadCount = notifications.filter((notification) => !notification.read).length;

  const EmptyState = ({ icon, title, message }) => (
    <div className="text-center py-12">
      {icon}
      <h3 className="text-lg font-medium text-gray-700 mb-2">{title}</h3>
      <p className="text-gray-500">{message}</p>
    </div>
  );

  if (loading) {
    return <div>Loading notifications...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Notifications</h1>
          </div>
          <Link to="/settings">
            <Button variant="outline" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </Button>
          </Link>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="all" className="relative">
              All
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="job_matches">Job Matches</TabsTrigger>
            <TabsTrigger value="applications">Applications</TabsTrigger>
            <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={markAsRead}
                  onDelete={deleteNotification}
                />
              ))
            ) : (
              <EmptyState 
                icon={<Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />}
                title="No notifications"
                message="You don't have any notifications at the moment."
              />
            )}
          </TabsContent>

          <TabsContent value="job_matches" className="space-y-4">
            {notifications.filter((n) => n.type === "job_match").length > 0 ? (
              notifications
                .filter((n) => n.type === "job_match")
                .map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={markAsRead}
                    onDelete={deleteNotification}
                  />
                ))
            ) : (
              <EmptyState 
                icon={<Briefcase className="h-12 w-12 text-gray-300 mx-auto mb-4" />}
                title="No job matches"
                message="You don't have any job match notifications at the moment."
              />
            )}
          </TabsContent>

          <TabsContent value="applications" className="space-y-4">
            {notifications.filter((n) => n.type === "application_update").length > 0 ? (
              notifications
                .filter((n) => n.type === "application_update")
                .map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={markAsRead}
                    onDelete={deleteNotification}
                  />
                ))
            ) : (
              <EmptyState 
                icon={<CheckCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />}
                title="No application updates"
                message="You don't have any application notifications at the moment."
              />
            )}
          </TabsContent>

          <TabsContent value="suggestions" className="space-y-4">
            {notifications.filter((n) => n.type === "profile_suggestion").length > 0 ? (
              notifications
                .filter((n) => n.type === "profile_suggestion")
                .map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={markAsRead}
                    onDelete={deleteNotification}
                  />
                ))
            ) : (
              <EmptyState 
                icon={<Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />}
                title="No suggestions"
                message="You don't have any profile suggestions at the moment."
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}