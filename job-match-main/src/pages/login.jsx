

import { useState, useEffect } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { useAuth } from "../contexts/auth-context"
import { AlertCircle, CheckCircle, Eye, EyeOff } from "lucide-react"
import { userService } from "../services/user-service"

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const searchParams = new URLSearchParams(location.search)
  const registrationSuccess = searchParams.get("registered") === "true"
  const emailFromRegistration = searchParams.get("email") || ""
  const from = location.state?.from || "/profile"

  const [formData, setFormData] = useState({
    email: emailFromRegistration,
    password: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [reactivationLoading, setReactivationLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showSuccessMessage, setShowSuccessMessage] = useState(registrationSuccess)

  useEffect(() => {
    if (registrationSuccess) {
      navigate(location.pathname, { replace: true })
    }
  }, [registrationSuccess, navigate, location.pathname])

  useEffect(() => {
    if (showSuccessMessage) {
      const timer = setTimeout(() => setShowSuccessMessage(false), 5000)
      return () => clearTimeout(timer)
    }
  }, [showSuccessMessage])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const validateForm = () => {
    setError(null)
    let isValid = true

    if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      setError("Format d'email invalide")
      isValid = false
    }

    if (formData.password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères")
      isValid = false
    }

    return isValid
  }

  const handleRequestReactivation = async () => {
    setReactivationLoading(true)
    try {
      await userService.requestAccountStatusChange({
        email: formData.email,
        requestType: "activate",
        reason: "Demande de réactivation depuis la page de connexion"
      })
      setError(null)
      setShowSuccessMessage(true)
    } catch (err) {
      setError(err.message || "Échec de l'envoi de la demande. Veuillez réessayer plus tard.")
    } finally {
      setReactivationLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    setLoading(true)
    try {
      const result = await login(formData.email, formData.password)
      
      if (result?.success) {
        localStorage.setItem("justLoggedIn", "true")
        const redirectTo = result.role === "admin" ? "/admin" : from
        navigate(redirectTo)
      } else {
        if (result?.error?.includes("désactivé")) {
          setError("Votre compte est désactivé. Souhaitez-vous demander une réactivation ?")
        } else {
          setError(result?.error || "Identifiants incorrects")
        }
      }
    } catch (err) {
      setError("Erreur de connexion au serveur")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white px-4 py-8 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            <h1 className="text-3xl font-bold">Connexion</h1>
          </div>

          {showSuccessMessage && (
            <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-md flex items-center">
              <CheckCircle className="h-5 w-5 mr-2" />
              Demande envoyée ! L'administrateur a été notifié.
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md flex flex-col">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                <span>{error}</span>
              </div>
              {error.includes("désactivé") && (
                <Button
                  onClick={handleRequestReactivation}
                  disabled={reactivationLoading}
                  className="mt-2 ml-7 text-sm bg-transparent text-red-700 hover:bg-red-100"
                  variant="outline"
                >
                  {reactivationLoading ? "Envoi en cours..." : "Demander la réactivation"}
                </Button>
              )}
            </div>
          )}

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email
                  <Input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="exemple@email.com"
                    className="w-full mt-1"
                    required
                  />
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Mot de passe
                  <div className="relative mt-1">
                    <Input
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className="w-full pr-12"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-500" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-500" />
                      )}
                    </button>
                  </div>
                </label>
              </div>

              <div className="flex items-center justify-end">
                <div className="text-sm">
                  <Link to="/forgot-password" className="text-blue-700 font-medium">
                    Mot de passe oublié ?
                  </Link>
                </div>
              </div>
            </div>

            <div>
              <Button
                type="submit"
                className="w-full bg-blue-700 hover:bg-blue-800 py-6 text-lg text-white"
                disabled={loading || reactivationLoading}
              >
                {loading ? "Connexion..." : "Se connecter"}
              </Button>
            </div>
          </form>

          <div className="mt-6 text-center text-sm">
            <p className="text-gray-600">
              Pas de compte ?{" "}
              <Link to="/register" className="text-blue-700 font-medium">
                S'inscrire
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}