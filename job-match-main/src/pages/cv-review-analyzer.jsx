

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Progress } from "../components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import { Sparkles, Loader2, CheckCircle, AlertCircle, XCircle, Info } from 'lucide-react'
import { Badge } from "../components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../components/ui/accordion"
import {reviewCV} from "../services/ai-service"
export default function CVReviewAnalyzer({ personalInfo, workExperience, education, skills, languages, certifications }) {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [reviewResults, setReviewResults] = useState(null)
  const [activeTab, setActiveTab] = useState("overview")

  const handleAnalyzeCV = async () => {
    setIsAnalyzing(true)
    
    try {
      const cvData = {
        personalInfo,
        workExperience,
        education,
        skills: skills?.map(skill => ({ name: skill.name, level: skill.level })),
        languages: languages?.map(lang => ({ name: lang.name, level: lang.level })),
        certifications: certifications?.map(cert => ({ 
          name: cert.name, 
          issuer: cert.issuer,
          issueDate: cert.issueDate,
          expirationDate: cert.expirationDate
        }))
      }
console.log("cvData : ---------------  ", cvData)
      const response = await reviewCV(cvData)
console.log("response : ---------------  ", response)
      if (!response) {
        throw new Error("Failed to analyze CV")
      }

      const result = await response
      setReviewResults(result)
      setActiveTab("overview")
    } catch (error) {
      console.error("Error analyzing CV:", error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const getSeverityColor = (score) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-amber-600"
    return "text-red-600"
  }

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case "high":
        return <Badge variant="destructive" className="ml-2">Critical</Badge>
      case "medium":
        return <Badge variant="warning" className="bg-amber-500 ml-2">Important</Badge>
      case "low":
        return <Badge variant="outline" className="ml-2">Suggestion</Badge>
      default:
        return null
    }
  }

  const getIssueIcon = (severity) => {
    switch (severity) {
      case "high":
        return <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
      case "medium":
        return <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0" />
      case "low":
        return <Info className="h-5 w-5 text-blue-500 flex-shrink-0" />
      default:
        return <Info className="h-5 w-5 text-gray-500 flex-shrink-0" />
    }
  }

  if (!reviewResults) {
    return (
      <Card className="border shadow-sm">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
          <CardTitle className="text-xl text-blue-800 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600" />
            Professional CV Review
          </CardTitle>
          <CardDescription>
            Get a comprehensive analysis of your CV with personalized feedback from AI
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <div className="mx-auto w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-4">
              <Sparkles className="h-10 w-10 text-blue-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to analyze your CV</h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Our AI will review your entire CV and provide detailed feedback on each section, with actionable suggestions to improve your chances of getting noticed by recruiters.
            </p>
            <Button 
              className="bg-blue-700 hover:bg-blue-800 text-white"
              onClick={handleAnalyzeCV}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing your CV...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Analyze My CV
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border shadow-sm">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl text-blue-800 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-600" />
              CV Analysis Results
            </CardTitle>
            <CardDescription>
              Review the detailed feedback and suggestions to improve your CV
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-blue-800">{reviewResults.overallScore}%</span>
            <div className="w-12 h-12 rounded-full border-4 flex items-center justify-center"
              style={{ 
                borderColor: `${reviewResults.overallScore >= 80 ? 'rgb(22, 163, 74)' : 
                  reviewResults.overallScore >= 60 ? 'rgb(217, 119, 6)' : 'rgb(220, 38, 38)'}` 
              }}
            >
              {reviewResults.overallScore >= 80 ? (
                <CheckCircle className="h-6 w-6 text-green-600" />
              ) : reviewResults.overallScore >= 60 ? (
                <AlertCircle className="h-6 w-6 text-amber-600" />
              ) : (
                <XCircle className="h-6 w-6 text-red-600" />
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-3 rounded-none border-b">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="sections">Section Analysis</TabsTrigger>
            <TabsTrigger value="improvements">Improvement Plan</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="p-6 space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">CV Strength Assessment</h3>
              <div className="grid gap-4">
                {reviewResults.sectionScores?.map((section) => (
                  <div key={section.name} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{section.name}</span>
                      <span className={`text-sm font-medium ${getSeverityColor(section.score)}`}>
                        {section.score}%
                      </span>
                    </div>
                    <Progress value={section.score} className="h-2" />
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Key Findings</h3>
              <div className="space-y-3">
                {reviewResults.keyFindings?.map((finding, index) => (
                  <div key={index} className="flex gap-3 p-3 rounded-lg bg-gray-50 border">
                    {finding.type === 'positive' ? (
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0" />
                    )}
                    <div>
                      <p className={`font-medium ${finding.type === 'positive' ? 'text-green-700' : 'text-amber-700'}`}>
                        {finding.title}
                      </p>
                      <p className="text-sm text-gray-600">{finding.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">ATS Compatibility</h3>
              <div className="p-4 rounded-lg border bg-blue-50 border-blue-100">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-blue-800">ATS Compatibility Score</span>
                  <span className={`font-medium ${getSeverityColor(reviewResults.atsScore)}`}>
                    {reviewResults.atsScore}%
                  </span>
                </div>
                <Progress value={reviewResults.atsScore} className="h-2 mb-4" />
                <p className="text-sm text-blue-700 mb-3">
                  {reviewResults.atsScore >= 80 
                    ? "Your CV is well-optimized for Applicant Tracking Systems." 
                    : reviewResults.atsScore >= 60 
                    ? "Your CV needs some improvements to better pass through ATS systems." 
                    : "Your CV may struggle to pass through ATS systems and needs significant improvements."}
                </p>
                <div className="space-y-2">
                  {reviewResults.atsIssues?.map((issue, index) => (
                    <div key={index} className="flex gap-2 items-start">
                      {getIssueIcon(issue.severity)}
                      <span className="text-sm text-gray-700">{issue.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="sections" className="p-6 space-y-6">
            <Accordion type="single" collapsible className="w-full">
              {reviewResults.sectionAnalysis?.map((section) => (
                <AccordionItem key={section.name} value={section.name}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center justify-between w-full pr-4">
                      <span>{section.name}</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${getSeverityColor(section.score)}`}>
                          {section.score}%
                        </span>
                        <div className="w-8 h-8 rounded-full flex items-center justify-center"
                          style={{ 
                            backgroundColor: `${section.score >= 80 ? 'rgb(240, 253, 244)' : 
                              section.score >= 60 ? 'rgb(254, 249, 195)' : 'rgb(254, 226, 226)'}` 
                          }}
                        >
                          {section.score >= 80 ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : section.score >= 60 ? (
                            <AlertCircle className="h-4 w-4 text-amber-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-2">
                    <p className="text-gray-700">{section.overview}</p>
                    
                    {section.issues?.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="font-medium text-gray-900">Issues to Address</h4>
                        {section.issues?.map((issue, index) => (
                          <div key={index} className="flex gap-3 p-3 rounded-lg bg-gray-50 border">
                            {getIssueIcon(issue.severity)}
                            <div>
                              <p className="font-medium text-gray-800">
                                {issue.title}
                                {getSeverityBadge(issue.severity)}
                              </p>
                              <p className="text-sm text-gray-600">{issue.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {section?.strengths?.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="font-medium text-gray-900">Strengths</h4>
                        {section?.strengths?.map((strength, index) => (
                          <div key={index} className="flex gap-3 p-3 rounded-lg bg-green-50 border border-green-100">
                            <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                            <div>
                              <p className="font-medium text-green-800">{strength.title}</p>
                              <p className="text-sm text-green-700">{strength.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {section?.recommendations?.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="font-medium text-gray-900">Recommendations</h4>
                        <div className="space-y-2">
                          {section?.recommendations?.map((rec, index) => (
                            <div key={index} className="flex gap-2 items-start">
                              <Sparkles className="h-5 w-5 text-blue-500 flex-shrink-0" />
                              <span className="text-sm text-gray-700">{rec}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </TabsContent>

          <TabsContent value="improvements" className="p-6 space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Prioritized Improvement Plan</h3>
              <p className="text-gray-600">
                Focus on these improvements in order of priority to maximize the impact on your CV.
              </p>
              
              <div className="space-y-4 mt-4">
                {reviewResults?.improvementPlan?.map((item, index) => (
                  <div key={index} className="border rounded-lg overflow-hidden">
                    <div className="bg-gray-50 p-3 border-b flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-medium text-sm">
                          {index + 1}
                        </div>
                        <h4 className="font-medium">{item.title}</h4>
                      </div>
                      <Badge 
                        className={
                          item.priority === "high" 
                            ? "bg-red-100 text-red-800 hover:bg-red-100" 
                            : item.priority === "medium" 
                            ? "bg-amber-100 text-amber-800 hover:bg-amber-100" 
                            : "bg-blue-100 text-blue-800 hover:bg-blue-100"
                        }
                      >
                        {item.priority === "high" ? "High Priority" : item.priority === "medium" ? "Medium Priority" : "Low Priority"}
                      </Badge>
                    </div>
                    <div className="p-4">
                      <p className="text-gray-700 mb-3">{item.description}</p>
                      <div className="space-y-2">
                        <h5 className="text-sm font-medium text-gray-700">Action Steps:</h5>
                        <ul className="space-y-1">
                          {item.steps?.map((step, stepIndex) => (
                            <li key={stepIndex} className="flex gap-2 text-sm">
                              <span className="text-blue-500">•</span>
                              <span>{step}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t">
              <Button 
                className="bg-blue-700 hover:bg-blue-800 text-white"
                onClick={handleAnalyzeCV}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Re-analyze CV
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
