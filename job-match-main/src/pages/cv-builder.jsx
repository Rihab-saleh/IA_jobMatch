"use client"

import { useState } from "react"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Textarea } from "../components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import { PlusCircle, Download, FileText, Edit, Trash2, Upload, Sparkles } from "lucide-react"

export default function CVBuilderPage() {
  const [activeTemplate, setActiveTemplate] = useState("modern")
  const [personalInfo, setPersonalInfo] = useState({
    firstName: "John",
    lastName: "Doe",
    professionalTitle: "Senior Frontend Developer",
    email: "john.doe@example.com",
    phone: "+1 (555) 123-4567",
    location: "New York, USA",
    summary:
      "Experienced frontend developer with over 5 years of expertise in building responsive web applications. Proficient in JavaScript, React, and modern frontend frameworks. Strong problem-solving skills and a passion for creating intuitive user interfaces.",
  })

  const [workExperience, setWorkExperience] = useState([
    {
      id: 1,
      title: "Senior Frontend Developer",
      company: "TechCorp Inc.",
      location: "New York, USA",
      startDate: "January 2020",
      endDate: "Present",
      description:
        "• Led a team of 5 frontend developers in building a responsive web application\n• Implemented modern JavaScript frameworks and improved performance by 40%\n• Collaborated with UX designers to create intuitive user interfaces\n• Mentored junior developers and conducted code reviews",
    },
    {
      id: 2,
      title: "Frontend Developer",
      company: "WebSolutions Ltd.",
      location: "Boston, USA",
      startDate: "March 2017",
      endDate: "December 2019",
      description:
        "• Developed and maintained client websites using HTML, CSS, and JavaScript\n• Collaborated with designers to implement responsive designs\n• Optimized website performance and improved SEO rankings\n• Participated in client meetings to gather requirements",
    },
  ])

  const [education, setEducation] = useState([
    {
      id: 1,
      degree: "Bachelor of Science in Computer Science",
      institution: "Massachusetts Institute of Technology",
      location: "Cambridge, USA",
      startDate: "September 2013",
      endDate: "May 2017",
      description:
        "Graduated with honors. Specialized in software engineering and artificial intelligence. Relevant coursework included Data Structures, Algorithms, Web Development, and Machine Learning.",
    },
  ])

  const [skills, setSkills] = useState([
    "JavaScript",
    "React",
    "HTML/CSS",
    "Node.js",
    "TypeScript",
    "Responsive Design",
  ])

  const handlePersonalInfoChange = (e) => {
    const { name, value } = e.target
    setPersonalInfo({
      ...personalInfo,
      [name]: value,
    })
  }

  const addSkill = () => {
    const newSkill = document.getElementById("new-skill").value.trim()
    if (newSkill && !skills.includes(newSkill)) {
      setSkills([...skills, newSkill])
      document.getElementById("new-skill").value = ""
    }
  }

  const removeSkill = (skillToRemove) => {
    setSkills(skills.filter((skill) => skill !== skillToRemove))
  }

  const addWorkExperience = () => {
    const newId = workExperience.length > 0 ? Math.max(...workExperience.map((exp) => exp.id)) + 1 : 1
    setWorkExperience([
      ...workExperience,
      {
        id: newId,
        title: "",
        company: "",
        location: "",
        startDate: "",
        endDate: "",
        description: "",
      },
    ])
  }

  const removeWorkExperience = (id) => {
    setWorkExperience(workExperience.filter((exp) => exp.id !== id))
  }

  const addEducation = () => {
    const newId = education.length > 0 ? Math.max(...education.map((edu) => edu.id)) + 1 : 1
    setEducation([
      ...education,
      {
        id: newId,
        degree: "",
        institution: "",
        location: "",
        startDate: "",
        endDate: "",
        description: "",
      },
    ])
  }

  const removeEducation = (id) => {
    setEducation(education.filter((edu) => edu.id !== id))
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">CV Builder & Optimizer</h1>
        <p className="text-gray-600 mb-8">Create and optimize your CV with AI-powered suggestions</p>

        <Tabs defaultValue="builder" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="builder">CV Builder</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="optimizer">AI Optimizer</TabsTrigger>
          </TabsList>

          {/* CV Builder Tab */}
          <TabsContent value="builder" className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-6">
                {/* Personal Information */}
                <div className="bg-white rounded-lg border p-6">
                  <h2 className="text-xl font-semibold mb-4">Personal Information</h2>

                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-medium mb-1">
                        First Name
                      </label>
                      <Input
                        id="firstName"
                        name="firstName"
                        value={personalInfo.firstName}
                        onChange={handlePersonalInfoChange}
                      />
                    </div>
                    <div>
                      <label htmlFor="lastName" className="block text-sm font-medium mb-1">
                        Last Name
                      </label>
                      <Input
                        id="lastName"
                        name="lastName"
                        value={personalInfo.lastName}
                        onChange={handlePersonalInfoChange}
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label htmlFor="professionalTitle" className="block text-sm font-medium mb-1">
                      Professional Title
                    </label>
                    <Input
                      id="professionalTitle"
                      name="professionalTitle"
                      value={personalInfo.professionalTitle}
                      onChange={handlePersonalInfoChange}
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium mb-1">
                        Email
                      </label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={personalInfo.email}
                        onChange={handlePersonalInfoChange}
                      />
                    </div>
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium mb-1">
                        Phone
                      </label>
                      <Input id="phone" name="phone" value={personalInfo.phone} onChange={handlePersonalInfoChange} />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label htmlFor="location" className="block text-sm font-medium mb-1">
                      Location
                    </label>
                    <Input
                      id="location"
                      name="location"
                      value={personalInfo.location}
                      onChange={handlePersonalInfoChange}
                    />
                  </div>

                  <div>
                    <label htmlFor="summary" className="block text-sm font-medium mb-1">
                      Professional Summary
                    </label>
                    <Textarea
                      id="summary"
                      name="summary"
                      rows={4}
                      value={personalInfo.summary}
                      onChange={handlePersonalInfoChange}
                    />
                  </div>
                </div>

                {/* Work Experience */}
                <div className="bg-white rounded-lg border p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Work Experience</h2>
                    <Button className="bg-purple-700 hover:bg-purple-800" onClick={addWorkExperience}>
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Add Experience
                    </Button>
                  </div>

                  <div className="space-y-6">
                    {workExperience.map((experience) => (
                      <div key={experience.id} className="border rounded-lg p-4">
                        <div className="flex justify-between mb-2">
                          <h3 className="font-semibold">{experience.title || "New Position"}</h3>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500"
                              onClick={() => removeWorkExperience(experience.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className="block text-xs text-gray-500">Company</label>
                            <p>{experience.company}</p>
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500">Location</label>
                            <p>{experience.location}</p>
                          </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className="block text-xs text-gray-500">Start Date</label>
                            <p>{experience.startDate}</p>
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500">End Date</label>
                            <p>{experience.endDate}</p>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs text-gray-500">Description</label>
                          <p className="text-sm whitespace-pre-line">{experience.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Education */}
                <div className="bg-white rounded-lg border p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Education</h2>
                    <Button className="bg-purple-700 hover:bg-purple-800" onClick={addEducation}>
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Add Education
                    </Button>
                  </div>

                  {education.map((edu) => (
                    <div key={edu.id} className="border rounded-lg p-4">
                      <div className="flex justify-between mb-2">
                        <h3 className="font-semibold">{edu.degree || "New Education"}</h3>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500"
                            onClick={() => removeEducation(edu.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-xs text-gray-500">Institution</label>
                          <p>{edu.institution}</p>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500">Location</label>
                          <p>{edu.location}</p>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-xs text-gray-500">Start Date</label>
                          <p>{edu.startDate}</p>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500">End Date</label>
                          <p>{edu.endDate}</p>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs text-gray-500">Description</label>
                        <p className="text-sm">{edu.description}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Skills */}
                <div className="bg-white rounded-lg border p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Skills</h2>
                    <div className="flex gap-2">
                      <Input id="new-skill" placeholder="Add a skill" className="w-40" />
                      <Button className="bg-purple-700 hover:bg-purple-800" onClick={addSkill}>
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Add
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {skills.map((skill) => (
                      <div key={skill} className="border rounded-lg p-3 flex justify-between items-center">
                        <span>{skill}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 h-6 w-6 p-0"
                          onClick={() => removeSkill(skill)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Preview Panel */}
              <div className="md:col-span-1">
                <div className="bg-white rounded-lg border p-4 sticky top-4">
                  <h2 className="text-lg font-semibold mb-4">CV Preview</h2>
                  <div className="aspect-[3/4] bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
                    <img
                      src="/placeholder.svg?height=400&width=300"
                      alt="CV Preview"
                      width={300}
                      height={400}
                      className="rounded-lg"
                    />
                  </div>
                  <div className="space-y-3">
                    <Button className="w-full bg-purple-700 hover:bg-purple-800">
                      <Download className="h-4 w-4 mr-2" />
                      Download PDF
                    </Button>
                    <Button variant="outline" className="w-full">
                      <FileText className="h-4 w-4 mr-2" />
                      Preview
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-6">
            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-xl font-semibold mb-4">Choose a Template</h2>
              <p className="text-gray-600 mb-6">
                Select a professional template for your CV. You can switch templates at any time without losing your
                content.
              </p>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {/* Template 1 */}
                <div className={`border rounded-lg p-2 ${activeTemplate === "modern" ? "ring-2 ring-purple-700" : ""}`}>
                  <div className="aspect-[3/4] bg-gray-100 rounded-lg mb-2 overflow-hidden">
                    <img
                      src="/placeholder.svg?height=300&width=225"
                      alt="Modern Template"
                      width={225}
                      height={300}
                      className="object-cover"
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Modern</span>
                    <Button
                      variant={activeTemplate === "modern" ? "default" : "outline"}
                      size="sm"
                      className={activeTemplate === "modern" ? "bg-purple-700 hover:bg-purple-800" : ""}
                      onClick={() => setActiveTemplate("modern")}
                    >
                      {activeTemplate === "modern" ? "Selected" : "Select"}
                    </Button>
                  </div>
                </div>

                {/* Template 2 */}
                <div
                  className={`border rounded-lg p-2 ${activeTemplate === "professional" ? "ring-2 ring-purple-700" : ""}`}
                >
                  <div className="aspect-[3/4] bg-gray-100 rounded-lg mb-2 overflow-hidden">
                    <img
                      src="/placeholder.svg?height=300&width=225"
                      alt="Professional Template"
                      width={225}
                      height={300}
                      className="object-cover"
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Professional</span>
                    <Button
                      variant={activeTemplate === "professional" ? "default" : "outline"}
                      size="sm"
                      className={activeTemplate === "professional" ? "bg-purple-700 hover:bg-purple-800" : ""}
                      onClick={() => setActiveTemplate("professional")}
                    >
                      {activeTemplate === "professional" ? "Selected" : "Select"}
                    </Button>
                  </div>
                </div>

                {/* More templates would go here */}
              </div>
            </div>
          </TabsContent>

          {/* AI Optimizer Tab */}
          <TabsContent value="optimizer" className="space-y-6">
            <div className="bg-white rounded-lg border p-6">
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-xl font-semibold">AI CV Optimizer</h2>
                <Sparkles className="h-5 w-5 text-purple-700" />
              </div>
              <p className="text-gray-600 mb-6">
                Our AI will analyze your CV and provide personalized suggestions to improve it and increase your chances
                of getting noticed by recruiters.
              </p>

              <div className="mb-6">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <div className="flex flex-col items-center">
                    <Upload className="h-10 w-10 text-gray-400 mb-4" />
                    <h3 className="font-medium mb-2">Upload your existing CV</h3>
                    <p className="text-sm text-gray-500 mb-4">Drag and drop your CV file here, or click to browse</p>
                    <Button className="bg-purple-700 hover:bg-purple-800">Browse Files</Button>
                    <p className="text-xs text-gray-500 mt-2">Supported formats: PDF, DOCX, TXT (Max 5MB)</p>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-medium mb-3">Or analyze your current CV</h3>
                <Button className="bg-purple-700 hover:bg-purple-800">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Analyze Current CV
                </Button>
              </div>

              <div className="border-t pt-6">
                <h3 className="font-medium mb-4">AI Optimization Features</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-purple-100 p-2 rounded-full">
                      <Sparkles className="h-5 w-5 text-purple-700" />
                    </div>
                    <div>
                      <h4 className="font-medium">Keyword Optimization</h4>
                      <p className="text-sm text-gray-600">
                        Our AI analyzes job descriptions and suggests keywords to include in your CV to pass Applicant
                        Tracking Systems (ATS).
                      </p>
                    </div>
                  </div>

                  {/* More features would go here */}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

