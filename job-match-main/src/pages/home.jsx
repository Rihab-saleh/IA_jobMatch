import { Link } from "react-router-dom"
import { Search, MapPin, Bookmark, Sparkles, ArrowRight } from "lucide-react"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <section className="bg-purple-50 py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-800 leading-tight">
                  Find a job that aligns with your interests and skills
                </h1>
                <Sparkles className="h-6 w-6 text-purple-700 hidden md:block" />
              </div>
              <p className="text-gray-600">Thousands of jobs in all the leading sector are waiting for you.</p>

              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="relative flex-grow">
                    <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Job title, Keyword..."
                      className="pl-10 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                    />
                  </div>
                  <div className="relative flex-grow">
                    <MapPin className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Location"
                      className="pl-10 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                    />
                  </div>
                  <Button className="bg-purple-700 hover:bg-purple-800 px-6">Find Job</Button>
                </div>
                <div className="mt-3 text-sm text-gray-500">
                  <span>Suggestion: </span>
                  <span className="text-gray-700">UI/UX Designer, Programming, </span>
                  <span className="text-purple-700">Digital Marketing</span>
                  <span className="text-gray-700">, Video, Animation.</span>
                </div>
              </div>

              {/* AI Recommendation Banner */}
              <div className="bg-gradient-to-r from-purple-700 to-purple-900 rounded-lg p-4 text-white">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-5 w-5" />
                  <h2 className="text-lg font-semibold">AI-Powered Job Matching</h2>
                </div>
                <p className="text-sm mb-3">
                  Our AI analyzes your skills and preferences to find the perfect job matches for you.
                </p>
                <Link
                  to="/recommendations"
                  className="inline-flex items-center text-sm font-medium text-white hover:underline"
                >
                  View your personalized recommendations
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </div>
            </div>

            <div className="hidden md:block">
              <img
                   src="./src/assets/ai-help.png"
                alt="Job search illustration"
                width={700}
                height={600}
                className="mx-auto"
              />
            </div>
          </div>
        </div>
      </section>

    
    </div>
  )
}

