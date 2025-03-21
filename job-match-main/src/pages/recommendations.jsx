import { Button } from "../components/ui/button"
import { Badge } from "../components/ui/badge"
import {
  Bookmark,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  MapPin,
  Briefcase,
  Clock,
  DollarSign,
  ArrowRight,
} from "lucide-react"

export default function RecommendationsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-2 mb-2">
          <h1 className="text-3xl font-bold">AI Job Recommendations</h1>
          <Sparkles className="h-6 w-6 text-purple-700" />
        </div>
        <p className="text-gray-600 mb-8">
          Personalized job recommendations based on your profile, skills, and preferences
        </p>

        {/* AI Recommendation Banner */}
        <div className="bg-gradient-to-r from-purple-700 to-purple-900 rounded-lg p-6 mb-8 text-white">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-5 w-5" />
                <h2 className="text-xl font-semibold">AI-Powered Job Matching</h2>
              </div>
              <p className="mb-4">
                Our AI has analyzed your profile and found jobs that match your skills and preferences. These
                recommendations are updated daily to ensure you never miss an opportunity.
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="bg-white/20 hover:bg-white/30 text-white">
                  JavaScript
                </Badge>
                <Badge variant="secondary" className="bg-white/20 hover:bg-white/30 text-white">
                  React
                </Badge>
                <Badge variant="secondary" className="bg-white/20 hover:bg-white/30 text-white">
                  Node.js
                </Badge>
                <Badge variant="secondary" className="bg-white/20 hover:bg-white/30 text-white">
                  Frontend Development
                </Badge>
              </div>
            </div>
            <div className="shrink-0">
              <div className="bg-white/10 p-4 rounded-lg text-center">
                <div className="text-4xl font-bold mb-1">95%</div>
                <div className="text-sm">Profile Completion</div>
              </div>
            </div>
          </div>
        </div>

        {/* Top Recommendations */}
        <div className="mb-10">
          <h2 className="text-2xl font-semibold mb-6">Top Recommendations for You</h2>

          <div className="space-y-6">
            {/* Job Card 1 - Perfect Match */}
            <div className="bg-white rounded-lg border p-6 relative">
              <div className="absolute right-6 top-6 flex items-center">
                <div className="bg-purple-100 text-purple-800 text-xs font-medium px-2 py-1 rounded-full flex items-center mr-3">
                  <Sparkles className="h-3 w-3 mr-1" />
                  98% Match
                </div>
                <button className="text-gray-400 hover:text-purple-700">
                  <Bookmark className="h-5 w-5" />
                </button>
              </div>

              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-white border shrink-0">
                  <img src="/placeholder.svg?height=48&width=48" alt="Google Inc." width={48} height={48} />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-1">Senior Frontend Developer</h3>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Briefcase className="h-4 w-4 mr-1" />
                      Google Inc.
                    </div>
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      New York, USA (Remote)
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      Full-time
                    </div>
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 mr-1" />
                      $120,000 - $150,000
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <h4 className="font-medium mb-2">Why we recommend this job:</h4>
                <div className="bg-purple-50 rounded-lg p-3 text-sm">
                  <p className="mb-2">
                    <Sparkles className="h-4 w-4 inline-block mr-1 text-purple-700" />
                    <span className="font-medium">AI Analysis:</span> This position is an excellent match for your
                    skills and experience.
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    <li>
                      Your <span className="font-medium">React</span> and{" "}
                      <span className="font-medium">JavaScript</span> skills match the job requirements
                    </li>
                    <li>
                      The role aligns with your <span className="font-medium">5+ years of experience</span> in frontend
                      development
                    </li>
                    <li>
                      The company culture matches your preference for{" "}
                      <span className="font-medium">innovation-focused</span> environments
                    </li>
                    <li>The salary range matches your expectations</li>
                  </ul>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant="secondary">React</Badge>
                <Badge variant="secondary">JavaScript</Badge>
                <Badge variant="secondary">TypeScript</Badge>
                <Badge variant="secondary">Redux</Badge>
                <Badge variant="secondary">UI/UX</Badge>
                <Badge variant="secondary">Performance Optimization</Badge>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-between">
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <ThumbsUp className="h-4 w-4 mr-1" />
                    Relevant
                  </Button>
                  <Button variant="outline" size="sm">
                    <ThumbsDown className="h-4 w-4 mr-1" />
                    Not Relevant
                  </Button>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline">View Details</Button>
                  <Button className="bg-purple-700 hover:bg-purple-800">Apply Now</Button>
                </div>
              </div>
            </div>

            {/* More job recommendations would go here */}
          </div>

          <div className="mt-6 text-center">
            <Button variant="link" className="text-purple-700">
              View All Recommendations
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>

        {/* Skills-Based Recommendations */}
        <div className="mb-10">
          <h2 className="text-2xl font-semibold mb-6">Based on Your Skills</h2>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Skill-based Job Card 1 */}
            <div className="bg-white rounded-lg border p-4 relative">
              <div className="absolute right-4 top-4 flex items-center">
                <div className="bg-purple-100 text-purple-800 text-xs font-medium px-2 py-1 rounded-full flex items-center mr-2">
                  <Sparkles className="h-3 w-3 mr-1" />
                  React
                </div>
                <button className="text-gray-400 hover:text-purple-700">
                  <Bookmark className="h-4 w-4" />
                </button>
              </div>

              <div className="flex items-start gap-3 mb-3 mt-2">
                <div className="w-10 h-10 rounded-lg overflow-hidden bg-white border shrink-0">
                  <img src="/placeholder.svg?height=40&width=40" alt="Facebook" width={40} height={40} />
                </div>
                <div>
                  <h3 className="font-semibold">React Developer</h3>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
                    <div className="flex items-center">
                      <Briefcase className="h-3 w-3 mr-1" />
                      Facebook
                    </div>
                    <div className="flex items-center">
                      <MapPin className="h-3 w-3 mr-1" />
                      San Francisco, CA
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button size="sm" className="bg-purple-700 hover:bg-purple-800">
                  View Job
                </Button>
              </div>
            </div>

            {/* More skill-based job cards would go here */}
          </div>
        </div>

        {/* Location-Based Recommendations */}
        <div>
          <h2 className="text-2xl font-semibold mb-6">Based on Your Location</h2>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Location-based Job Card 1 */}
            <div className="bg-white rounded-lg border p-4">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg overflow-hidden bg-white border shrink-0">
                  <img src="/placeholder.svg?height=40&width=40" alt="Adobe" width={40} height={40} />
                </div>
                <div>
                  <h3 className="font-semibold">UX Designer</h3>
                  <div className="flex items-center gap-1 text-xs text-gray-600">
                    <Briefcase className="h-3 w-3 mr-1" />
                    Adobe
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center text-gray-600">
                  <MapPin className="h-3 w-3 mr-1" />
                  New York, NY
                </div>
                <Button size="sm" variant="ghost" className="text-purple-700 p-0 h-auto">
                  View
                </Button>
              </div>
            </div>

            {/* More location-based job cards would go here */}
          </div>
        </div>
      </div>
    </div>
  )
}

