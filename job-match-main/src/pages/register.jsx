"use client"

import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
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
    phoneNumber: "",
    age: "",
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
      newErrors.firstName = "First name required"
    } else if (formData.firstName.length < 2) {
      newErrors.firstName = "Minimum 2 characters"
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name required"
    } else if (formData.lastName.length < 2) {
      newErrors.lastName = "Minimum 2 characters"
    }

    if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = "Invalid email format"
    }

    if (formData.password.length < 8) {
      newErrors.password = "Minimum 8 characters"
    }

    if (!/^\d{8}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = "8 digits required"
    }

    const age = parseInt(formData.age)
    if (isNaN(age) || age < 18 || age > 100) {
      newErrors.age = "Age must be 18-100"
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
        setErrors({ form: result?.error || "Registration failed" })
      }
    } catch (err) {
      setErrors({ form: "Server error" })
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Register</h1>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label className="block text-base font-medium mb-1">
              First Name
              <Input
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className={`w-full mt-1 ${errors.firstName ? "border-red-500" : ""}`}
                required
              />
            </label>
          </div>

          <div>
            <label className="block text-base font-medium mb-1">
              Last Name
              <Input
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className={`w-full mt-1 ${errors.lastName ? "border-red-500" : ""}`}
                required
              />
            </label>
          </div>

          <div>
            <label className="block text-base font-medium mb-1">
              Email
              <Input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full mt-1 ${errors.email ? "border-red-500" : ""}`}
                required
              />
            </label>
          </div>

          <div>
            <label className="block text-base font-medium mb-1">
              Password
              <div className="relative mt-1">
                <Input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
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
            </label>
          </div>

          <div>
            <label className="block text-base font-medium mb-1">
              Phone Number
              <Input
                name="phoneNumber"
                type="tel"
                value={formData.phoneNumber}
                onChange={handleChange}
                className={`w-full mt-1 ${errors.phoneNumber ? "border-red-500" : ""}`}
                required
              />
            </label>
          </div>

          <div>
            <label className="block text-base font-medium mb-1">
              Age
              <Input
                name="age"
                type="number"
                value={formData.age}
                onChange={handleChange}
                min="18"
                max="100"
                className={`w-full mt-1 ${errors.age ? "border-red-500" : ""}`}
                required
              />
            </label>
          </div>

          <Button 
            type="submit" 
            className="w-full py-6 text-lg bg-purple-700 hover:bg-purple-800"
            disabled={loading}
          >
            {loading ? "Processing..." : "Register"}
          </Button>

          <div className="text-center">
            <p className="text-gray-600">
              Already registered?{" "}
              <Link to="/login" className="text-purple-700 font-medium">
                Login
              </Link>
            </p>
          </div>
        </form>

        {/* Error messages displayed below the form */}
        {Object.keys(errors).length > 0 && (
          <div className="mt-6 p-4 border border-red-300 rounded-lg bg-red-50">
            <h3 className="text-red-700 font-medium mb-2">Please fix these errors:</h3>
            <ul className="text-red-600 space-y-1">
              {errors.firstName && <li className="flex items-center"><AlertCircle className="h-4 w-4 mr-1" /> First Name: {errors.firstName}</li>}
              {errors.lastName && <li className="flex items-center"><AlertCircle className="h-4 w-4 mr-1" /> Last Name: {errors.lastName}</li>}
              {errors.email && <li className="flex items-center"><AlertCircle className="h-4 w-4 mr-1" /> Email: {errors.email}</li>}
              {errors.password && <li className="flex items-center"><AlertCircle className="h-4 w-4 mr-1" /> Password: {errors.password}</li>}
              {errors.phoneNumber && <li className="flex items-center"><AlertCircle className="h-4 w-4 mr-1" /> Phone: {errors.phoneNumber}</li>}
              {errors.age && <li className="flex items-center"><AlertCircle className="h-4 w-4 mr-1" /> Age: {errors.age}</li>}
              {errors.form && <li className="flex items-center"><AlertCircle className="h-4 w-4 mr-1" /> {errors.form}</li>}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}