"use client"

import { useState, useEffect } from "react"
import { useParams, Link } from "react-router-dom"
import { Button } from "../components/ui/button"
import { Badge } from "../components/ui/badge"
import { Card, CardContent } from "../components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import {
  Bookmark,
  Share2,
  MapPin,
  Building,
  Clock,
  DollarSign,
  Calendar,
  Users,
  Briefcase,
  CheckCircle,
  AlertCircle,
  ChevronLeft,
} from "lucide-react"
import  * as jobService from "../services/job-service.js"

export default function JobDetailsView() {
  const { id } = useParams()
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const fetchJobDetails = async () => {
      try {
        setLoading(true)
        // In a real app, you would fetch the job details from your API
        const jobData = await jobService.getJobById(id)
        setJob(jobData)
        setLoading(false)
      } catch (err) {
        setError("Failed to load job details. Please try again.")
        setLoading(false)
      }
    }

    fetchJobDetails()
  }, [id])

  // Mock job data for demonstration
  useEffect(() => {
    // This simulates an API response
    setTimeout(() => {
      setJob({
        id: id,
        title: "Senior Frontend Developer",
        company: "Google Inc.",
        location: "New York, USA (Hybrid)",
        type: "Full-time",
        salary: "$120,000 - $150,000",
        postedDate: "2 weeks ago",
        deadline: "December 15, 2023",
        applicants: 45,
        experience: "5+ years",
        description: `
          <h3>About the Role</h3>
          <p>We are looking for a Senior Frontend Developer to join our team. You will be responsible for building and maintaining user interfaces for our web applications.</p>
          
          <h3>Responsibilities</h3>
          <ul>
            <li>Develop new user-facing features using React.js</li>
            <li>Build reusable components and front-end libraries for future use</li>
            <li>Translate designs and wireframes into high-quality code</li>
            <li>Optimize components for maximum performance across a vast array of web-capable devices and browsers</li>
            <li>Collaborate with the design team to implement visual elements</li>
          </ul>
          
          <h3>Requirements</h3>
          <ul>
            <li>5+ years of experience in frontend development</li>
            <li>Strong proficiency in JavaScript, including DOM manipulation and the JavaScript object model</li>
            <li>Thorough understanding of React.js and its core principles</li>
            <li>Experience with popular React.js workflows (such as Redux)</li>
            <li>Familiarity with newer specifications of ECMAScript</li>
            <li>Experience with data structure libraries (e.g., Immutable.js)</li>
            <li>Knowledge of isomorphic React is a plus</li>
            <li>Understanding of server-side rendering</li>
          </ul>
          
          <h3>Benefits</h3>
          <ul>
            <li>Competitive salary and equity</li>
            <li>Health, dental, and vision insurance</li>
            <li>Unlimited PTO</li>
            <li>401(k) with company match</li>
            <li>Flexible work arrangements</li>
            <li>Professional development budget</li>
          </ul>
        `,
        skills: ["React", "JavaScript", "TypeScript", "Redux", "HTML/CSS", "Responsive Design"],
        benefits: ["Health Insurance", "401(k)", "Remote Work", "Flexible Hours", "Professional Development"],
        companyInfo: {
          name: "Google Inc.",
          logo: "/placeholder.svg?height=80&width=80",
          description:
            "Google LLC is an American multinational technology company that specializes in Internet-related services and products, which include online advertising technologies, a search engine, cloud computing, software, and hardware.",
          employees: "100,000+",
          industry: "Technology",
          website: "https://www.google.com",
        },
      })
      setLoading(false)
    }, 1000)
  }, [id])

  const toggleSaveJob = () => {
    setSaved(!saved)
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="h-64 bg-gray-200 rounded mb-6"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 text-red-700 p-4 rounded-lg">
            <AlertCircle className="h-5 w-5 inline-block mr-2" />
            {error}
          </div>
          <Button className="mt-4" onClick={() => window.history.back()}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  if (!job) return null

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Button variant="ghost" className="mb-4" onClick={() => window.history.back()}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Jobs
          </Button>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-white border shrink-0">
                <img src={job.companyInfo.logo || "/placeholder.svg"} alt={job.company} width={64} height={64} />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{job.title}</h1>
                <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                  <div className="flex items-center">
                    <Building className="h-4 w-4 mr-1" />
                    {job.company}
                  </div>
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    {job.location}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={toggleSaveJob}>
                <Bookmark className={`h-4 w-4 mr-2 ${saved ? "fill-current" : ""}`} />
                {saved ? "Saved" : "Save Job"}
              </Button>
              <Button variant="outline">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <Clock className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">Job Type</p>
                <p className="font-medium">{job.type}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <DollarSign className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">Salary</p>
                <p className="font-medium">{job.salary}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <Calendar className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">Posted</p>
                <p className="font-medium">{job.postedDate}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div className="flex flex-wrap gap-2">
              {job.skills.map((skill, index) => (
                <Badge key={index} variant="secondary">
                  {skill}
                </Badge>
              ))}
            </div>
            <Link to={`/apply/${job.id}`}>
              <Button className="w-full sm:w-auto bg-purple-700 hover:bg-purple-800">Apply Now</Button>
            </Link>
          </div>
        </div>

        <Tabs defaultValue="description" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="description">Description</TabsTrigger>
            <TabsTrigger value="company">Company</TabsTrigger>
            <TabsTrigger value="similar">Similar Jobs</TabsTrigger>
          </TabsList>

          <TabsContent value="description">
            <Card>
              <CardContent className="pt-6">
                <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: job.description }}></div>

                <div className="mt-8">
                  <h3 className="text-lg font-semibold mb-4">Job Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-5 w-5 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-500">Experience</p>
                        <p className="font-medium">{job.experience}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-500">Applicants</p>
                        <p className="font-medium">{job.applicants} applied</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-500">Deadline</p>
                        <p className="font-medium">{job.deadline}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8">
                  <h3 className="text-lg font-semibold mb-4">Benefits</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {job.benefits.map((benefit, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span>{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-8 flex justify-center">
                  <Link to={`/apply/${job.id}`}>
                    <Button className="bg-purple-700 hover:bg-purple-800 px-8">Apply for this position</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="company">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-white border shrink-0">
                    <img
                      src={job.companyInfo.logo || "/placeholder.svg"}
                      alt={job.companyInfo.name}
                      width={64}
                      height={64}
                    />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{job.companyInfo.name}</h3>
                    <a
                      href={job.companyInfo.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-purple-700 hover:underline"
                    >
                      {job.companyInfo.website}
                    </a>
                  </div>
                </div>

                <div className="mb-6">
                  <p className="mb-4">{job.companyInfo.description}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Industry</p>
                      <p className="font-medium">{job.companyInfo.industry}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Company Size</p>
                      <p className="font-medium">{job.companyInfo.employees}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-8">
                  <h3 className="text-lg font-semibold mb-4">More Jobs at {job.companyInfo.name}</h3>
                  <div className="space-y-4">
                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium">Product Designer</h4>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 mt-1">
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          San Francisco, CA
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          Full-time
                        </div>
                      </div>
                      <div className="mt-3">
                        <Link to="/jobs/5">
                          <Button variant="outline" size="sm">
                            View Job
                          </Button>
                        </Link>
                      </div>
                    </div>
                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium">Backend Developer</h4>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 mt-1">
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          New York, USA
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          Full-time
                        </div>
                      </div>
                      <div className="mt-3">
                        <Link to="/jobs/6">
                          <Button variant="outline" size="sm">
                            View Job
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="similar">
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4">Similar Jobs</h3>
                <div className="space-y-6">
                  {/* Similar Job 1 */}
                  <div className="border rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-white border shrink-0">
                        <img src="/placeholder.svg?height=48&width=48" alt="Facebook" width={48} height={48} />
                      </div>
                      <div>
                        <h4 className="font-semibold">Senior Frontend Engineer</h4>
                        <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                          <div className="flex items-center">
                            <Building className="h-4 w-4 mr-1" />
                            Facebook
                          </div>
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            Menlo Park, CA
                          </div>
                          <div className="flex items-center">
                            <DollarSign className="h-4 w-4 mr-1" />
                            $130,000 - $160,000
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge variant="secondary">React</Badge>
                      <Badge variant="secondary">JavaScript</Badge>
                      <Badge variant="secondary">Redux</Badge>
                    </div>
                    <div className="mt-3">
                      <Link to="/jobs/7">
                        <Button variant="outline" size="sm">
                          View Job
                        </Button>
                      </Link>
                    </div>
                  </div>

                  {/* Similar Job 2 */}
                  <div className="border rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-white border shrink-0">
                        <img src="/placeholder.svg?height=48&width=48" alt="Amazon" width={48} height={48} />
                      </div>
                      <div>
                        <h4 className="font-semibold">Frontend Developer</h4>
                        <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                          <div className="flex items-center">
                            <Building className="h-4 w-4 mr-1" />
                            Amazon
                          </div>
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            Seattle, WA
                          </div>
                          <div className="flex items-center">
                            <DollarSign className="h-4 w-4 mr-1" />
                            $110,000 - $140,000
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge variant="secondary">React</Badge>
                      <Badge variant="secondary">JavaScript</Badge>
                      <Badge variant="secondary">AWS</Badge>
                    </div>
                    <div className="mt-3">
                      <Link to="/jobs/8">
                        <Button variant="outline" size="sm">
                          View Job
                        </Button>
                      </Link>
                    </div>
                  </div>

                  {/* Similar Job 3 */}
                  <div className="border rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-white border shrink-0">
                        <img src="/placeholder.svg?height=48&width=48" alt="Microsoft" width={48} height={48} />
                      </div>
                      <div>
                        <h4 className="font-semibold">UI/UX Developer</h4>
                        <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                          <div className="flex items-center">
                            <Building className="h-4 w-4 mr-1" />
                            Microsoft
                          </div>
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            Redmond, WA
                          </div>
                          <div className="flex items-center">
                            <DollarSign className="h-4 w-4 mr-1" />
                            $115,000 - $145,000
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge variant="secondary">React</Badge>
                      <Badge variant="secondary">UI/UX</Badge>
                      <Badge variant="secondary">Figma</Badge>
                    </div>
                    <div className="mt-3">
                      <Link to="/jobs/9">
                        <Button variant="outline" size="sm">
                          View Job
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

