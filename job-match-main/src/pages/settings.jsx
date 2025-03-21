"use client"

import { useState } from "react"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Textarea } from "../components/ui/textarea"
import { Switch } from "../components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card"
import { Label } from "../components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
import { Bell, Lock, User, CreditCard, LogOut, Trash2 } from "lucide-react"

export default function SettingsPage() {
  const [profileData, setProfileData] = useState({
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@example.com",
    phone: "+1 (555) 123-4567",
    bio: "Senior Frontend Developer with 5+ years of experience in building responsive web applications.",
    location: "New York, USA",
    website: "https://johndoe.com",
    github: "github.com/johndoe",
    linkedin: "linkedin.com/in/johndoe",
  })

  const [notificationSettings, setNotificationSettings] = useState({
    emailAlerts: true,
    jobRecommendations: true,
    applicationUpdates: true,
    marketingEmails: false,
    smsAlerts: true,
    browserNotifications: true,
  })

  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: "public",
    showEmail: false,
    showPhone: false,
    allowMessaging: true,
    allowRecruiters: true,
  })

  const handleProfileChange = (e) => {
    const { name, value } = e.target
    setProfileData({
      ...profileData,
      [name]: value,
    })
  }

  const handleNotificationToggle = (setting) => {
    setNotificationSettings({
      ...notificationSettings,
      [setting]: !notificationSettings[setting],
    })
  }

  const handlePrivacyChange = (setting, value) => {
    setPrivacySettings({
      ...privacySettings,
      [setting]: value,
    })
  }

  const handleSaveProfile = (e) => {
    e.preventDefault()
    // Here you would typically send the updated profile data to your API
    console.log("Profile data saved:", profileData)
    // Show success message or handle errors
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-gray-600 mb-8">Manage your account settings and preferences</p>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
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

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your personal information and how it appears on your profile</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveProfile}>
                  <div className="space-y-6">
                    {/* Profile Picture */}
                    <div className="flex flex-col items-center sm:flex-row sm:items-start gap-6">
                      <div className="relative">
                        <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                          <img
                            src="/placeholder.svg?height=96&width=96"
                            alt="Profile"
                            width={96}
                            height={96}
                            className="object-cover"
                          />
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="absolute bottom-0 right-0 rounded-full w-8 h-8 p-0"
                        >
                          <span className="sr-only">Change Avatar</span>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                          </svg>
                        </Button>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium mb-1">Profile Picture</h3>
                        <p className="text-sm text-gray-500 mb-3">
                          Upload a clear, professional photo to help recruiters recognize you
                        </p>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            Upload New
                          </Button>
                          <Button variant="outline" size="sm" className="text-red-500">
                            Remove
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Name */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          name="firstName"
                          value={profileData.firstName}
                          onChange={handleProfileChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          name="lastName"
                          value={profileData.lastName}
                          onChange={handleProfileChange}
                        />
                      </div>
                    </div>

                    {/* Contact Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={profileData.email}
                          onChange={handleProfileChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input id="phone" name="phone" value={profileData.phone} onChange={handleProfileChange} />
                      </div>
                    </div>

                    {/* Bio */}
                    <div className="space-y-2">
                      <Label htmlFor="bio">Professional Bio</Label>
                      <Textarea id="bio" name="bio" rows={4} value={profileData.bio} onChange={handleProfileChange} />
                      <p className="text-sm text-gray-500">
                        Write a short introduction about yourself, your skills, and experience.
                      </p>
                    </div>

                    {/* Location */}
                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        name="location"
                        value={profileData.location}
                        onChange={handleProfileChange}
                      />
                    </div>

                    {/* Social Links */}
                    <div className="space-y-4">
                      <h3 className="font-medium">Social Links</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="website">Personal Website</Label>
                          <Input
                            id="website"
                            name="website"
                            value={profileData.website}
                            onChange={handleProfileChange}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="github">GitHub</Label>
                          <Input id="github" name="github" value={profileData.github} onChange={handleProfileChange} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="linkedin">LinkedIn</Label>
                        <Input
                          id="linkedin"
                          name="linkedin"
                          value={profileData.linkedin}
                          onChange={handleProfileChange}
                        />
                      </div>
                    </div>
                  </div>
                </form>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline">Cancel</Button>
                <Button className="bg-purple-700 hover:bg-purple-800" onClick={handleSaveProfile}>
                  Save Changes
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Manage how and when you receive notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
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
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="marketingEmails" className="font-normal">
                          Marketing Emails
                        </Label>
                        <p className="text-sm text-gray-500">Receive promotional emails and newsletters</p>
                      </div>
                      <Switch
                        id="marketingEmails"
                        checked={notificationSettings.marketingEmails}
                        onCheckedChange={() => handleNotificationToggle("marketingEmails")}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium">Other Notifications</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="smsAlerts" className="font-normal">
                          SMS Alerts
                        </Label>
                        <p className="text-sm text-gray-500">Receive important notifications via SMS</p>
                      </div>
                      <Switch
                        id="smsAlerts"
                        checked={notificationSettings.smsAlerts}
                        onCheckedChange={() => handleNotificationToggle("smsAlerts")}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="browserNotifications" className="font-normal">
                          Browser Notifications
                        </Label>
                        <p className="text-sm text-gray-500">Receive notifications in your browser</p>
                      </div>
                      <Switch
                        id="browserNotifications"
                        checked={notificationSettings.browserNotifications}
                        onCheckedChange={() => handleNotificationToggle("browserNotifications")}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="bg-purple-700 hover:bg-purple-800">Save Preferences</Button>
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
                    <Select
                      value={privacySettings.profileVisibility}
                      onValueChange={(value) => handlePrivacyChange("profileVisibility", value)}
                    >
                      <SelectTrigger id="profileVisibility">
                        <SelectValue placeholder="Select visibility" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Public - Anyone can view</SelectItem>
                        <SelectItem value="recruiters">Recruiters Only</SelectItem>
                        <SelectItem value="private">Private - Only you can view</SelectItem>
                      </SelectContent>
                    </Select>
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
                        onCheckedChange={(checked) => handlePrivacyChange("showEmail", checked)}
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
                        onCheckedChange={(checked) => handlePrivacyChange("showPhone", checked)}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium">Communication</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="allowMessaging" className="font-normal">
                          Allow Messaging
                        </Label>
                        <p className="text-sm text-gray-500">Allow others to send you messages</p>
                      </div>
                      <Switch
                        id="allowMessaging"
                        checked={privacySettings.allowMessaging}
                        onCheckedChange={(checked) => handlePrivacyChange("allowMessaging", checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="allowRecruiters" className="font-normal">
                          Allow Recruiters to Contact You
                        </Label>
                        <p className="text-sm text-gray-500">Allow recruiters to contact you about job opportunities</p>
                      </div>
                      <Switch
                        id="allowRecruiters"
                        checked={privacySettings.allowRecruiters}
                        onCheckedChange={(checked) => handlePrivacyChange("allowRecruiters", checked)}
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

          {/* Account Tab */}
          <TabsContent value="account">
            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
                <CardDescription>Manage your account settings and subscription</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-medium">Account Information</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <div>
                        <p className="font-medium">Account Type</p>
                        <p className="text-sm text-gray-500">Free Account</p>
                      </div>
                      <Button variant="outline" size="sm">
                        Upgrade
                      </Button>
                    </div>
                    <div>
                      <p className="font-medium">Account Created</p>
                      <p className="text-sm text-gray-500">October 15, 2023</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium">Password</h3>
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full sm:w-auto">
                      Change Password
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium">Language & Region</h3>
                  <div className="space-y-2">
                    <Label htmlFor="language">Language</Label>
                    <Select defaultValue="en">
                      <SelectTrigger id="language">
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                        <SelectItem value="de">German</SelectItem>
                        <SelectItem value="zh">Chinese</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="pt-4 border-t">
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
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

