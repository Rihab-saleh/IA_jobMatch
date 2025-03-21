"use client"

import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Checkbox } from "../components/ui/checkbox"
import { useAuth } from "../contexts/auth-context"

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  const validateForm = () => {
    setError(null)
    let isValid = true

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError("Veuillez entrer une adresse email valide")
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
      console.log("Résultat de la connexion:", result) // Debugging
      if (result.success) {
        console.log("Redirection vers:", result.role === "admin" ? "/admin" : "/dashboard") // Debugging
        navigate(result.role === "admin" ? "/admin" : "/dashboard")
      } else {
        setError(result.error || "Une erreur s'est produite")
      }
    } catch (err) {
      setError(err.message || "Une erreur s'est produite")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row items-center gap-8">
          {/* Section Formulaire */}
          <div className="w-full md:max-w-md">
            <h1 className="text-3xl font-bold mb-2">Connectez-vous à votre compte</h1>
            <p className="text-gray-600 mb-8">Bienvenue ! Veuillez vous connecter pour continuer.</p>

            <div className="bg-white rounded-lg shadow-md p-8">
              {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
                  {error}
                </div>
              )}

              <form className="space-y-6" onSubmit={handleSubmit}>
                {/* Champ Email */}
                <div>
                  <label className="block text-lg font-medium mb-2">
                    Email
                    <Input
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Entrez votre email"
                      className="w-full mt-1"
                      required
                    />
                  </label>
                </div>

                {/* Champ Mot de Passe */}
                <div>
                  <label className="block text-lg font-medium mb-2">
                    Mot de passe
                    <div className="relative mt-1">
                      <Input
                        name="password"
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Entrez votre mot de passe"
                        className="w-full pr-16"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-700 font-medium"
                      >
                        {showPassword ? "Cacher" : "Afficher"}
                      </button>
                    </div>
                  </label>
                </div>

                {/* Case à Cocher "Se Souvenir de Moi" */}
                <div className="flex justify-between items-center">
                  <label className="flex items-center space-x-2">
                    <Checkbox
                      name="rememberMe"
                      checked={formData.rememberMe}
                      onCheckedChange={(checked) => 
                        setFormData(prev => ({ ...prev, rememberMe: checked }))
                      }
                    />
                    <span>Se souvenir de moi</span>
                  </label>
                  <Link to="/forgot-password" className="text-purple-700 font-medium">
                    Mot de passe oublié ?
                  </Link>
                </div>

                {/* Bouton de Connexion */}
                <Button 
                  type="submit" 
                  className="w-full bg-purple-700 hover:bg-purple-800 py-6 text-lg"
                  disabled={loading}
                >
                  {loading ? "Connexion en cours..." : "Se connecter"}
                </Button>
              </form>

              {/* Lien d'Inscription */}
              <div className="mt-8 text-center">
                <p className="text-gray-600">
                  Vous n'avez pas de compte ?{" "}
                  <Link to="/register" className="text-purple-700 font-medium">
                    Inscrivez-vous
                  </Link>
                </p>
              </div>
            </div>
          </div>

          {/* Section Illustration */}
          <div className="hidden md:block w-full max-w-md">
            <img
              src="/login-illustration.svg"
              alt="Illustration de connexion"
              width={400}
              height={400}
              className="mx-auto"
            />
          </div>
        </div>
      </div>
    </div>
  )
}