"use client"

import { useState } from "react"
import { Link } from "react-router-dom"
import { Button } from "../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import { Badge } from "../components/ui/badge"
import { Progress } from "../components/ui/progress"
import {
  Briefcase,
  Clock,
  FileText,
  BarChart2,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronRight,
  Calendar,
  MapPin,
  Building,
  DollarSign,
  Star,
  Bookmark,
  Eye,
} from "lucide-react"

export default function DashboardPage() {
  const [savedJobs, setSavedJobs] = useState([2, 3])

  const toggleSaveJob = (jobId) => {
    if (savedJobs.includes(jobId)) {
      setSavedJobs(savedJobs.filter((id) => id !== jobId))
    } else {
      setSavedJobs([...savedJobs, jobId])
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-gray-600 mb-8">Welcome back, John Doe</p>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Applications</CardTitle>
              <Briefcase className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-gray-500">Total job applications</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Interviews</CardTitle>
              <Calendar className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-gray-500">Upcoming interviews</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Saved Jobs</CardTitle>
              <Bookmark className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{savedJobs.length}</div>
              <p className="text-xs text-gray-500">Jobs saved for later</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Profile Views</CardTitle>
              <Eye className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">48</div>
              <p className="text-xs text-gray-500">Recruiters viewed your profile</p>
            </CardContent>
          </Card>
        </div>

        {/* Profile Completion */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Profile Completion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="text-lg font-bold">75%</div>
                  <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                    In Progress
                  </Badge>
                </div>
                <p className="text-sm text-gray-500">Complete your profile to increase your chances of getting hired</p>
              </div>
              <Button className="mt-3 md:mt-0 bg-purple-700 hover:bg-purple-800">Complete Profile</Button>
            </div>
            <Progress value={75} className="h-2 bg-gray-200" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              <div className="flex items-start gap-3">
                <div className="bg-green-100 p-2 rounded-full">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-medium">Personal Information</h3>
                  <p className="text-sm text-gray-500">Basic details completed</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-green-100 p-2 rounded-full">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-medium">Work Experience</h3>
                  <p className="text-sm text-gray-500">2 experiences added</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-red-100 p-2 rounded-full">
                  <XCircle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <h3 className="font-medium">Resume/CV</h3>
                  <p className="text-sm text-gray-500">Upload your resume</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="applications" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="applications">Applications</TabsTrigger>
            <TabsTrigger value="saved">Saved Jobs</TabsTrigger>
            <TabsTrigger value="recommended">Recommended</TabsTrigger>
          </TabsList>

          {/* Applications Tab */}
          <TabsContent value="applications">
            <Card>
              <CardHeader>
                <CardTitle>Recent Applications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Application 1 */}
                  <div className="border rounded-lg p-4">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-white border shrink-0">
                          <img src="/placeholder.svg?height=48&width=48" alt="Google Inc." width={48} height={48} />
                        </div>
                        <div>
                          <h3 className="font-semibold">Senior Frontend Developer</h3>
                          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                            <div className="flex items-center">
                              <Building className="h-4 w-4 mr-1" />
                              Google Inc.
                            </div>
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 mr-1" />
                              New York, USA
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end">
                        <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">In Review</Badge>
                        <div className="text-sm text-gray-500 mt-1">Applied on Nov 15, 2023</div>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center">
                            <FileText className="h-4 w-4 mr-1 text-gray-500" />
                            <span className="text-sm">Resume_John_Doe.pdf</span>
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1 text-gray-500" />
                            <span className="text-sm">Full-time</span>
                          </div>
                        </div>
                        <div className="mt-3 md:mt-0">
                          <Link to="/applications/1">
                            <Button variant="outline" size="sm">
                              View Application
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Application 2 */}
                  <div className="border rounded-lg p-4">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-white border shrink-0">
                          <img src="/placeholder.svg?height=48&width=48" alt="Microsoft" width={48} height={48} />
                        </div>
                        <div>
                          <h3 className="font-semibold">UX Designer</h3>
                          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                            <div className="flex items-center">
                              <Building className="h-4 w-4 mr-1" />
                              Microsoft
                            </div>
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 mr-1" />
                              Seattle, WA
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end">
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Interview Scheduled</Badge>
                        <div className="text-sm text-gray-500 mt-1">Applied on Nov 10, 2023</div>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center">
                            <FileText className="h-4 w-4 mr-1 text-gray-500" />
                            <span className="text-sm">Resume_John_Doe.pdf</span>
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1 text-gray-500" />
                            <span className="text-sm">Full-time</span>
                          </div>
                        </div>
                        <div className="mt-3 md:mt-0">
                          <Link to="/applications/2">
                            <Button variant="outline" size="sm">
                              View Application
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* More applications would go here */}
                </div>

                <div className="mt-6 text-center">
                  <Link to="/applications">
                    <Button variant="link" className="text-purple-700">
                      View All Applications
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Saved Jobs Tab */}
          <TabsContent value="saved">
            <Card>
              <CardHeader>
                <CardTitle>Saved Jobs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Saved Job 1 */}
                  <div className="border rounded-lg p-4 relative">
                    <button className="absolute right-4 top-4 text-purple-700" onClick={() => toggleSaveJob(2)}>
                      <Bookmark className="h-5 w-5 fill-current" />
                    </button>

                    <div className="flex items-start gap-3 pr-8">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-white border shrink-0">
                        <img src="/placeholder.svg?height=48&width=48" alt="Apple" width={48} height={48} />
                      </div>
                      <div>
                        <h3 className="font-semibold">Product Designer</h3>
                        <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                          <div className="flex items-center">
                            <Building className="h-4 w-4 mr-1" />
                            Apple
                          </div>
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            Cupertino, CA
                          </div>
                          <div className="flex items-center">
                            <DollarSign className="h-4 w-4 mr-1" />
                            $120,000 - $150,000
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <Badge variant="secondary">UI/UX</Badge>
                      <Badge variant="secondary">Product Design</Badge>
                      <Badge variant="secondary">Figma</Badge>
                    </div>

                    <div className="mt-4 pt-4 border-t flex justify-between items-center">
                      <div className="text-sm text-gray-500">Posted 2 days ago</div>
                      <div className="flex gap-2">
                        <Link to="/jobs/2">
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </Link>
                        <Link to="/apply/2">
                          <Button size="sm" className="bg-purple-700 hover:bg-purple-800">
                            Apply Now
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Saved Job 2 */}
                  <div className="border rounded-lg p-4 relative">
                    <button className="absolute right-4 top-4 text-purple-700" onClick={() => toggleSaveJob(3)}>
                      <Bookmark className="h-5 w-5 fill-current" />
                    </button>

                    <div className="flex items-start gap-3 pr-8">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-white border shrink-0">
                        <img src="/placeholder.svg?height=48&width=48" alt="Netflix" width={48} height={48} />
                      </div>
                      <div>
                        <h3 className="font-semibold">Frontend Developer</h3>
                        <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                          <div className="flex items-center">
                            <Building className="h-4 w-4 mr-1" />
                            Netflix
                          </div>
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            Los Angeles, CA (Remote)
                          </div>
                          <div className="flex items-center">
                            <DollarSign className="h-4 w-4 mr-1" />
                            $100,000 - $130,000
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <Badge variant="secondary">React</Badge>
                      <Badge variant="secondary">JavaScript</Badge>
                      <Badge variant="secondary">CSS</Badge>
                    </div>

                    <div className="mt-4 pt-4 border-t flex justify-between items-center">
                      <div className="text-sm text-gray-500">Posted 5 days ago</div>
                      <div className="flex gap-2">
                        <Link to="/jobs/3">
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </Link>
                        <Link to="/apply/3">
                          <Button size="sm" className="bg-purple-700 hover:bg-purple-800">
                            Apply Now
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* More saved jobs would go here */}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Recommended Jobs Tab */}
          <TabsContent value="recommended">
            <Card>
              <CardHeader>
                <CardTitle>Recommended for You</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Recommended Job 1 */}
                  <div className="border rounded-lg p-4 relative">
                    <div className="absolute right-4 top-4 flex items-center">
                      <div className="bg-purple-100 text-purple-800 text-xs font-medium px-2 py-1 rounded-full flex items-center mr-3">
                        <Star className="h-3 w-3 mr-1 fill-current" />
                        95% Match
                      </div>
                      <button className="text-gray-400 hover:text-purple-700" onClick={() => toggleSaveJob(4)}>
                        <Bookmark
                          className={`h-5 w-5 ${savedJobs.includes(4) ? "fill-current text-purple-700" : ""}`}
                        />
                      </button>
                    </div>

                    <div className="flex items-start gap-3 pr-8">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-white border shrink-0">
                        <img src="/placeholder.svg?height=48&width=48" alt="Facebook" width={48} height={48} />
                      </div>
                      <div>
                        <h3 className="font-semibold">Senior React Developer</h3>
                        <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                          <div className="flex items-center">
                            <Building className="h-4 w-4 mr-1" />
                            Facebook
                          </div>
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            Menlo Park, CA (Hybrid)
                          </div>
                          <div className="flex items-center">
                            <DollarSign className="h-4 w-4 mr-1" />
                            $140,000 - $180,000
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <Badge variant="secondary">React</Badge>
                      <Badge variant="secondary">JavaScript</Badge>
                      <Badge variant="secondary">Redux</Badge>
                      <Badge variant="secondary">TypeScript</Badge>
                    </div>

                    <div className="mt-4 pt-4 border-t flex justify-between items-center">
                      <div className="text-sm text-gray-500">Posted 1 day ago</div>
                      <div className="flex gap-2">
                        <Link to="/jobs/4">
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </Link>
                        <Link to="/apply/4">
                          <Button size="sm" className="bg-purple-700 hover:bg-purple-800">
                            Apply Now
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* More recommended jobs would go here */}
                </div>

                <div className="mt-6 text-center">
                  <Link to="/recommendations">
                    <Button variant="link" className="text-purple-700">
                      View All Recommendations
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Application Statistics */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Application Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center gap-4">
                <div className="bg-blue-100 p-3 rounded-full">
                  <BarChart2 className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">12</div>
                  <p className="text-sm text-gray-500">Total Applications</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="bg-green-100 p-3 rounded-full">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">3</div>
                  <p className="text-sm text-gray-500">Interviews Scheduled</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="bg-yellow-100 p-3 rounded-full">
                  <AlertCircle className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">7</div>
                  <p className="text-sm text-gray-500">Pending Review</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

