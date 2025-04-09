"use client";

import { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import { Switch } from "../components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card";
import { Label } from "../components/ui/label";
import { Bell, Lock, CreditCard, LogOut, Trash2 } from "lucide-react";
import { notificationService } from "../services/notification-service";

export default function SettingsPage() {
  const [notificationSettings, setNotificationSettings] = useState({
    emailAlerts: false,
    jobRecommendations: false,
    applicationUpdates: false,
  });

  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: "public",
    showEmail: false,
    showPhone: false,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch notification settings when the component loads
  useEffect(() => {
    const fetchNotificationSettings = async () => {
      try {
        const userId = "currentUserId"; // Replace with actual user ID from auth context or state
        const settings = await notificationService.getSettings(userId);
        setNotificationSettings(settings);
      } catch (error) {
        console.error("Error fetching notification settings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotificationSettings();
  }, []);

  // Handle toggling notification settings
  const handleNotificationToggle = (key) => {
    setNotificationSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Handle toggling privacy settings
  const handlePrivacyToggle = (key) => {
    setPrivacySettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Save updated notification settings
  const saveNotificationSettings = async () => {
    try {
      setSaving(true);
      const userId = "currentUserId"; // Replace with actual user ID from auth context or state
      await notificationService.updateSettings(userId, notificationSettings);
      alert("Notification settings updated successfully!");
    } catch (error) {
      console.error("Error updating notification settings:", error);
      alert("Failed to update notification settings.");
    } finally {
      setSaving(false);
    }
  };

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

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Manage how and when you receive notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {loading ? (
                  <p>Loading notification settings...</p>
                ) : (
                  <>
                    <div className="space-y-4">
                      <h3 className="font-medium">Email Notifications</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="emailAlerts" className="font-normal">
                              Email Alerts
                            </Label>
                            <p className="text-sm text-gray-500">Receive important account notifications via email</p>
                          </div>
                          <Switch
                            id="emailAlerts"
                            checked={notificationSettings.emailAlerts}
                            onCheckedChange={() => handleNotificationToggle("emailAlerts")}
                            className="bg-gray-300 data-[state=checked]:bg-purple-700"
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="jobRecommendations" className="font-normal">
                              Job Recommendations
                            </Label>
                            <p className="text-sm text-gray-500">
                              Receive personalized job recommendations based on your profile
                            </p>
                          </div>
                          <Switch
                            id="jobRecommendations"
                            checked={notificationSettings.jobRecommendations}
                            onCheckedChange={() => handleNotificationToggle("jobRecommendations")}
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
                  </>
                )}
              </CardContent>
              <CardFooter>
                <Button
                  className="bg-purple-700 hover:bg-purple-800"
                  onClick={saveNotificationSettings}
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Preferences"}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Privacy Tab */}
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
            </Card>
          </TabsContent>

          {/* Account Tab */}
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
  );
}