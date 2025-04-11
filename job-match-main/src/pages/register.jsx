"use client"

import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Checkbox } from "../components/ui/checkbox"
import { useAuth } from "../contexts/auth-context"
import { AlertCircle, Eye, EyeOff } from "lucide-react"

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    mobile: "",
    age: "",
    rememberPassword: false,
    notifications: true,
  })
  
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (submitted) validateForm()
  }, [formData, submitted])

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = "Prénom requis"
    } else if (formData.firstName.length < 2) {
      newErrors.firstName = "Minimum 2 caractères"
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Nom requis"
    } else if (formData.lastName.length < 2) {
      newErrors.lastName = "Minimum 2 caractères"
    }

    if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = "Email invalide"
    }

    if (formData.password.length < 8) {
      newErrors.password = "8 caractères minimum"
    }

    if (!/^\d{8}$/.test(formData.mobile)) {
      newErrors.mobile = "8 chiffres requis"
    }

    const age = parseInt(formData.age)
    if (isNaN(age) || age < 18 || age > 100) {
      newErrors.age = "Âge entre 18 et 100"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitted(true)
    if (!validateForm()) return

    setLoading(true)
    try {
      const result = await register(formData)
      if (result?.success) {
        navigate(`/login?registered=true&email=${encodeURIComponent(formData.email)}`, { 
          replace: true 
        })
      } else {
        setErrors({ form: result?.error || "Erreur lors de l'inscription" })
      }
    } catch (err) {
      setErrors({ form: "Erreur de connexion au serveur" })
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

  const handleBlur = (e) => {
    if (submitted) validateForm()
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Inscription</h1>

        {errors.form && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            {errors.form}
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label className="block text-base font-medium mb-2">
              Prénom
              <Input
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full mt-1 ${errors.firstName ? "border-red-500" : ""}`}
                required
              />
              {errors.firstName && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.firstName}
                </p>
              )}
            </label>
          </div>

          <div>
            <label className="block text-base font-medium mb-2">
              Nom
              <Input
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full mt-1 ${errors.lastName ? "border-red-500" : ""}`}
                required
              />
              {errors.lastName && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.lastName}
                </p>
              )}
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
                onBlur={handleBlur}
                className={`w-full mt-1 ${errors.email ? "border-red-500" : ""}`}
                required
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.email}
                </p>
              )}
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
                  onBlur={handleBlur}
                  className={`w-full pr-12 ${errors.password ? "border-red-500" : ""}`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  disabled={!formData.password}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-500" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-500" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.password}
                </p>
              )}
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
                onBlur={handleBlur}
                className={`w-full mt-1 ${errors.mobile ? "border-red-500" : ""}`}
                placeholder="12345678"
                required
              />
              {errors.mobile && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.mobile}
                </p>
              )}
            </label>
          </div>

          <div>
            <label className="block text-base font-medium mb-2">
              Âge
              <Input
                name="age"
                type="number"
                value={formData.age}
                onChange={handleChange}
                onBlur={handleBlur}
                min="18"
                max="100"
                className={`w-full mt-1 ${errors.age ? "border-red-500" : ""}`}
                required
              />
              {errors.age && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.age}
                </p>
              )}
            </label>
          </div>

          <div className="flex flex-col gap-4">
            <label className="flex items-center space-x-2">
              <Checkbox
                name="rememberPassword"
                checked={formData.rememberPassword}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ ...prev, rememberPassword: checked }))
                }
              />
              <span>Se souvenir du mot de passe</span>
            </label>

            <label className="flex items-center space-x-2">
              <Checkbox
                name="notifications"
                checked={formData.notifications}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ ...prev, notifications: checked }))
                }
              />
              <span>Recevoir les notifications</span>
            </label>
          </div>

          <Button 
            type="submit" 
            className="w-full py-6 text-lg bg-purple-700 hover:bg-purple-800"
            disabled={loading}
          >
            {loading ? "Enregistrement..." : "S'inscrire"}
          </Button>

          <div className="text-center">
            <p className="text-gray-600">
              Déjà inscrit ?{" "}
              <Link to="/login" className="text-purple-700 font-medium">
                Se connecter
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}