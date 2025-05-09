"use client"

import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Search, MapPin, Sparkles, ArrowRight, Briefcase, FileText, TrendingUp, ChevronRight } from "lucide-react"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Badge } from "../components/ui/badge"
import { cn } from "../lib/utils"

// Feature highlights
const features = [
  {
    title: "AI Job Recommendations",
    description:
      "Our algorithm analyzes your profile and available job offers to suggest the best matches.",
    icon: Sparkles,
    color: "bg-blue-500",
  },
  {
    title: "Resume Optimization",
    description:
      "Improve your resume with AI analysis that identifies strengths and areas for improvement.",
    icon: FileText,
    color: "bg-green-500",
  },
  {
    title: "Market Analysis",
    description:
      "Discover job market trends and the most sought-after skills in your field.",
    icon: TrendingUp,
    color: "bg-blue-500",
  },
]

const FeatureCard = ({ feature }) => (
  <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 p-6 border border-gray-100 hover:border-blue-100 group">
    <div
      className={cn(
        "w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-transform group-hover:scale-110",
        feature.color,
      )}
    >
      <feature.icon className="h-6 w-6 text-white" />
    </div>
    <h3 className="text-xl font-semibold mb-2 text-gray-800">{feature.title}</h3>
    <p className="text-gray-600">{feature.description}</p>
    <div className="mt-4">
      <Link
        to={
          feature.title.includes("Recommendations")
            ? "/recommendations"
            : feature.title.includes("Resume")
              ? "/cv-builder"
              : "/market-trends"
        }
        className="inline-flex items-center text-blue-600 font-medium hover:text-blue-800 transition-colors"
      >
        Learn more <ChevronRight className="h-4 w-4 ml-1" />
      </Link>
    </div>
  </div>
)

export default function HomePage() {
  const navigate = useNavigate()
  const [filters, setFilters] = useState({
    query: "",
    location: "",
  })
  const [isSearchFocused, setIsSearchFocused] = useState(false)

  // Log visitor on page load
  useEffect(() => {
    fetch("http://localhost:5000/api/log-visit", {
      method: "GET",
      credentials: "include", // If you need cookies/authentication
    }).catch((err) => {
      console.error("Error logging visit:", err)
    })
  }, [])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSearch = (e) => {
    e.preventDefault()
    navigate(`/jobs?query=${encodeURIComponent(filters.query)}&location=${encodeURIComponent(filters.location)}`)
  }

  return (
    <div className="flex min-h-screen flex-col">

        <section className="relative bg-gradient-to-br from-blue-50 to-indigo-50 py-16 md:py-24 overflow-hidden">
          <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
          <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-blue-100/50 to-transparent"></div>

          <div className="container mx-auto relative">
            <div className="grid md:grid-cols-2 gap-12 items-center justify-between">
              <div className="space-y-12">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-800 leading-tight">
                Discover <span className="text-blue-600">AI-powered</span> jobs that match your unique skills

                </h1>

                <p className="text-xl text-gray-600 max-w-xl">
                Our AI analyzes your profile to deliver tailored job matches and optimize your resume. It learns from your experience, preferences, and skills to recommend relevant opportunities, enhancing your CV with the right keywords and industry standards to boost your chances.
                </p>
              </div>

              <div className="hidden md:block relative ml-28"> {/* Further increased margin-left to move the picture more to the right */}
                <div className="absolute -top-10 -right-10 w-64 h-64 bg-blue-200 rounded-full mix-blend-multiply filter blur-2xl opacity-70 animate-blob"></div>
                <div className="absolute -bottom-8 -left-8 w-64 h-64 bg-blue-200 rounded-full mix-blend-multiply filter blur-2xl opacity-70 animate-blob animation-delay-2000"></div>
                <div className="absolute top-24 right-24 w-64 h-64 bg-pink-200 rounded-full mix-blend-multiply filter blur-2xl opacity-70 animate-blob animation-delay-4000"></div>

                <div
                  className="bg-white p-4 rounded-2xl shadow-xl transform rotate-1 hover:rotate-0 transition-transform duration-300 flex items-center justify-center"
                  style={{ width: "450px", height: "400px" }}
                >
                  <img
                    src="./src/assets/homepic.png"
                    alt="Illustration of job search with AI"
                    className="rounded object-cover w-full h-full"
                  />

                  <div className="absolute -bottom-6 -left-6 bg-white rounded-lg shadow-lg p-4 transform -rotate-3 hover:rotate-0 transition-transform duration-300">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <Sparkles className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold">AI Match</div>
                        <div className="text-xs text-gray-500">95% compatibility</div>
                      </div>
                    </div>
                  </div>

                  <div className="absolute -top-6 -right-6 bg-white rounded-lg shadow-lg p-4 transform rotate-6 hover:rotate-0 transition-transform duration-300">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                        <FileText className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold">Optimized Resume</div>
                        <div className="text-xs text-gray-500">+40% visibility</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              Our AI enhances your job search
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Intelligent tools to find the ideal position and optimize your application.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <FeatureCard key={index} feature={feature} />
            ))}
          </div>
        </div>
      </section>

      {/* AI Recommendation Banner */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="max-w-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Sparkles className="h-6 w-6" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold">Personalized AI Job Recommendations</h2>
              </div>
              <p className="text-lg mb-6 text-blue-100">
                Our AI analyzes your profile to suggest jobs that best match your skills and aspirations.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  to="/recommendations"
                  className="inline-flex items-center bg-white text-blue-700 hover:bg-blue-50 px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  View my recommendations
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Link>
                <Link
                  to="/cv-builder"
                  className="inline-flex items-center bg-blue-700 text-white hover:bg-blue-800 px-6 py-3 rounded-lg font-medium transition-colors border border-blue-500"
                >
                  Optimize my resume
                  <FileText className="h-5 w-5 ml-2" />
                </Link>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm p-6 rounded-xl border border-white/20 max-w-md w-full">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  <h3 className="font-semibold">Job Match</h3>
                </div>
                <Badge className="bg-green-500 hover:bg-green-600">95% Match</Badge>
              </div>

              <div className="space-y-4">
                <div className="bg-white/10 p-4 rounded-lg">
                  <h4 className="font-medium">Frontend React Developer</h4>
                  <p className="text-sm text-blue-100">TechSolutions • Paris, France</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge variant="outline" className="bg-white/10 text-white border-white/20">
                      React
                    </Badge>
                    <Badge variant="outline" className="bg-white/10 text-white border-white/20">
                      TypeScript
                    </Badge>
                    <Badge variant="outline" className="bg-white/10 text-white border-white/20">
                      UI/UX
                    </Badge>
                  </div>
                </div>

                <div className="bg-white/10 p-4 rounded-lg">
                  <h4 className="font-medium">Full Stack Engineer</h4>
                  <p className="text-sm text-blue-100">InnovateTech • Lyon, France</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge variant="outline" className="bg-white/10 text-white border-white/20">
                      Node.js
                    </Badge>
                    <Badge variant="outline" className="bg-white/10 text-white border-white/20">
                      React
                    </Badge>
                    <Badge variant="outline" className="bg-white/10 text-white border-white/20">
                      MongoDB
                    </Badge>
                  </div>
                </div>
              </div>

              <Button className="w-full mt-4 bg-white text-blue-700 hover:bg-blue-50">
                View more matches
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-br from-blue-900 to-indigo-900 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to enhance your job search?</h2>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto mb-8">
            Sign up for free to receive personalized recommendations and optimize your resume.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button className="bg-white text-blue-700 hover:bg-blue-50 px-8 py-6 text-lg rounded-lg">
              Create an account
            </Button>
            <Button
              variant="outline"
              className="border-white text-white hover:bg-white/10 px-8 py-6 text-lg rounded-lg"
            >
              Learn more
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
