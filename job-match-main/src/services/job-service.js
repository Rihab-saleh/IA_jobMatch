const API_URL = "https://api.example.com"

export async function getJobs(filters = {}) {
  const payload = {
    sort_by: "created_at",
    sort_order: "desc",
    published_since: "2024-03-20T00:00:00.000Z",
    size: 50,
    from: 0,
    q: filters.q || "Software Engineer",
    title: filters.title || "Software Engineer",
    website: "www.linkedin.com",
    facets: ["country", "city"],
  }

  const response = await fetch("https://api.apijobs.dev/v1/job/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": "4e4fce558288a8005970bb642a0569749178ce05c7f753f963411eddf47b4d81",
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error("Failed to fetch jobs")
  }

  const data = await response.json()
console.log(data)
  return data.hits.map((job) => ({
    id: job.id,
    title: job.title,
    company: job.hiring_organization_name,
    location: job.city,
    type: "Full-time",
    salary: "2000 - 3000",
    postedDate: job.created_at,
    logo: job.logo || "/placeholder.svg?height=64&width=64",
  }))
}

export async function getJobById(id) {
  // In a real app, you would use:
  // const response = await fetch(`${API_URL}/jobs/${id}`);

  // For demo purposes, we'll return mock data
  await new Promise((resolve) => setTimeout(resolve, 1000))

  return {
    id,
    title: "Senior Frontend Developer",
    company: "Google Inc.",
    location: "New York, USA (Hybrid)",
    type: "Full-time",
    salary: "$120,000 - $150,000",
    postedDate: "2 weeks ago",
    description: "We are looking for a Senior Frontend Developer to join our team...",
    requirements: [
      "At least 5 years of experience with React",
      "Strong understanding of JavaScript and ES6+",
      "Experience with state management libraries",
      "Knowledge of responsive design principles",
    ],
    benefits: ["Competitive salary", "Health insurance", "Flexible working hours", "Remote work options"],
    logo: "/placeholder.svg?height=64&width=64",
  }
}

export async function applyForJob(jobId, applicationData) {
  // In a real app, you would use:
  // const response = await fetch(`${API_URL}/jobs/${jobI  {
  // In a real app, you would use:
  // const response = await fetch(`${API_URL}/jobs/${jobId}/apply`, {
  //   method: 'POST',
  //   headers: {
  //     'Content-Type': 'application/json',
  //   },
  //   body: JSON.stringify(applicationData),
  // });

  // For demo purposes, we'll return mock data
  await new Promise((resolve) => setTimeout(resolve, 1500))

  return {
    success: true,
    message: "Application submitted successfully",
    applicationId: "app_" + Math.random().toString(36).substr(2, 9),
  }
}

export async function saveJob(jobId) {
  // In a real app, you would use:
  // const response = await fetch(`${API_URL}/jobs/${jobId}/save`, {
  //   method: 'POST',
  //   headers: {
  //     'Content-Type': 'application/json',
  //   },
  // });

  // For demo purposes, we'll return mock data
  await new Promise((resolve) => setTimeout(resolve, 500))

  return {
    success: true,
    message: "Job saved successfully",
  }
}

export async function unsaveJob(jobId) {
  // In a real app, you would use:
  // const response = await fetch(`${API_URL}/jobs/${jobId}/save`, {
  //   method: 'DELETE',
  //   headers: {
  //     'Content-Type': 'application/json',
  //   },
  // });

  // For demo purposes, we'll return mock data
  await new Promise((resolve) => setTimeout(resolve, 500))

  return {
    success: true,
    message: "Job removed from saved jobs",
  }
}

export async function getRecommendedJobs() {
  // In a real app, you would use:
  // const response = await fetch(`${API_URL}/jobs/recommended`);

  // For demo purposes, we'll return mock data
  await new Promise((resolve) => setTimeout(resolve, 1200))

  return [
    {
      id: "4",
      title: "React Developer",
      company: "Microsoft",
      location: "Remote",
      type: "Full-time",
      salary: "$100,000 - $130,000",
      postedDate: "1 day ago",
      matchScore: 95,
      logo: "/placeholder.svg?height=64&width=64",
    },
    {
      id: "5",
      title: "Frontend Engineer",
      company: "Netflix",
      location: "Los Angeles, CA",
      type: "Full-time",
      salary: "$120,000 - $150,000",
      postedDate: "3 days ago",
      matchScore: 92,
      logo: "/placeholder.svg?height=64&width=64",
    },
    {
      id: "6",
      title: "UI/UX Developer",
      company: "Airbnb",
      location: "San Francisco, CA",
      type: "Full-time",
      salary: "$110,000 - $140,000",
      postedDate: "1 week ago",
      matchScore: 88,
      logo: "/placeholder.svg?height=64&width=64",
    },
  ]
}

