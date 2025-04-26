function extractJsonFromResponse(responseText) {
    try {
        // First, try to parse the entire response as JSON
        let parsedJson = JSON.parse(responseText);
        
        // If we have a valid response with feedback and enhanced fields
        if (parsedJson && typeof parsedJson.feedback === "string" && parsedJson.enhanced) {
            // If enhanced is a string, clean it up
            if (typeof parsedJson.enhanced === "string") {
                // Remove escaped characters and JSON syntax
                let cleanedEnhanced = parsedJson.enhanced
                    .replace(/\\"/g, '')  // Remove escaped quotes
                    .replace(/"/g, '')    // Remove quotes
                    .replace(/\\n/g, '\n') // Convert \n to actual newlines
                    .replace(/\\\\/g, '')  // Remove escaped backslashes
                    .replace(/[{}]/g, '')  // Remove curly braces
                    .trim();
                
                // Remove any "Summary:" labels or similar JSON keys
                cleanedEnhanced = cleanedEnhanced.replace(/\s*Summary\s*:/g, '');
                
                // Fix issues with "specific improvements" text getting into the enhanced field
                cleanedEnhanced = cleanedEnhanced.replace(/-\d+\s+specific improvements/g, '');
                
                // Ensure each line starts with a proper hyphen
                cleanedEnhanced = cleanedEnhanced
                    .split('\n')
                    .map(line => {
                        line = line.trim();
                        if (line.length > 0) {
                            // Remove any leading punctuation except hyphens
                            line = line.replace(/^[^\w\-]+/, '');
                            
                            // Ensure the line starts with a hyphen
                            if (!line.startsWith('-')) {
                                return '- ' + line;
                            }
                            
                            // Make sure there's a space after the hyphen
                            if (line.startsWith('-') && line.length > 1 && line[1] !== ' ' && line[1] !== '"') {
                                return '- ' + line.substring(1);
                            }
                        }
                        return line;
                    })
                    .filter(line => line.trim()) // Remove empty lines
                    .join('\n');
                
                parsedJson.enhanced = cleanedEnhanced;
            }
            return parsedJson;
        }
    } catch (mainError) {
        console.error("Main JSON parsing error:", mainError);
        
        // If the main parsing fails, try to extract JSON from the text
        try {
            const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/i) || responseText.match(/{[\s\S]*?}/i);
            if (jsonMatch) {
                const jsonString = jsonMatch[1] || jsonMatch[0];
                const cleanedJsonString = jsonString.replace(/```json|```/g, "").trim();
                return extractJsonFromResponse(cleanedJsonString); // Recursively try with the extracted JSON
            }
        } catch (extractError) {
            console.error("Error extracting JSON:", extractError);
        }
    }

    // Fallback if all parsing attempts fail
    console.warn("No valid JSON found or structure is invalid. Returning fallback response.");
    
    // Try to extract just the enhanced content from the raw text if all else fails
    let rawEnhanced = responseText;
    // Look for patterns like "enhanced": "content" or 'enhanced': 'content'
    const enhancedMatch = responseText.match(/['"]\s*enhanced\s*['"]\s*:\s*['"](.+?)['"]/s);
    if (enhancedMatch && enhancedMatch[1]) {
        rawEnhanced = enhancedMatch[1];
    }
    
    return {
        feedback: "AI provided feedback but in an unexpected format.",
        enhanced: rawEnhanced
            .replace(/["\{\}\\]/g, '')  // Remove JSON syntax
            .replace(/-\d+\s+specific improvements/g, '')  // Remove specific improvements text
            .replace(/\s*Summary\s*:/g, '')  // Remove Summary labels
            .trim()
    };
}

export async function enhanceContent(content, contentType) {
    if (!content) {
        throw new Error("Content is required");
    }

    // Construct the prompt based on content type
    let systemPrompt = "";

    switch (contentType) {
        case "summary":
            systemPrompt =
                "You are an expert resume writer. Enhance this professional summary . ";
            break;
        case "experience":
            systemPrompt =
                "You are an expert resume writer. Enhance this job description to be more impactful. Use strong action verbs, quantify achievements where possible, and emphasize relevant skills and outcomes. ";
            break;
        case "education":
            systemPrompt =
                "You are an expert resume writer. Enhance this education description to highlight relevant coursework, achievements, and skills gained during education. ";
            break;
        case "skills":
            systemPrompt =
                "You are an expert resume writer. Suggest improvements to how this skill is presented, including more specific and industry-relevant wording if applicable. ";
            break;
        default:
            systemPrompt =
                "You are an expert resume writer. Enhance this content to be more professional, concise, and impactful for a resume or CV. ";
    }

    const prompt = `
    ${systemPrompt}

    Original content:
    """
    ${content}
    """

    Provide your response in JSON format with the following structure:
    {
      "feedback": "Brief constructive feedback about the original content, pointing out 2-3 specific improvements",
      "enhanced": "Your enhanced version of the content, ensuring every remark start with '-' and every single sentence for experience description start with '-'"
    }

    Keep the enhanced content similar in length to the original, but make it more impactful and professional.
    `;

    // Send the prompt to Mistral API
    const response = await fetch("http://localhost:11434/api/generate", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            prompt: prompt,
            model: "mistral",
            stream: false,
        }),
    });

    if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();

    // Use the extractJsonFromResponse function to handle the response
    return extractJsonFromResponse(data.response);
}
export async function reviewCV(cvData) {
    if (!cvData) {
        throw new Error("CV data is required");
    }

    // Create a more concise prompt that still gets the job done
    const prompt = `
As an expert CV reviewer with 15+ years experience, review this CV and provide feedback. Be extremely severe, hard, and strict in your evaluation. Do not give easy scores. Respond in JSON format ONLY:

CV DATA:
Name: ${cvData.personalInfo.firstName} ${cvData.personalInfo.lastName}
Title: ${cvData.personalInfo.professionalTitle}
Summary: "${cvData.personalInfo.summary}"

Work Experience:
${cvData.workExperience
    .map(
        (exp) => `
- ${exp.title} at ${exp.company}, ${exp.startDate} - ${exp.endDate}
  "${exp.description.substring(0, 150)}${exp.description.length > 150 ? '...' : ''}"
`,
    )
    .join("")}

Education:
${cvData.education
    .map(
        (edu) => `- ${edu.degree} in ${edu.fieldOfStudy}, ${edu.school}, ${edu.startDate} - ${edu.endDate}`,
    )
    .join("\n")}

Skills: ${cvData.skills.map(skill => skill.name).join(", ")}
Languages: ${cvData.languages.map(lang => `${lang.name} (${lang.level})`).join(", ")}
Certifications: ${cvData.certifications.map(cert => cert.name).join(", ")}

Return ONLY a JSON object with these properties:
{
  "overallScore": number (0-100),
  "atsScore": number (0-100),
  "atsIssues": [{"description": string, "severity": "high|medium|low"}],
  "sectionScores": [{"name": string, "score": number}],
  "keyFindings": [{"title": string, "description": string, "type": "positive|negative"}],
  "sectionAnalysis": [{
    "name": string,
    "score": number,
    "overview": string,
    "strengths": [{"title": string, "description": string}],
    "issues": [{"title": string, "description": string, "severity": "high|medium|low"}],
    "recommendations": [string]
  }],
  "improvementPlan": [{
    "title": string,
    "description": string,
    "priority": "high|medium|low",
    "steps": [string]
  }]
}

DO NOT include any introductory text, explanations, or markdown formatting. Respond ONLY with the JSON object.
`;

    // Set up a timeout of 300000 milliseconds
    const TIMEOUT_MS = 300000;
    
    // Create the fallback response
    const fallbackResponse = {
        overallScore: 50,
        atsScore: 55,
        atsIssues: [
            {
                description: "Unable to complete detailed analysis within the time limit.",
                severity: "medium",
            },
        ],
        sectionScores: [
            { name: "Personal Information", score: 60 },
            { name: "Professional Summary", score: 50 },
            { name: "Work Experience", score: 45 },
            { name: "Education", score: 55 },
            { name: "Skills", score: 50 },
            { name: "Languages", score: 60 },
            { name: "Certifications", score: 45 },
        ],
        keyFindings: [
            {
                title: "Processing Timeout",
                description: "The system couldn't complete the detailed analysis within the allowed time. Basic scores are provided.",
                type: "negative",
            },
        ],
        sectionAnalysis: [
            {
                name: "Overall CV",
                score: 50,
                overview: "Your CV needs significant improvements to be competitive.",
                strengths: [],
                issues: [
                    {
                        title: "Analysis Timeout",
                        description: "Detailed analysis couldn't be completed in time.",
                        severity: "medium",
                    },
                ],
                recommendations: ["Try analyzing your CV again later when the system is less busy."],
            },
        ],
        improvementPlan: [
            {
                title: "Retry Analysis",
                description: "The system couldn't complete your detailed CV analysis in time.",
                priority: "high",
                steps: ["Try analyzing your CV again during off-peak hours."],
            },
        ],
    };

    try {
        // Create a timeout promise
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error("CV review timed out after 300000 milliseconds")), TIMEOUT_MS);
        });
        
        // Create the API call promise
        const apiCallPromise = (async () => {
            const response = await fetch("http://localhost:11434/api/generate", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    prompt: prompt,
                    model: "mistral",
                    stream: false,
                    temperature: 0.3, // Lower temperature for more focused responses
                    max_tokens: 2048, // Limit the response length
                }),
            });

            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}`);
            }

            const data = await response.json();
            const responseText = data.response;
            
            // Extract JSON from the response
            let jsonString = responseText;
            const jsonBlockMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
            if (jsonBlockMatch) {
                jsonString = jsonBlockMatch[1];
            }
            
            if (jsonString.indexOf('{') > 0) {
                jsonString = jsonString.substring(jsonString.indexOf('{'));
            }
            
            if (jsonString.lastIndexOf('}') < jsonString.length - 1) {
                jsonString = jsonString.substring(0, jsonString.lastIndexOf('}') + 1);
            }

            const result = JSON.parse(jsonString);
            
            if (!result.overallScore || !Array.isArray(result.sectionScores)) {
                throw new Error("Invalid response structure");
            }
            
            // Calculate the overall score based on section scores
            const totalScore = result.sectionScores.reduce((sum, section) => sum + section.score, 0);
            const averageScore = Math.round(totalScore / result.sectionScores.length);
            result.overallScore = averageScore;
            
            return result;
        })();
        
        return await Promise.race([apiCallPromise, timeoutPromise])
            .catch(error => {
                console.error("CV review error:", error.message);
                return fallbackResponse;
            });
    } catch (error) {
        console.error("Error processing CV review:", error);
        return fallbackResponse;
    }
}
