"use client"

import { useState } from "react"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Image,
  LinkIcon,
} from "lucide-react"

export default function PostJobPage() {
  const [jobData, setJobData] = useState({
    title: "",
    tags: "",
    jobRole: "",
    minSalary: "",
    maxSalary: "",
    salaryType: "",
    vacancies: "",
    jobLevel: "",
    country: "",
    city: "",
    description: "",
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setJobData({
      ...jobData,
      [name]: value,
    })
  }

  const handleSelectChange = (name, value) => {
    setJobData({
      ...jobData,
      [name]: value,
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log("Job data submitted:", jobData)
    // Here you would typically send the data to your API
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Post a job</h1>
        <p className="text-gray-600 mb-8">Find the best talent for your company</p>

        <form className="space-y-8" onSubmit={handleSubmit}>
          {/* Job Title */}
          <div>
            <label htmlFor="title" className="block text-lg font-medium mb-2">
              Job Title
            </label>
            <Input
              id="title"
              name="title"
              value={jobData.title}
              onChange={handleChange}
              placeholder="Add job title, role vacancies etc"
              className="w-full"
            />
          </div>

          {/* Tags and Job Role */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="tags" className="block text-lg font-medium mb-2">
                Tags
              </label>
              <Input
                id="tags"
                name="tags"
                value={jobData.tags}
                onChange={handleChange}
                placeholder="Job keyword, tags etc.."
                className="w-full"
              />
            </div>
            <div>
              <label htmlFor="jobRole" className="block text-lg font-medium mb-2">
                Job Role
              </label>
              <Select value={jobData.jobRole} onValueChange={(value) => handleSelectChange("jobRole", value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="developer">Developer</SelectItem>
                  <SelectItem value="designer">Designer</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="sales">Sales</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Salary */}
          <div>
            <label className="block text-lg font-medium mb-2">Salary</label>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="minSalary" className="block text-sm font-medium mb-1">
                  Min Salary
                </label>
                <div className="flex">
                  <Input
                    id="minSalary"
                    name="minSalary"
                    value={jobData.minSalary}
                    onChange={handleChange}
                    placeholder="Minimum Salary..."
                    className="rounded-r-none"
                  />
                  <div className="flex items-center justify-center bg-gray-100 border border-l-0 border-gray-300 rounded-r-md px-3">
                    INR
                  </div>
                </div>
              </div>
              <div>
                <label htmlFor="maxSalary" className="block text-sm font-medium mb-1">
                  Max Salary
                </label>
                <div className="flex">
                  <Input
                    id="maxSalary"
                    name="maxSalary"
                    value={jobData.maxSalary}
                    onChange={handleChange}
                    placeholder="Maximum Salary..."
                    className="rounded-r-none"
                  />
                  <div className="flex items-center justify-center bg-gray-100 border border-l-0 border-gray-300 rounded-r-md px-3">
                    INR
                  </div>
                </div>
              </div>
              <div>
                <label htmlFor="salaryType" className="block text-sm font-medium mb-1">
                  &nbsp;
                </label>
                <Select value={jobData.salaryType} onValueChange={(value) => handleSelectChange("salaryType", value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                    <SelectItem value="hourly">Hourly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Vacancies and Job Level */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="vacancies" className="block text-lg font-medium mb-2">
                Vacancies
              </label>
              <Select value={jobData.vacancies} onValueChange={(value) => handleSelectChange("vacancies", value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1</SelectItem>
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="3">3</SelectItem>
                  <SelectItem value="4">4</SelectItem>
                  <SelectItem value="5+">5+</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label htmlFor="jobLevel" className="block text-lg font-medium mb-2">
                Job Level
              </label>
              <Select value={jobData.jobLevel} onValueChange={(value) => handleSelectChange("jobLevel", value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entry">Entry Level</SelectItem>
                  <SelectItem value="junior">Junior</SelectItem>
                  <SelectItem value="mid">Mid Level</SelectItem>
                  <SelectItem value="senior">Senior</SelectItem>
                  <SelectItem value="lead">Lead/Manager</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-lg font-medium mb-2">Location</label>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="country" className="block text-sm font-medium mb-1">
                  Country
                </label>
                <Select value={jobData.country} onValueChange={(value) => handleSelectChange("country", value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="india">India</SelectItem>
                    <SelectItem value="usa">United States</SelectItem>
                    <SelectItem value="uk">United Kingdom</SelectItem>
                    <SelectItem value="canada">Canada</SelectItem>
                    <SelectItem value="australia">Australia</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label htmlFor="city" className="block text-sm font-medium mb-1">
                  City
                </label>
                <Select value={jobData.city} onValueChange={(value) => handleSelectChange("city", value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="delhi">New Delhi</SelectItem>
                    <SelectItem value="mumbai">Mumbai</SelectItem>
                    <SelectItem value="bangalore">Bangalore</SelectItem>
                    <SelectItem value="hyderabad">Hyderabad</SelectItem>
                    <SelectItem value="chennai">Chennai</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Job Description */}
          <div>
            <label htmlFor="description" className="block text-lg font-medium mb-2">
              Job Description
            </label>
            <div className="border rounded-md">
              <div className="border-b p-2 flex items-center gap-1 flex-wrap">
                <div className="flex items-center border rounded mr-2">
                  <span className="px-2 text-sm">14</span>
                  <span className="border-l p-1">▼</span>
                </div>

                <button type="button" className="p-1 hover:bg-gray-100 rounded">
                  <Bold className="h-5 w-5" />
                </button>
                <button type="button" className="p-1 hover:bg-gray-100 rounded">
                  <Italic className="h-5 w-5" />
                </button>
                <button type="button" className="p-1 hover:bg-gray-100 rounded">
                  <Underline className="h-5 w-5" />
                </button>
                <button type="button" className="p-1 hover:bg-gray-100 rounded">
                  <Strikethrough className="h-5 w-5" />
                </button>

                <div className="h-5 border-l mx-1"></div>

                <button type="button" className="p-1 hover:bg-gray-100 rounded">
                  <AlignLeft className="h-5 w-5" />
                </button>
                <button type="button" className="p-1 hover:bg-gray-100 rounded">
                  <AlignCenter className="h-5 w-5" />
                </button>
                <button type="button" className="p-1 hover:bg-gray-100 rounded">
                  <AlignRight className="h-5 w-5" />
                </button>

                <div className="h-5 border-l mx-1"></div>

                <button type="button" className="p-1 hover:bg-gray-100 rounded">
                  <List className="h-5 w-5" />
                </button>
                <button type="button" className="p-1 hover:bg-gray-100 rounded">
                  <ListOrdered className="h-5 w-5" />
                </button>

                <div className="h-5 border-l mx-1"></div>

                <button type="button" className="p-1 hover:bg-gray-100 rounded">
                  <Image className="h-5 w-5" />
                </button>
                <button type="button" className="p-1 hover:bg-gray-100 rounded">
                  <LinkIcon className="h-5 w-5" />
                </button>
              </div>
              <textarea
                id="description"
                name="description"
                value={jobData.description}
                onChange={handleChange}
                placeholder="Add your description..."
                className="w-full p-4 h-64 outline-none resize-none"
              ></textarea>
            </div>
          </div>

          {/* Submit Button */}
          <div>
            <Button type="submit" className="bg-purple-700 hover:bg-purple-800 px-8 py-6 text-lg">
              Post Job
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

