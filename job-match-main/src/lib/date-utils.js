// Format date for display
export const formatDate = (dateString) => {
    if (!dateString) return ""
    if (dateString === "Present") return "Present"
    
    const date = new Date(dateString)
    if (isNaN(date.getTime())) {
      // If it's already in the format "Month Year"
      return dateString
    }
    
    return date.toLocaleDateString("en-US", { year: "numeric", month: "long" })
  }
  
  // Format date for API
  export const formatDateForAPI = (dateString) => {
    if (!dateString || dateString === "Present") return null
    
    // Convert from "January 2020" to ISO date string
    const parts = dateString.split(" ")
    if (parts.length === 2) {
      const month = new Date(Date.parse(parts[0] + " 1, 2000")).getMonth()
      const year = parseInt(parts[1])
      return new Date(year, month, 1).toISOString()
    }
    return null
  }
  