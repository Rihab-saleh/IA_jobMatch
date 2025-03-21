"use client"

import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Checkbox } from "../components/ui/checkbox"
import { useAuth } from "../contexts/auth-context"

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    mobile: "",
    rememberPassword: false,
    notifications: true,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const validateForm = () => {
    setError(null)
    let isValid = true

    if (formData.fullName.split(' ').length < 2) {
      setError("Veuillez entrer votre nom complet")
      isValid = false
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError("Adresse email invalide")
      isValid = false
    }

    if (formData.password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères")
      isValid = false
    }

    if (!/^\d{10}$/.test(formData.mobile)) {
      setError("Numéro de téléphone invalide (10 chiffres requis)")
      isValid = false
    }

    return isValid
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return
    
    setLoading(true)
    try {
      const result = await register(formData)
      if (result.success) {
        navigate("/dashboard")
      }
    } catch (err) {
      setError(err.message || "Échec de l'inscription")
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Inscription</h1>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
            {error}
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label className="block text-base font-medium mb-2">
              Nom complet
              <Input
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Jean Dupont"
                className="w-full mt-1"
                required
              />
            </label>
          </div>

          <div>
            <label className="block text-base font-medium mb-2">
              Email
              <Input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="jean.dupont@email.com"
                className="w-full mt-1"
                required
              />
            </label>
          </div>

          <div>
            <label className="block text-base font-medium mb-2">
              Mot de passe
              <div className="relative mt-1">
                <Input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full pr-16"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-700"
                >
                  {showPassword ? "Cacher" : "Afficher"}
                </button>
              </div>
            </label>
          </div>

          <div>
            <label className="block text-base font-medium mb-2">
              Téléphone
              <Input
                name="mobile"
                type="tel"
                value={formData.mobile}
                onChange={handleChange}
                placeholder="0612345678"
                className="w-full mt-1"
                required
              />
            </label>
          </div>

          <Button 
            type="submit" 
            className="w-full py-6"
            disabled={loading}
          >
            {loading ? "Inscription..." : "S'inscrire"}
          </Button>
        </form>
      </div>
    </div>
  )
}