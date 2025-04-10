"use client"

import { useState, useEffect } from "react"
import { Button } from "../components/ui/button"
import { Switch } from "../components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card"
import { Label } from "../components/ui/label"
import { Bell, Lock, CreditCard, LogOut, Trash2, AlertCircle } from "lucide-react"
import { notificationService } from "../services/notification-service"

export default function SettingsPage() {
  const [userId, setUserId] = useState(null)
  const [notificationSettings, setNotificationSettings] = useState({
    email: false,
    jobAlerts: false,
    applicationUpdates: false,
    frequency: "daily",
  })

  const [userDetails, setUserDetails] = useState({
    userEmail: "",
    userName: "",
  })

  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: "public",
    showEmail: false,
    showPhone: false,
  })

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const isAuthenticated = await notificationService.checkAuth()
        if (!isAuthenticated) {
          window.location.href = "/login?redirect=settings"
          return
        }

        // Retrieve the user ID from the authentication context or token
        const token = localStorage.getItem("auth_token")
        const decoded = JSON.parse(atob(token.split(".")[1])) // Decode the JWT
        setUserId(decoded.id) // Use the actual user ID from the token

        fetchNotificationSettings(decoded.id) // Pass the correct user ID
      } catch (error) {
        console.error("Error checking authentication:", error)
        setError("Authentication error. Please try logging in again.")
        setLoading(false)
      }
    }

    const fetchNotificationSettings = async (userId) => {
      try {
        setLoading(true)
        const settings = await notificationService.getSettings(userId)
        
        setNotificationSettings({
          email: settings.email || false,
          jobAlerts: settings.jobAlerts || false,
          applicationUpdates: settings.applicationUpdates || false,
          frequency: settings.frequency || "daily",
          userEmail: settings.userEmail || "",
          userName: settings.userName || ""
        })
    
        setError(null)
      } catch (error) {
        console.error("Error fetching notification settings:", error)
        setError("Failed to load notification settings. Please try again.")
      } finally {
        setLoading(false)
      }
    }
    checkAuth()
  }, [])

  const handleNotificationToggle = (key) => {
    setNotificationSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const handlePrivacyToggle = (key) => {
    setPrivacySettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const handleFrequencyChange = (e) => {
    setNotificationSettings((prev) => ({
      ...prev,
      frequency: e.target.value,
    }))
  }

  const saveNotificationSettings = async () => {
    if (!userId) return

    try {
      setSaving(true)
      await notificationService.updateSettings(userId, notificationSettings)
      // Show success message
      const successMessage = document.getElementById("success-message")
      if (successMessage) {
        successMessage.classList.remove("hidden")
        setTimeout(() => {
          successMessage.classList.add("hidden")
        }, 3000)
      }
    } catch (error) {
      console.error("Error updating notification settings:", error)
      // Show error message
      const errorMessage = document.getElementById("error-message")
      if (errorMessage) {
        errorMessage.classList.remove("hidden")
        setTimeout(() => {
          errorMessage.classList.add("hidden")
        }, 3000)
      }
    } finally {
      setSaving(false)
    }
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto text-center py-12">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">Error</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()} className="bg-purple-700 hover:bg-purple-800">
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-gray-600 mb-8">Manage your account settings and preferences</p>

        <Tabs defaultValue="notifications" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="privacy" className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              <span className="hidden sm:inline">Privacy</span>
            </TabsTrigger>
            <TabsTrigger value="account" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              <span className="hidden sm:inline">Account</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Manage how and when you receive notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div
                  id="success-message"
                  className="hidden bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4"
                >
                  <span className="block sm:inline">Your notification preferences have been saved.</span>
                </div>
                <div
                  id="error-message"
                  className="hidden bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
                >
                  <span className="block sm:inline">Failed to update notification settings. Please try again.</span>
                </div>
                {loading ? (
                  <div className="animate-pulse space-y-4">
                    <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-12 bg-gray-200 rounded"></div>
                    <div className="h-12 bg-gray-200 rounded"></div>
                    <div className="h-12 bg-gray-200 rounded"></div>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4">
                      <h3 className="font-medium">Email Notifications</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="email" className="font-normal">
                              Email Alerts
                            </Label>
                            <p className="text-sm text-gray-500">Receive important account notifications via email</p>
                          </div>
                          <Switch
                            id="email"
                            checked={notificationSettings.email}
                            onCheckedChange={() => handleNotificationToggle("email")}
                            className="bg-gray-300 data-[state=checked]:bg-purple-700"
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="jobAlerts" className="font-normal">
                              Job Recommendations
                            </Label>
                            <p className="text-sm text-gray-500">
                              Receive personalized job recommendations based on your profile
                            </p>
                          </div>
                          <Switch
                            id="jobAlerts"
                            checked={notificationSettings.jobAlerts}
                            onCheckedChange={() => handleNotificationToggle("jobAlerts")}
                            className="bg-gray-300 data-[state=checked]:bg-purple-700"
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="applicationUpdates" className="font-normal">
                              Application Updates
                            </Label>
                            <p className="text-sm text-gray-500">Receive updates about your job applications</p>
                          </div>
                          <Switch
                            id="applicationUpdates"
                            checked={notificationSettings.applicationUpdates}
                            onCheckedChange={() => handleNotificationToggle("applicationUpdates")}
                            className="bg-gray-300 data-[state=checked]:bg-purple-700"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-medium">Notification Frequency</h3>
                      <div className="space-y-2">
                        <Label htmlFor="frequency">How often would you like to receive notifications?</Label>
                        <select
                          id="frequency"
                          className="w-full border rounded-md p-2"
                          value={notificationSettings.frequency}
                          onChange={handleFrequencyChange}
                        >
                          <option value="immediately">Immediately</option>
                          <option value="daily">Daily Digest</option>
                          <option value="weekly">Weekly Digest</option>
                        </select>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
              <CardFooter>
                <Button
                  className="bg-purple-700 hover:bg-purple-800"
                  onClick={saveNotificationSettings}
                  disabled={saving || loading}
                >
                  {saving ? "Saving..." : "Save Preferences"}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="privacy">
            <Card>
              <CardHeader>
                <CardTitle>Privacy Settings</CardTitle>
                <CardDescription>Control who can see your profile and how your information is used</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-medium">Profile Visibility</h3>
                  <div className="space-y-2">
                    <Label htmlFor="profileVisibility">Who can see your profile</Label>
                    <select
                      id="profileVisibility"
                      className="w-full border rounded-md p-2"
                      value={privacySettings.profileVisibility}
                      onChange={(e) =>
                        setPrivacySettings((prev) => ({
                          ...prev,
                          profileVisibility: e.target.value,
                        }))
                      }
                    >
                      <option value="public">Public - Anyone can view</option>
                      <option value="recruiters">Recruiters Only</option>
                      <option value="private">Private - Only you can view</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="font-medium">Contact Information</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="showEmail" className="font-normal">
                          Show Email Address
                        </Label>
                        <p className="text-sm text-gray-500">Allow others to see your email address</p>
                      </div>
                      <Switch
                        id="showEmail"
                        checked={privacySettings.showEmail}
                        onCheckedChange={() => handlePrivacyToggle("showEmail")}
                        className="bg-gray-300 data-[state=checked]:bg-purple-700"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="showPhone" className="font-normal">
                          Show Phone Number
                        </Label>
                        <p className="text-sm text-gray-500">Allow others to see your phone number</p>
                      </div>
                      <Switch
                        id="showPhone"
                        checked={privacySettings.showPhone}
                        onCheckedChange={() => handlePrivacyToggle("showPhone")}
                        className="bg-gray-300 data-[state=checked]:bg-purple-700"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="bg-purple-700 hover:bg-purple-800">Save Privacy Settings</Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="account">
            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
                <CardDescription>Manage your account settings and subscription</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-medium text-red-500">Danger Zone</h3>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button variant="outline" className="border-red-200 text-red-500 hover:bg-red-50">
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out of All Devices
                    </Button>
                    <Button variant="outline" className="border-red-200 text-red-500 hover:bg-red-50">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Account
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}