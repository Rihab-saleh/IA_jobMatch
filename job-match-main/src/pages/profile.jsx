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

  // Add this effect to redirect unauthenticated users
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login", {
        state: { from: "/profile", message: "Veuillez vous connecter pour accéder à votre profil" },
      })
    }
  }, [user, authLoading, navigate])

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
    let isMounted = true

    const loadProfileData = async () => {
      try {
        // Add these debug logs
        console.log("Auth state:", { user, authLoading })
        console.log("Token in localStorage:", localStorage.getItem("auth_token"))

        if (!user || !user._id) {
          setState((prev) => ({
            ...prev,
            loading: false,
            error: "Non authentifié",
          }))
          return
        }

        // Use Promise.all with the service functions
        const [profile, skills] = await Promise.all([
          userService.getUserProfile(user._id),
          userService.getUserSkills(user._id).catch(() => []), // Handle case where user has no skills
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

          // If authentication error, redirect to login
          if (error.message === "Non authentifié") {
            navigate("/login", {
              state: { from: "/profile", message: "Votre session a expiré. Veuillez vous reconnecter." },
            })
          } else {
            toast.error(`Erreur: ${error.message}`)
          }
        }
      }
    }

    if (user) {
      loadProfileData()
    } else if (!authLoading) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: "Non authentifié",
      }))
    }

    return () => {
      isMounted = false
    }
  }, [user, authLoading, navigate])

  const handleSkillOperation = async (operation, skill = null) => {
    if (!user || !user._id) {
      toast.error("Vous devez être connecté pour effectuer cette action")
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
        toast.success("Compétence ajoutée")
      }

      if (operation === "remove" && skill) {
        const skillsData = await userService.getUserSkills(user._id)
        const targetSkill = skillsData.find((s) => s.name === skill)

        if (!targetSkill) throw new Error("Compétence introuvable")

        await userService.removeUserSkill(user._id, targetSkill._id)

        setState((prev) => ({
          ...prev,
          skills: prev.skills.filter((s) => s !== skill),
        }))
        toast.success("Compétence supprimée")
      }
    } catch (error) {
      if (error.message === "Non authentifié") {
        navigate("/login", {
          state: { from: "/profile", message: "Votre session a expiré. Veuillez vous reconnecter." },
        })
      } else {
        toast.error(`Erreur: ${error.message}`)
      }
    }
  }

  const handleFileOperation = async (operation, file = null) => {
    if (!user || !user._id) {
      toast.error("Vous devez être connecté pour effectuer cette action")
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
        toast.success("Photo mise à jour")
      }

      if (operation === "delete") {
        await userService.deleteProfilePicture(user._id)
        setState((prev) => ({ ...prev, profilePicture: null }))
        toast.success("Photo supprimée")
      }
    } catch (error) {
      if (error.message === "Non authentifié") {
        navigate("/login", {
          state: { from: "/profile", message: "Votre session a expiré. Veuillez vous reconnecter." },
        })
      } else {
        toast.error(`Erreur: ${error.message}`)
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
      toast.error("Vous devez être connecté pour effectuer cette action")
      return
    }

    try {
      setState((prev) => ({ ...prev, saving: true }))

      await userService.updateUserProfile(user._id, state.profileData)

      toast.success("Profil mis à jour")
    } catch (error) {
      if (error.message === "Non authentifié") {
        navigate("/login", {
          state: { from: "/profile", message: "Votre session a expiré. Veuillez vous reconnecter." },
        })
      } else {
        toast.error(`Erreur: ${error.message}`)
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

  // Show loading state while auth is being checked
  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-700 mb-4" />
          <p className="text-lg text-gray-600">Vérification de l'authentification...</p>
        </div>
      </div>
    )
  }

  // If not authenticated and not loading, show error
  if (!user && !authLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Accès non autorisé</h2>
          <p className="text-gray-600 mb-6">Vous devez être connecté pour accéder à cette page.</p>
          <Button
            onClick={() => navigate("/login", { state: { from: "/profile" } })}
            className="bg-purple-700 hover:bg-purple-800"
          >
            Se connecter
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
          <p className="text-lg text-gray-600">Chargement en cours...</p>
          {state.error && <p className="text-red-500 text-sm mt-2">{state.error}</p>}
        </div>
      </div>
    )
  }

  if (state.error) {
    return (
      <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Erreur de chargement</h2>
          <p className="text-gray-600 mb-6">{state.error}</p>
          <Button onClick={() => window.location.reload()} className="bg-purple-700 hover:bg-purple-800">
            <RefreshCw className="mr-2 h-4 w-4" />
            Réessayer
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Mon Profil</h1>
        <p className="text-gray-600 mb-8">Optimisez votre profil pour des opportunités pertinentes</p>

        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-8">
            <TabsTrigger value="personal">Infos Personnelles</TabsTrigger>
            <TabsTrigger value="skills">Compétences</TabsTrigger>
            <TabsTrigger value="experience">Expérience</TabsTrigger>
            <TabsTrigger value="preferences">Préférences</TabsTrigger>
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
                        src={state.profilePicture || "/placeholder.svg"}
                        alt="Photo de profil"
                        className="w-full h-full object-cover"
                        loading="lazy"
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
                        <Loader2 className="h-8 w-8 animate-spin text-white" />
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
                        return toast.error("Taille maximale : 5MB")
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
                      Changer
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
                        Supprimer
                      </Button>
                    )}
                  </div>
                </div>

                <div className="flex-1 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="firstName" className="text-sm font-medium">
                        Prénom
                      </label>
                      <Input
                        id="firstName"
                        value={state.profileData.firstName}
                        onChange={handleInputChange}
                        placeholder="Votre prénom"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="lastName" className="text-sm font-medium">
                        Nom
                      </label>
                      <Input
                        id="lastName"
                        value={state.profileData.lastName}
                        onChange={handleInputChange}
                        placeholder="Votre nom"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="email" className="text-sm font-medium">
                        Email
                      </label>
                      <Input
                        id="email"
                        type="email"
                        value={state.profileData.email}
                        onChange={handleInputChange}
                        placeholder="votre.email@exemple.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="phone" className="text-sm font-medium">
                        Téléphone
                      </label>
                      <Input
                        id="phone"
                        value={state.profileData.phone}
                        onChange={handleInputChange}
                        placeholder="Votre numéro de téléphone"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="location" className="text-sm font-medium flex items-center">
                        <MapPin className="h-4 w-4 mr-1 text-gray-500" />
                        Localisation
                      </label>
                      <Input
                        id="location"
                        value={state.profileData.location}
                        onChange={handleInputChange}
                        placeholder="Ville, Pays"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="jobTitle" className="text-sm font-medium flex items-center">
                        <Briefcase className="h-4 w-4 mr-1 text-gray-500" />
                        Poste actuel
                      </label>
                      <Input
                        id="jobTitle"
                        value={state.profileData.jobTitle}
                        onChange={handleInputChange}
                        placeholder="Votre poste actuel"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="bio" className="text-sm font-medium">
                      Biographie
                    </label>
                    <Textarea
                      id="bio"
                      value={state.profileData.bio}
                      onChange={handleInputChange}
                      placeholder="Parlez-nous de vous, de votre parcours et de vos aspirations..."
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
                      Enregistrement...
                    </>
                  ) : (
                    "Sauvegarder"
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="skills" className="space-y-6">
            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-xl font-semibold mb-4">Gestion des Compétences</h2>
              <div className="flex gap-2 mb-6">
                <div className="flex-1">
                  <Input
                    placeholder="Ajouter une compétence..."
                    value={state.newSkill}
                    onChange={(e) => setState((prev) => ({ ...prev, newSkill: e.target.value }))}
                    onKeyDown={(e) => e.key === "Enter" && handleSkillOperation("add")}
                  />
                </div>
                <Button onClick={() => handleSkillOperation("add")} className="bg-purple-700 hover:bg-purple-800">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Ajouter
                </Button>
              </div>

              <div className="flex flex-wrap gap-2 mb-8">
                {state.skills.map((skill) => (
                  <Badge
                    key={skill}
                    variant="secondary"
                    className="px-3 py-1 text-sm hover:bg-gray-100 transition-colors"
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
            </div>
          </TabsContent>

          <TabsContent value="experience" className="space-y-6">
            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-xl font-semibold mb-4">Expérience Professionnelle</h2>
              <p className="text-gray-500">Cette section sera disponible prochainement.</p>
            </div>
          </TabsContent>

          <TabsContent value="preferences" className="space-y-6">
            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-xl font-semibold mb-4">Préférences</h2>
              <p className="text-gray-500">Cette section sera disponible prochainement.</p>
            </div>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-xl font-semibold mb-4">Paramètres de Notifications</h2>
              <p className="text-gray-500">Cette section sera disponible prochainement.</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog
        open={state.showDeleteDialog}
        onOpenChange={(open) => setState((prev) => ({ ...prev, showDeleteDialog: open }))}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmation de suppression</DialogTitle>
            <DialogDescription>Cette action est irréversible. Confirmez-vous la suppression ?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setState((prev) => ({ ...prev, showDeleteDialog: false }))}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={() => handleFileOperation("delete")} disabled={state.isUploading}>
              {state.isUploading ? "Traitement..." : "Confirmer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Export the component with the name expected by your routes
export default ProfilePage