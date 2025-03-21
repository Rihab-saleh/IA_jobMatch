"use client"

import { useState } from "react"
import { Link } from "react-router-dom"
import { Button } from "../components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import { Switch } from "../components/ui/switch"
import { Bell, Briefcase, MapPin, Clock, CheckCircle, Trash2, Settings } from "lucide-react"

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: "job_match",
      title: "New Job Match: Senior Frontend Developer",
      company: "Google Inc.",
      location: "New York, USA",
      matchPercentage: 95,
      time: "2 hours ago",
      read: false,
    },
    {
      id: 2,
      type: "application_update",
      title: "Application Status Update",
      company: "Microsoft",
      status: "Interview Scheduled",
      time: "1 day ago",
      read: true,
    },
    {
      id: 3,
      type: "job_match",
      title: "New Job Match: React Developer",
      company: "Facebook",
      location: "Remote",
      matchPercentage: 88,
      time: "2 days ago",
      read: true,
    },
    {
      id: 4,
      type: "profile_suggestion",
      title: "Profile Suggestion",
      message: "Adding JavaScript to your skills could match you with 15 more jobs",
      time: "3 days ago",
      read: false,
    },
    {
      id: 5,
      type: "application_update",
      title: "Application Status Update",
      company: "Amazon",
      status: "Application Viewed",
      time: "4 days ago",
      read: true,
    },
  ])

  const markAsRead = (id) => {
    setNotifications(
      notifications.map((notification) => (notification.id === id ? { ...notification, read: true } : notification)),
    )
  }

  const deleteNotification = (id) => {
    setNotifications(notifications.filter((notification) => notification.id !== id))
  }

  const unreadCount = notifications.filter((notification) => !notification.read).length

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Notifications</h1>
            <p className="text-gray-600">Stay updated with job matches and application status</p>
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
              <div className="text-center py-12">
                <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-700 mb-2">No notifications</h3>
                <p className="text-gray-500">You don't have any notifications at the moment.</p>
              </div>
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
              <div className="text-center py-12">
                <Briefcase className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-700 mb-2">No job matches</h3>
                <p className="text-gray-500">You don't have any job match notifications at the moment.</p>
              </div>
            )}
          </TabsContent>

          {/* Other tab contents would go here */}
        </Tabs>

        <div className="mt-8 bg-white rounded-lg border p-6">
          <h2 className="text-xl font-semibold mb-4">Notification Settings</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Email Notifications</h3>
                <p className="text-sm text-gray-600">Receive job recommendations via email</p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">SMS Notifications</h3>
                <p className="text-sm text-gray-600">Receive job alerts via SMS</p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Push Notifications</h3>
                <p className="text-sm text-gray-600">Receive notifications in your browser</p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">WhatsApp Notifications</h3>
                <p className="text-sm text-gray-600">Receive job alerts via WhatsApp</p>
              </div>
              <Switch />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function NotificationItem({ notification, onMarkAsRead, onDelete }) {
  return (
    <div className={`bg-white rounded-lg border p-4 ${!notification.read ? "border-l-4 border-l-purple-700" : ""}`}>
      <div className="flex items-start gap-4">
        <div className="shrink-0">
          {notification.type === "job_match" && (
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-700">
              <Briefcase className="h-5 w-5" />
            </div>
          )}
          {notification.type === "application_update" && (
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700">
              <CheckCircle className="h-5 w-5" />
            </div>
          )}
          {notification.type === "profile_suggestion" && (
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700">
              <Bell className="h-5 w-5" />
            </div>
          )}
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
              <button onClick={() => onDelete(notification.id)} className="text-gray-400 hover:text-red-500">
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
  )
}

