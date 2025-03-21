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

      {/* Featured Jobs */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Featured Jobs</h2>
            <p className="text-gray-600">Choose jobs from the top employers and apply for the same.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Job Card 1 */}
            <div className="bg-white rounded-lg border p-6 relative">
              <button className="absolute right-4 top-4 text-gray-400 hover:text-purple-700">
                <Bookmark className="h-5 w-5" />
              </button>

              <h3 className="text-lg font-semibold mb-1">Technical Support Specialist</h3>
              <div className="bg-green-100 text-green-800 text-xs font-medium px-2 py-0.5 rounded inline-block mb-2">
                PART-TIME
              </div>
              <p className="text-gray-600 text-sm mb-4">Salary: 20,000 INR - 25,000 INR</p>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full overflow-hidden bg-white border">
                  <img src="/placeholder.svg?height=32&width=32" alt="Google Inc." width={32} height={32} />
                </div>
                <div>
                  <p className="font-medium text-sm">Google Inc.</p>
                  <p className="text-gray-500 text-xs">New Delhi, India</p>
                </div>
              </div>

              <div className="flex items-center gap-1 mb-4">
                <div className="flex -space-x-2">
                  <div className="w-6 h-6 rounded-full border-2 border-white bg-gray-200"></div>
                  <div className="w-6 h-6 rounded-full border-2 border-white bg-gray-200"></div>
                </div>
                <span className="text-xs text-gray-500">10+ applicants</span>
              </div>

              <div className="flex gap-3">
                <Link
                  to="/jobs/1"
                  className="flex-1 text-center py-2 border border-gray-300 rounded text-sm font-medium hover:bg-gray-50"
                >
                  View details
                </Link>
                <Link
                  to="/apply/1"
                  className="flex-1 text-center py-2 bg-purple-700 text-white rounded text-sm font-medium hover:bg-purple-800"
                >
                  Apply now
                </Link>
              </div>
            </div>

            {/* More job cards would go here */}
          </div>
        </div>
      </section>
    </div>
  )
}

