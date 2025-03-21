"use client"

import { useState } from "react"
import { useParams, Link } from "react-router-dom"
import {
  Briefcase,
  MapPin,
  Clock,
  DollarSign,
  Calendar,
  Users,
  Building,
  Globe,
  Bookmark,
  Share2,
  Flag,
  CheckCircle,
  Sparkles,
} from "lucide-react"
import { Button } from "../components/ui/button"
import { Badge } from "../components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"

export default function JobDetailsPage() {
  const { id } = useParams()
  const [isSaved, setIsSaved] = useState(false)

  const toggleSave = () => {
    setIsSaved(!isSaved)
  }

  // Mock job data
  const job = {
    id: id,
    title: "Senior Frontend Developer",
    company: "Google Inc.",
    location: "New York, USA (Remote)",
    type: "Full-time",
    salary: "$120,000 - $150,000",
    postedDate: "2 days ago",
    deadline: "Dec 15, 2023",
    applicants: 24,
    experience: "5+ years",
    description: `
      <p>Google is seeking a Senior Frontend Developer to join our dynamic team. The ideal candidate will have a strong background in modern JavaScript frameworks and a passion for creating exceptional user experiences.</p>
      
      <h3>Responsibilities:</h3>
      <ul>
        <li>Develop and maintain high-quality web applications using React, JavaScript, and other modern frontend technologies</li>
        <li>Collaborate with designers, product managers, and backend developers to implement new features</li>
        <li>Optimize applications for maximum speed and scalability</li>
        <li>Write clean, maintainable, and well-documented code</li>
        <li>Participate in code reviews and mentor junior developers</li>
        <li>Stay up-to-date with emerging trends and technologies in frontend development</li>
      </ul>
      
      <h3>Requirements:</h3>
      <ul>
        <li>5+ years of experience in frontend development</li>
        <li>Strong proficiency in JavaScript, HTML, and CSS</li>
        <li>Experience with React</li>
        <li>Familiarity with responsive design and cross-browser compatibility</li>
        <li>Knowledge of frontend build tools and workflows</li>
        <li>Excellent problem-solving and communication skills</li>
        <li>Bachelor's degree in Computer Science or related field (or equivalent experience)</li>
      </ul>
      
      <h3>Benefits:</h3>
      <ul>
        <li>Competitive salary and equity package</li>
        <li>Comprehensive health, dental, and vision insurance</li>
        <li>401(k) plan with company match</li>
        <li>Generous vacation and paid time off</li>
        <li>Professional development opportunities</li>
        <li>Flexible work arrangements</li>
      </ul>
    `,
    skills: ["JavaScript", "React", "HTML/CSS", "Redux", "Responsive Design"],
    matchPercentage: 95,
    matchReasons: [
      "Your React and JavaScript skills match the job requirements",
      "Your 5+ years of experience aligns with the position",
      "Your previous work at tech companies is relevant",
      "Your preference for remote work matches this opportunity",
    ],
    companyInfo: {
      name: "Google Inc.",
      logo: "/placeholder.svg?height=80&width=80",
      website: "https://google.com",
      employees: "10,000+",
      industry: "Technology",
      founded: "1998",
      description:
        "Google is a global technology leader focused on improving the ways people connect with information. Google maintains an index of websites and other content, and makes this information freely available to anyone with an internet connection.",
    },
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start gap-6">
          {/* Main Content */}
          <div className="w-full md:w-2/3 space-y-6">
            {/* Job Header */}
            <div className="bg-white rounded-lg border p-6">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-white border shrink-0">
                  <img src={job.companyInfo.logo || "/placeholder.svg"} alt={job.company} width={80} height={80} />
                </div>
                <div className="flex-1">
                  <h1 className="text-2xl font-bold mb-1">{job.title}</h1>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 mb-4">
                    <div className="flex items-center">
                      <Building className="h-4 w-4 mr-1" />
                      {job.company}
                    </div>
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      {job.location}
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {job.type}
                    </div>
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 mr-1" />
                      {job.salary}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {job.skills.map((skill) => (
                      <Badge key={skill} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Link to={`/apply/${job.id}`}>
                      <Button className="bg-purple-700 hover:bg-purple-800">Apply Now</Button>
                    </Link>
                    <Button
                      variant="outline"
                      className={isSaved ? "text-purple-700 border-purple-200" : ""}
                      onClick={toggleSave}
                    >
                      <Bookmark className={`h-4 w-4 mr-2 ${isSaved ? "fill-current" : ""}`} />
                      {isSaved ? "Saved" : "Save Job"}
                    </Button>
                    <Button variant="outline">
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Flag className="h-4 w-4 text-gray-500" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <Tabs defaultValue="description" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="description">Description</TabsTrigger>
                <TabsTrigger value="company">Company</TabsTrigger>
                <TabsTrigger value="ai-match">AI Match</TabsTrigger>
              </TabsList>

              {/* Description Tab */}
              <TabsContent value="description">
                <div className="bg-white rounded-lg border p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold">Job Description</h2>
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="h-4 w-4 mr-1" />
                      Posted {job.postedDate}
                    </div>
                  </div>

                  <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: job.description }} />

                  <div className="mt-8 pt-6 border-t">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center text-sm">
                          <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                          <span className="text-gray-500">Application Deadline:</span>
                          <span className="font-medium ml-2">{job.deadline}</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <Users className="h-4 w-4 mr-2 text-gray-500" />
                          <span className="text-gray-500">Applicants:</span>
                          <span className="font-medium ml-2">{job.applicants}</span>
                        </div>
                      </div>

                      <Link to={`/apply/${job.id}`}>
                        <Button className="bg-purple-700 hover:bg-purple-800 w-full md:w-auto">Apply Now</Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Company Tab */}
              <TabsContent value="company">
                <div className="bg-white rounded-lg border p-6">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-white border shrink-0">
                      <img
                        src={job.companyInfo.logo || "/placeholder.svg"}
                        alt={job.companyInfo.name}
                        width={80}
                        height={80}
                      />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold mb-1">{job.companyInfo.name}</h2>
                      <div className="flex items-center text-sm text-blue-600">
                        <Globe className="h-4 w-4 mr-1" />
                        <a href={job.companyInfo.website} target="_blank" rel="noopener noreferrer">
                          {job.companyInfo.website.replace("https://", "")}
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                    <div>
                      <div className="text-sm text-gray-500">Industry</div>
                      <div className="font-medium">{job.companyInfo.industry}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Company Size</div>
                      <div className="font-medium">{job.companyInfo.employees}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Founded</div>
                      <div className="font-medium">{job.companyInfo.founded}</div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">About {job.companyInfo.name}</h3>
                    <p className="text-gray-700">{job.companyInfo.description}</p>
                  </div>
                </div>
              </TabsContent>

              {/* AI Match Tab */}
              <TabsContent value="ai-match">
                <div className="bg-white rounded-lg border p-6">
                  <div className="flex items-center gap-2 mb-6">
                    <h2 className="text-xl font-semibold">AI Match Analysis</h2>
                    <Sparkles className="h-5 w-5 text-purple-700" />
                  </div>

                  <div className="flex flex-col md:flex-row items-center gap-6 mb-6">
                    <div className="w-32 h-32 rounded-full bg-purple-100 flex items-center justify-center relative">
                      <div className="text-3xl font-bold text-purple-700">{job.matchPercentage}%</div>
                      <div className="absolute inset-0 rounded-full border-4 border-purple-500 border-r-transparent rotate-45"></div>
                    </div>

                    <div className="flex-1">
                      <h3 className="font-semibold mb-2">Why this job matches your profile</h3>
                      <ul className="space-y-2">
                        {job.matchReasons.map((reason, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                            <span>{reason}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="w-full md:w-1/3 space-y-6">
            {/* Job Summary */}
            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-lg font-semibold mb-4">Job Summary</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Briefcase className="h-5 w-5 text-gray-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium">Job Type</div>
                    <div className="text-sm text-gray-600">{job.type}</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-gray-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium">Location</div>
                    <div className="text-sm text-gray-600">{job.location}</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <DollarSign className="h-5 w-5 text-gray-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium">Salary</div>
                    <div className="text-sm text-gray-600">{job.salary}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Match Score */}
            <div className="bg-gradient-to-r from-purple-700 to-purple-900 rounded-lg p-6 text-white">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-5 w-5" />
                <h2 className="text-lg font-semibold">AI Match Score</h2>
              </div>

              <div className="flex items-center justify-center mb-4">
                <div className="text-5xl font-bold">{job.matchPercentage}%</div>
              </div>

              <p className="text-sm text-white/80 mb-4">This job is a strong match for your skills and preferences.</p>

              <Link to={`/apply/${job.id}`}>
                <Button className="w-full bg-white text-purple-900 hover:bg-white/90">Apply Now</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

