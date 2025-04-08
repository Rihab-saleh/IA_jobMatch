"use client"

import { useState, useEffect } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Checkbox } from "../components/ui/checkbox"
import { useAuth } from "../contexts/auth-context"
import { AlertCircle, CheckCircle, Eye, EyeOff } from "lucide-react"

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const searchParams = new URLSearchParams(location.search)
  const registrationSuccess = searchParams.get("registered") === "true"
  const emailFromRegistration = searchParams.get("email") || ""
  const from = location.state?.from || "/dashboard"

  const [formData, setFormData] = useState({
    email: emailFromRegistration,
    password: "",
    rememberMe: false,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
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
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    setLoading(true)
    try {
      const result = await login(formData.email, formData.password)
      if (result?.success) {
        // Set flag that user just logged in - this helps with profile page loading
        localStorage.setItem("justLoggedIn", "true")

        // Navigate to appropriate page based on role or the 'from' location
        const redirectTo = result.role === "admin" ? "/admin" : from
        navigate(redirectTo)
      } else {
        setError(result?.error || "Identifiants incorrects")
      }
    } catch (err) {
      setError("Erreur de connexion au serveur")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="w-full md:max-w-md">
            <h1 className="text-3xl font-bold mb-2">Connexion</h1>

            {showSuccessMessage && (
              <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-md flex items-center">
                <CheckCircle className="h-5 w-5 mr-2" />
                Inscription réussie ! Connectez-vous maintenant.
              </div>
            )}

            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                {error}
              </div>
            )}

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label className="block text-lg font-medium mb-2">
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
                <label className="block text-lg font-medium mb-2">
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

              <div className="flex justify-between items-center">
                <label className="flex items-center space-x-2">
                  <Checkbox
                    name="rememberMe"
                    checked={formData.rememberMe}
                    onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, rememberMe: checked }))}
                  />
                  <span>Se souvenir de moi</span>
                </label>
                <Link to="/forgot-password" className="text-purple-700 font-medium">
                  Mot de passe oublié ?
                </Link>
              </div>

              <Button
                type="submit"
                className="w-full bg-purple-700 hover:bg-purple-800 py-6 text-lg"
                disabled={loading}
              >
                {loading ? "Connexion..." : "Se connecter"}
              </Button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-gray-600">
                Pas de compte ?{" "}
                <Link to="/register" className="text-purple-700 font-medium">
                  S'inscrire
                </Link>
              </p>
            </div>
          </div>

          
        </div>
      </div>
    </div>
  )
}

