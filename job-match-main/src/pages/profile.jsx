"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Textarea } from "../components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import { Badge } from "../components/ui/badge"
import { PlusCircle, X, MapPin, Briefcase, RefreshCw, Upload, Trash2, Camera, User, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "../contexts/auth-context"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog"
import { useNavigate } from "react-router-dom"
import { userService } from "../services/user-service"

function ProfilePage() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  const [state, setState] = useState({
    loading: true,
    saving: false,
    skills: [],
    newSkill: "",
    profileData: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      location: "",
      jobTitle: "",
      bio: "",
    },
    profilePicture: null,
    isUploading: false,
    showDeleteDialog: false,
    error: null,
  })

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login", {
        state: { from: "/profile", message: "Please log in to access your profile" },
      })
    }
  }, [user, authLoading, navigate])

  useEffect(() => {
    let isMounted = true

    const loadProfileData = async () => {
      try {
        if (!user || !user._id) {
          setState((prev) => ({
            ...prev,
            loading: false,
            error: "Unauthorized",
          }))
          return
        }

        const [profile, skills] = await Promise.all([
          userService.getUserProfile(user._id),
          userService.getUserSkills(user._id).catch(() => []),
        ])

        if (isMounted) {
          setState((prev) => ({
            ...prev,
            profileData: {
              firstName: profile.user.person.firstName || "",
              lastName: profile.user.person.lastName || "",
              email: profile.user.person.email || "",
              phone: profile.user.person.phoneNumber || "",
              location: profile.profile.location || "",
              jobTitle: profile.profile.jobTitle || "",
              bio: profile.profile.bio || "",
            },
            profilePicture: profile.user.person.profilePicture?.url || null,
            skills: Array.isArray(skills) ? skills.map((skill) => skill.name) : [],
            loading: false,
            error: null,
          }))
        }
      } catch (error) {
        if (isMounted) {
          console.error("Profile loading error:", error)
          setState((prev) => ({
            ...prev,
            loading: false,
            error: error.message,
          }))

          if (error.message === "Unauthorized") {
            navigate("/login", {
              state: { from: "/profile", message: "Your session has expired. Please log in again." },
            })
          } else {
            toast.error(`Error: ${error.message}`)
          }
        }
      }
    }

    if (user) loadProfileData()
    else if (!authLoading) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: "Unauthorized",
      }))
    }

    return () => { isMounted = false }
  }, [user, authLoading, navigate])

  const handleSkillOperation = async (operation, skill = null) => {
    if (!user || !user._id) {
      toast.error("You must be logged in to perform this action")
      return
    }

    try {
      if (operation === "add") {
        if (!state.newSkill || state.skills.includes(state.newSkill)) return

        await userService.addUserSkill(user._id, { 
          name: state.newSkill, 
          level: "Intermediate" 
        })

        setState((prev) => ({
          ...prev,
          skills: [...prev.skills, state.newSkill],
          newSkill: "",
        }))
        toast.success("Skill added")
      }

      if (operation === "remove" && skill) {
        const skillsData = await userService.getUserSkills(user._id)
        const targetSkill = skillsData.find((s) => s.name === skill)

        if (!targetSkill) throw new Error("Skill not found")

        await userService.removeUserSkill(user._id, targetSkill._id)

        setState((prev) => ({
          ...prev,
          skills: prev.skills.filter((s) => s !== skill),
        }))
        toast.success("Skill removed")
      }
    } catch (error) {
      if (error.message === "Unauthorized") {
        navigate("/login", {
          state: { from: "/profile", message: "Your session has expired. Please log in again." },
        })
      } else {
        toast.error(`Error: ${error.message}`)
      }
    }
  }

  const handleFileOperation = async (operation, file = null) => {
    if (!user || !user._id) {
      toast.error("You must be logged in to perform this action")
      return
    }

    try {
      setState((prev) => ({ ...prev, isUploading: true }))

      if (operation === "upload" && file) {
        const response = await userService.uploadProfilePicture(user._id, file)
        setState((prev) => ({
          ...prev,
          profilePicture: response.profilePicture?.url || null,
        }))
        toast.success("Profile picture updated")
      }

      if (operation === "delete") {
        await userService.deleteProfilePicture(user._id)
        setState((prev) => ({ ...prev, profilePicture: null }))
        toast.success("Profile picture deleted")
      }
    } catch (error) {
      if (error.message === "Unauthorized") {
        navigate("/login", {
          state: { from: "/profile", message: "Your session has expired. Please log in again." },
        })
      } else {
        toast.error(`Error: ${error.message}`)
      }

      if (operation === "upload" && user?.person?.profilePicture?.url) {
        setState((prev) => ({
          ...prev,
          profilePicture: user.person.profilePicture.url,
        }))
      }
    } finally {
      setState((prev) => ({
        ...prev,
        isUploading: false,
        showDeleteDialog: false,
      }))
    }
  }

  const handleProfileUpdate = async () => {
    if (!user || !user._id) {
      toast.error("You must be logged in to perform this action")
      return
    }

    try {
      setState((prev) => ({ ...prev, saving: true }))
      await userService.updateUserProfile(user._id, state.profileData)
      toast.success("Profile updated successfully")
    } catch (error) {
      if (error.message === "Unauthorized") {
        navigate("/login", {
          state: { from: "/profile", message: "Your session has expired. Please log in again." },
        })
      } else {
        toast.error(`Error: ${error.message}`)
      }
    } finally {
      setState((prev) => ({ ...prev, saving: false }))
    }
  }

  const handleInputChange = (e) => {
    const { id, value } = e.target
    setState((prev) => ({
      ...prev,
      profileData: { ...prev.profileData, [id]: value },
    }))
  }

  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-700 mb-4" />
          <p className="text-lg text-gray-600">Checking authentication...</p>
        </div>
      </div>
    )
  }

  if (!user && !authLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Unauthorized Access</h2>
          <p className="text-gray-600 mb-6">You must be logged in to access this page.</p>
          <Button
            onClick={() => navigate("/login", { state: { from: "/profile" } })}
            className="bg-purple-700 hover:bg-purple-800"
          >
            Log In
          </Button>
        </div>
      </div>
    )
  }

  if (state.loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-700 mb-4" />
          <p className="text-lg text-gray-600">Loading...</p>
          {state.error && <p className="text-red-500 text-sm mt-2">{state.error}</p>}
        </div>
      </div>
    )
  }

  if (state.error) {
    return (
      <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Loading Error</h2>
          <p className="text-gray-600 mb-6">{state.error}</p>
          <Button onClick={() => window.location.reload()} className="bg-purple-700 hover:bg-purple-800">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">My Profile</h1>
        <p className="text-gray-600 mb-8">Complete your profile to get personalized job recommendations</p>

        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-8">
            <TabsTrigger value="personal">Personal Info</TabsTrigger>
            <TabsTrigger value="skills">Skills</TabsTrigger>
            <TabsTrigger value="experience">Experience</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>

          <TabsContent value="personal" className="space-y-6">
            <div className="bg-white rounded-lg border p-6">
              <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="flex flex-col items-center">
                  <div
                    className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 mb-4 relative group cursor-pointer"
                    onClick={() => fileInputRef.current.click()}
                  >
                    {state.profilePicture ? (
                      <img
                        src={state.profilePicture}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <User className="h-16 w-16" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <Camera className="h-8 w-8 text-white" />
                    </div>
                    {state.isUploading && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <div className="w-8 h-8 border-4 border-t-purple-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file) return

                      if (file.size > 5 * 1024 * 1024) {
                        return toast.error("Maximum file size: 5MB")
                      }

                      const reader = new FileReader()
                      reader.onload = () => {
                        setState((prev) => ({
                          ...prev,
                          profilePicture: reader.result,
                        }))
                      }
                      reader.readAsDataURL(file)
                      await handleFileOperation("upload", file)
                    }}
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current.click()}
                      disabled={state.isUploading}
                    >
                      <Upload className="h-4 w-4 mr-1" />
                      Change
                    </Button>
                    {state.profilePicture && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => setState((prev) => ({ ...prev, showDeleteDialog: true }))}
                        disabled={state.isUploading}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    )}
                  </div>
                </div>

                <div className="flex-1 space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label htmlFor="firstName" className="text-sm font-medium">
                        First Name
                      </label>
                      <Input
                        id="firstName"
                        value={state.profileData.firstName}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="lastName" className="text-sm font-medium">
                        Last Name
                      </label>
                      <Input
                        id="lastName"
                        value={state.profileData.lastName}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="email" className="text-sm font-medium">
                      Email
                    </label>
                    <Input
                      id="email"
                      type="email"
                      value={state.profileData.email}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="phone" className="text-sm font-medium">
                      Phone Number
                    </label>
                    <Input
                      id="phone"
                      value={state.profileData.phone}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label htmlFor="location" className="text-sm font-medium">
                        Location
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="location"
                          className="pl-9"
                          value={state.profileData.location}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="jobTitle" className="text-sm font-medium">
                        Current Job Title
                      </label>
                      <div className="relative">
                        <Briefcase className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="jobTitle"
                          className="pl-9"
                          value={state.profileData.jobTitle}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="bio" className="text-sm font-medium">
                      Bio
                    </label>
                    <Textarea
                      id="bio"
                      value={state.profileData.bio}
                      onChange={handleInputChange}
                      placeholder="Tell us about your professional experience, skills, and career goals..."
                      rows={4}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <Button
                  className="bg-purple-700 hover:bg-purple-800"
                  onClick={handleProfileUpdate}
                  disabled={state.saving}
                >
                  {state.saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="skills" className="space-y-6">
            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-xl font-semibold mb-4">Technical Skills</h2>
              <p className="text-gray-600 mb-6">
                Add your skills to help us match you with relevant job opportunities. Our AI will
                analyze your skills to provide personalized recommendations.
              </p>

              <div className="flex gap-2 mb-6">
                <div className="flex-1">
                  <Input
                    placeholder="Add a skill (e.g., Python, Project Management...)"
                    value={state.newSkill}
                    onChange={(e) => setState(prev => ({ ...prev, newSkill: e.target.value }))}
                    onKeyDown={(e) => e.key === "Enter" && handleSkillOperation("add")}
                  />
                </div>
                <Button 
                  onClick={() => handleSkillOperation("add")} 
                  className="bg-purple-700 hover:bg-purple-800"
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>

              <div className="flex flex-wrap gap-2 mb-8">
                {state.skills.map((skill) => (
                  <Badge
                    key={skill}
                    variant="secondary"
                    className="px-3 py-1 text-sm hover:bg-gray-100"
                  >
                    {skill}
                    <button
                      onClick={() => handleSkillOperation("remove", skill)}
                      className="ml-2 text-gray-500 hover:text-gray-700"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>

              <h3 className="text-lg font-medium mb-3">Suggested Skills</h3>
              <div className="flex flex-wrap gap-2 mb-6">
                {['TypeScript', 'Express.js', 'GraphQL', 'Docker', 'AWS'].map((skill) => (
                  <Badge 
                    key={skill} 
                    variant="outline" 
                    className="px-3 py-1 text-sm cursor-pointer hover:bg-gray-100"
                  >
                    {skill}
                    <PlusCircle className="h-3 w-3 ml-2" />
                  </Badge>
                ))}
              </div>

              <div className="flex justify-end mt-6">
                <Button className="bg-purple-700 hover:bg-purple-800">
                  Save Skills
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="experience" className="space-y-6">
            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-xl font-semibold mb-4">Professional Experience</h2>
              <p className="text-gray-500">This section is coming soon.</p>
            </div>
          </TabsContent>

          <TabsContent value="preferences" className="space-y-6">
            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-xl font-semibold mb-4">Preferences</h2>
              <p className="text-gray-500">This section is coming soon.</p>
            </div>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-xl font-semibold mb-4">Notification Settings</h2>
              <p className="text-gray-500">This section is coming soon.</p>
            </div>
          </TabsContent>
        </Tabs>

        <Dialog
          open={state.showDeleteDialog}
          onOpenChange={(open) => setState(prev => ({ ...prev, showDeleteDialog: open }))}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Profile Picture</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete your profile picture? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setState(prev => ({ ...prev, showDeleteDialog: false }))}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => handleFileOperation("delete")} 
                disabled={state.isUploading}
              >
                {state.isUploading ? "Deleting..." : "Confirm"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

export default ProfilePage