import { Link } from "react-router-dom"
import { Search, MapPin, Sparkles, ArrowRight } from "lucide-react"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Full-page Hero Section */}
      <section className="flex-1 bg-purple-50 flex items-center justify-center py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-800 leading-tight">
                  Find a job that aligns with your interests and skills
                </h1>
                <Sparkles className="h-8 w-8 text-purple-700 hidden md:block" />
              </div>
              
              <p className="text-lg text-gray-600">
                Thousands of jobs in all the leading sectors are waiting for you.
              </p>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-grow">
                    <Search className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Job title, Keyword..."
                      className="pl-12 py-3 text-lg border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                    />
                  </div>
                  <div className="relative flex-grow">
                    <MapPin className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Location"
                      className="pl-12 py-3 text-lg border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                    />
                  </div>
                  <Link to="/jobs">
                    <Button className="bg-purple-700 hover:bg-purple-800 px-8 py-3 text-lg">
                      Find Job
                    </Button>
                  </Link>
                </div>
                <div className="mt-4 text-md text-gray-500">
                  <span>Popular searches: </span>
                  <span className="text-gray-700">UI/UX Designer, Programming, </span>
                  <span className="text-purple-700">Digital Marketing</span>
                  <span className="text-gray-700">, Video, Animation</span>
                </div>
              </div>

              {/* AI Recommendation Banner */}
              <div className="bg-gradient-to-r from-purple-700 to-purple-900 rounded-lg p-5 text-white">
                <div className="flex items-center gap-3 mb-3">
                  <Sparkles className="h-6 w-6" />
                  <h2 className="text-xl font-semibold">AI-Powered Job Matching</h2>
                </div>
                <p className="text-md mb-4">
                  Our AI analyzes your skills and preferences to find the perfect job matches for you.
                </p>
                <Link
                  to="/recommendations"
                  className="inline-flex items-center text-md font-medium text-white hover:underline"
                >
                  View your personalized recommendations
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Link>
              </div>
            </div>

            <div className="hidden md:block">
              <img
                src="./src/assets/ai-help.png"
                alt="Job search illustration"
                width={800}
                height={700}
                className="mx-auto"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}