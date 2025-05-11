const nlp = require('compromise');

// Skill interface (for documentation)
// {
//   name: string,
//   category: string,
//   confidence: number
// }

// Detect if the text is in English or French
function detectLanguage(text) {
  const lowerText = text?.toLowerCase();

  // French common words and patterns
  const frenchWords = [
    "le", "la", "les", "un", "une", "des", "du", "de", "et", "en", "à", "pour",
    "avec", "par", "sur", "dans", "ce", "cette", "ces", "nous", "vous", "ils",
    "elles", "est", "sont", "expérience", "compétences", "qualifications", 
    "requis", "poste", "emploi", "travail", "entreprise", "société", "candidat",
    "équipe", "mission", "responsabilités", "profil",
  ];

  // Count French words
  let frenchCount = 0;
  for (const word of frenchWords) {
    const regex = new RegExp(`\\b${word}\\b`, "gi");
    const matches = lowerText?.match(regex);
    if (matches) {
      frenchCount += matches.length;
    }
  }

  // If there are enough French words, consider it French
  if (frenchCount > 5) {
    return "french";
  }

  return "english";
}

// Detect the domain of the job description
function detectJobDomain(text, language) {
  const lowerText = text?.toLowerCase();

  // Define domain keywords in English and French
  const domains = {
    english: {
      tech: [
        "software", "developer", "engineer", "programming", "code", "web", "app",
        "it ", "information technology", "computer", "data", "frontend", "backend",
        "fullstack", "devops",
      ],
      healthcare: [
        "medical", "healthcare", "health care", "doctor", "nurse", "patient",
        "clinical", "hospital", "physician", "dental", "pharmacy", "therapist",
      ],
      finance: [
        "finance", "accounting", "accountant", "banking", "investment", "financial",
        "audit", "tax", "budget", "cpa", "bookkeeping",
      ],
      marketing: [
        "marketing", "advertising", "brand", "social media", "seo", "content",
        "digital marketing", "campaign", "market research", "pr", "public relations",
      ],
      sales: [
        "sales", "account executive", "business development", "customer acquisition",
        "revenue", "quota", "pipeline", "prospect", "lead generation",
      ],
      hr: [
        "human resources", "hr ", "recruiting", "talent acquisition", "benefits",
        "compensation", "employee relations", "onboarding", "hr manager",
      ],
      legal: [
        "legal", "attorney", "lawyer", "law", "counsel", "compliance", "contract",
        "regulatory", "paralegal", "litigation",
      ],
      education: [
        "teacher", "professor", "education", "teaching", "academic", "school",
        "university", "college", "curriculum", "instructor", "classroom",
      ],
      design: [
        "designer", "design", "ux", "ui", "user experience", "graphic design",
        "creative", "visual", "product design",
      ],
    },
    french: {
      tech: [
        "logiciel", "développeur", "ingénieur", "programmation", "code", "web",
        "application", "informatique", "technologie", "ordinateur", "données",
        "frontend", "backend", "fullstack", "devops",
      ],
      healthcare: [
        "médical", "santé", "soins", "docteur", "médecin", "infirmier", "infirmière",
        "patient", "clinique", "hôpital", "dentaire", "pharmacie", "thérapeute",
      ],
      finance: [
        "finance", "comptabilité", "comptable", "bancaire", "banque", "investissement",
        "financier", "audit", "impôt", "budget", "expert-comptable", "tenue de livres",
      ],
    }
  };

  // Find the domain with the most matches
  let maxCount = 0;
  let detectedDomain = "general";

  const domainKeywords = domains[language] || domains["english"];

  for (const [domain, keywords] of Object.entries(domainKeywords)) {
    let count = 0;
    for (const keyword of keywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, "gi");
      const matches = lowerText.match(regex);
      if (matches) {
        count += matches.length;
      }
    }

    if (count > maxCount) {
      maxCount = count;
      detectedDomain = domain;
    }
  }

  return detectedDomain;
}

// Check if a term is a common word that isn't a skill
function isCommonNonSkill(term, language = "english") {
  const nonSkills = {
    english: [
      "experience", "knowledge", "understanding", "familiarity", "ability", "years",
      "requirements", "qualifications", "preferred", "strong", "good", "great",
      "excellent", "proficient", "advanced", "basic", "we", "our", "team", "company",
      "organization", "business", "using", "used", "use", "working", "work", "worked",
      "position", "job", "role", "candidate", "applicant", "employer", "day", "week",
      "month", "year", "time", "date", "schedule", "required", "must", "should", "will",
      "would", "can", "could", "please", "thank", "regards", "sincerely", "best", "looking",
    ],
    french: [
      "expérience", "connaissance", "compréhension", "familiarité", "capacité", "années",
      "exigences", "qualifications", "préféré", "fort", "bon", "excellent", "compétent",
      "avancé", "basique", "nous", "notre", "équipe", "entreprise", "organisation", "société",
      "utilisant", "utilisé", "utiliser", "travaillant", "travail", "travaillé", "poste",
      "emploi", "rôle", "candidat", "postulant", "employeur", "jour", "semaine", "mois",
      "année", "temps", "date", "horaire", "requis", "doit", "devrait", "sera", "serait",
      "peut", "pourrait", "s'il vous plaît", "merci", "cordialement", "sincèrement",
      "meilleur", "recherche",
    ],
  };

  const langNonSkills = nonSkills[language] || nonSkills["english"];

  return langNonSkills.some(
    (nonSkill) =>
      term.toLowerCase() === nonSkill ||
      term.toLowerCase().startsWith(nonSkill + " ") ||
      term.toLowerCase().endsWith(" " + nonSkill),
  );
}

// Check if a word is a common English word (not likely to be a skill)
function isCommonWord(word, language = "english") {
  const commonWords = {
    english: [
      "the", "and", "for", "with", "that", "have", "this", "from", "they", "will",
      "would", "there", "their", "what", "about", "which", "when", "make", "like",
      "time", "just", "know", "take", "people", "year", "your", "good", "some", "could",
      "them", "other", "than", "then", "look", "only", "come", "over", "think", "also",
      "work", "first", "well", "way", "even", "new", "want", "because", "any", "these",
      "give", "day", "most", "able", "team", "use", "using", "used", "must", "should",
      "can", "could", "would", "may", "might", "shall", "will", "job", "role", "position",
      "company", "business", "candidate", "applicant", "employer", "employee", "staff",
    ],
    french: [
      "le", "la", "les", "un", "une", "des", "du", "de", "et", "en", "à", "pour",
      "avec", "par", "sur", "dans", "ce", "cette", "ces", "nous", "vous", "ils",
      "elles", "est", "sont", "expérience", "compétences", "qualifications", "requis",
      "poste", "emploi", "travail", "entreprise", "société", "candidat", "équipe",
      "mission", "responsabilités", "profil", "je", "tu", "il", "elle", "on", "ne",
      "pas", "plus", "très", "bien", "tout", "tous", "toute", "toutes", "comme", "si",
      "donc", "alors", "mais", "ou", "ni", "car", "puisque", "afin", "que", "quoi",
      "qui", "où", "comment", "pourquoi", "quel", "quelle", "quels", "quelles",
    ],
  };

  const langCommonWords = commonWords[language] || commonWords["english"];

  return langCommonWords.includes(word.toLowerCase());
}

// Infer category from context
function inferCategoryFromContext(phrase) {
  // Get the surrounding context - safely handle the case where parent() might not exist
  let sentenceText = "";
  try {
    // First try to get the parent sentence if the method exists
    if (typeof phrase.parent === "function") {
      const sentence = phrase.parent();
      sentenceText = sentence.text().toLowerCase();
    } else {
      // Fallback to using the phrase's own text if parent() is not available
      sentenceText = phrase.text().toLowerCase();
    }
  } catch (error) {
    // If any error occurs, just use the phrase's own text
    sentenceText = phrase.text().toLowerCase();
  }

  // Technical skills
  if (
    sentenceText.includes("program") ||
    sentenceText.includes("code") ||
    sentenceText.includes("develop") ||
    sentenceText.includes("script") ||
    sentenceText.includes("framework") ||
    sentenceText.includes("language") ||
    sentenceText.includes("technical") ||
    sentenceText.includes("software") ||
    sentenceText.includes("engineer") ||
    sentenceText.includes("architecture") ||
    sentenceText.includes("algorithm") ||
    sentenceText.includes("database") ||
    sentenceText.includes("api") ||
    sentenceText.includes("web") ||
    sentenceText.includes("mobile") ||
    sentenceText.includes("cloud") ||
    sentenceText.includes("devops")
  ) {
    return "Technical";
  }
  // Soft skills
  else if (
    sentenceText.includes("communicat") ||
    sentenceText.includes("team") ||
    sentenceText.includes("collaborat") ||
    sentenceText.includes("lead") ||
    sentenceText.includes("manage") ||
    sentenceText.includes("problem") ||
    sentenceText.includes("solve") ||
    sentenceText.includes("critical") ||
    sentenceText.includes("think") ||
    sentenceText.includes("time") ||
    sentenceText.includes("adapt") ||
    sentenceText.includes("creative")
  ) {
    return "Soft Skill";
  }
  // Tools
  else if (
    sentenceText.includes("tool") ||
    sentenceText.includes("platform") ||
    sentenceText.includes("system") ||
    sentenceText.includes("software") ||
    sentenceText.includes("application") ||
    sentenceText.includes("ide") ||
    sentenceText.includes("editor") ||
    sentenceText.includes("environment")
  ) {
    return "Tool";
  }
  return "Technical";
}

function calculateConfidenceFromContext(phrase) {
  // Base confidence
  let confidence = 0.7;

  // Get the surrounding context - safely handle the case where parent() might not exist
  let sentenceText = "";
  try {
    // First try to get the parent sentence if the method exists
    if (typeof phrase.parent === "function") {
      const sentence = phrase.parent();
      sentenceText = sentence.text().toLowerCase();
    } else {
      // Fallback to using the phrase's own text if parent() is not available
      sentenceText = phrase.text().toLowerCase();
    }
  } catch (error) {
    // If any error occurs, just use the phrase's own text
    sentenceText = phrase.text().toLowerCase();
  }

  // Increase confidence based on context
  if (
    sentenceText.includes("experience with") ||
    sentenceText.includes("proficient in") ||
    sentenceText.includes("expertise in") ||
    sentenceText.includes("skilled in") ||
    sentenceText.includes("certified in") ||
    sentenceText.includes("specializing in") ||
    sentenceText.includes("qualified in")
  ) {
    confidence += 0.2;
  } else if (
    sentenceText.includes("knowledge of") ||
    sentenceText.includes("familiar with") ||
    sentenceText.includes("skills in") ||
    sentenceText.includes("trained in") ||
    sentenceText.includes("background in")
  ) {
    confidence += 0.15;
  } else if (
    sentenceText.includes("understanding of") ||
    sentenceText.includes("worked with") ||
    sentenceText.includes("used") ||
    sentenceText.includes("exposure to")
  ) {
    confidence += 0.1;
  }

  // Increase confidence if in a bullet point
  if (
    sentenceText.trim().startsWith("•") ||
    sentenceText.trim().startsWith("-") ||
    sentenceText.trim().startsWith("*")
  ) {
    confidence += 0.1;
  }

  // Cap at 1.0
  return Math.min(confidence, 1.0);
}

// Extract noun phrases that might be skills
function extractNounPhrases(doc, skills, language) {
  // Get all noun phrases
  const nounPhrases = doc.match("#Noun+");

  nounPhrases.forEach((phrase) => {
    const text = phrase.text().trim();

    // Skip very short phrases and common words
    if (text.length < 3 || isCommonWord(text, language)) return;

    // Determine category based on context
    const category = inferCategoryFromContext(phrase);

    // Calculate confidence based on various factors
    const confidence = calculateConfidenceFromContext(phrase);

    // Add to skills list
    skills.push({
      name: text,
      category,
      confidence,
    });
  });
}

// Extract skills from context patterns
function extractFromContextPatterns(text, skills, language) {
  // Define patterns that often indicate skills in English and French
  const patterns = {
    english: [
      { regex: /proficient in ([^.;,]+)/gi, confidenceBoost: 0.2 },
      { regex: /experience with ([^.;,]+)/gi, confidenceBoost: 0.2 },
      { regex: /knowledge of ([^.;,]+)/gi, confidenceBoost: 0.15 },
      { regex: /familiar with ([^.;,]+)/gi, confidenceBoost: 0.1 },
      { regex: /skills:? ([^.;,]+)/gi, confidenceBoost: 0.15 },
      { regex: /expertise in ([^.;,]+)/gi, confidenceBoost: 0.2 },
      { regex: /competent in ([^.;,]+)/gi, confidenceBoost: 0.15 },
      { regex: /([^.;,]+) experience/gi, confidenceBoost: 0.1 },
      { regex: /([^.;,]+) skills/gi, confidenceBoost: 0.1 },
      { regex: /ability to ([^.;,]+)/gi, confidenceBoost: 0.1 },
      { regex: /certified in ([^.;,]+)/gi, confidenceBoost: 0.2 },
      { regex: /([^.;,]+) certification/gi, confidenceBoost: 0.2 },
      { regex: /trained in ([^.;,]+)/gi, confidenceBoost: 0.15 },
      { regex: /specializing in ([^.;,]+)/gi, confidenceBoost: 0.2 },
      { regex: /background in ([^.;,]+)/gi, confidenceBoost: 0.15 },
      { regex: /qualified in ([^.;,]+)/gi, confidenceBoost: 0.2 },
    ],
    french: [
      { regex: /compétent en ([^.;,]+)/gi, confidenceBoost: 0.2 },
      { regex: /expérience avec ([^.;,]+)/gi, confidenceBoost: 0.2 },
      { regex: /expérience en ([^.;,]+)/gi, confidenceBoost: 0.2 },
      { regex: /connaissance de ([^.;,]+)/gi, confidenceBoost: 0.15 },
      { regex: /connaissance des ([^.;,]+)/gi, confidenceBoost: 0.15 },
      { regex: /familier avec ([^.;,]+)/gi, confidenceBoost: 0.1 },
      { regex: /compétences:? ([^.;,]+)/gi, confidenceBoost: 0.15 },
      { regex: /expertise en ([^.;,]+)/gi, confidenceBoost: 0.2 },
      { regex: /([^.;,]+) expérience/gi, confidenceBoost: 0.1 },
      { regex: /([^.;,]+) compétences/gi, confidenceBoost: 0.1 },
      { regex: /capacité à ([^.;,]+)/gi, confidenceBoost: 0.1 },
      { regex: /certifié en ([^.;,]+)/gi, confidenceBoost: 0.2 },
      { regex: /([^.;,]+) certification/gi, confidenceBoost: 0.2 },
      { regex: /formé en ([^.;,]+)/gi, confidenceBoost: 0.15 },
      { regex: /spécialisé en ([^.;,]+)/gi, confidenceBoost: 0.2 },
      { regex: /antécédents en ([^.;,]+)/gi, confidenceBoost: 0.15 },
      { regex: /qualifié en ([^.;,]+)/gi, confidenceBoost: 0.2 },
      { regex: /maîtrise de ([^.;,]+)/gi, confidenceBoost: 0.2 },
      { regex: /maîtrise des ([^.;,]+)/gi, confidenceBoost: 0.2 },
    ],
  };

  const languagePatterns = patterns[language] || patterns["english"];

  for (const pattern of languagePatterns) {
    let match;
    while ((match = pattern.regex.exec(text)) !== null) {
      if (match[1]) {
        // Split by commas and "and" to get individual skills
        const splitPattern = language === "french" ? /,|\set\s/ : /,|\sand\s/;
        const extractedSkills = match[1].split(splitPattern).map((s) => s.trim());

        for (const skillText of extractedSkills) {
          // Skip very short phrases and common words
          if (skillText.length < 3 || isCommonWord(skillText, language)) continue;

          // Determine category based on the pattern and surrounding text
          const category = inferCategoryFromContext({ 
            text: () => skillText,
            parent: () => ({ text: () => match[0] })
          });

          // Base confidence + pattern-specific boost
          const confidence = 0.75 + pattern.confidenceBoost;

          // Add to skills list if confidence is high enough
          if (confidence >= 0.9) {
            skills.push({
              name: skillText,
              category,
              confidence: Math.min(confidence, 1.0),
            });
          }
        }
      }
    }
  }
}

// Extract domain-specific skills
function extractDomainSpecificSkills(text, domain, skills, language) {
  const lowerText = text.toLowerCase();

  // Define domain-specific skills in English and French
  const domainSkills = {
    english: {
      tech: {
        technical: [
          "JavaScript", "TypeScript", "React", "Angular", "Vue", "Node.js", "Express",
          "Next.js", "Redux", "GraphQL", "REST", "API", "HTML", "CSS", "SASS", "LESS",
          "Webpack", "Babel", "ESLint", "Jest", "Mocha", "Chai", "Cypress", "Python",
          "Django", "Flask", "Ruby", "Rails", "PHP", "Laravel", "Java", "Spring", "C#",
          ".NET", "SQL", "NoSQL", "MongoDB", "PostgreSQL", "MySQL", "Redis", "Docker",
          "Kubernetes", "AWS", "Azure", "GCP", "CI/CD", "Git",
        ],
        soft: [
          "Communication", "Teamwork", "Leadership", "Problem-solving", "Critical thinking",
          "Time management", "Adaptability", "Creativity", "Collaboration", "Empathy",
          "Negotiation", "Conflict resolution", "Presentation", "Mentoring", "Coaching",
        ],
        tools: [
          "Jira", "Confluence", "Trello", "Asana", "Slack", "Teams", "GitHub", "GitLab",
          "Bitbucket", "VS Code", "IntelliJ", "Eclipse", "Photoshop", "Figma", "Sketch",
          "Adobe XD", "Postman", "Insomnia", "Jenkins", "Travis CI", "CircleCI",
        ],
      },
      general: {
        technical: [
          "Project management", "Research", "Analysis", "Planning", "Reporting",
          "Documentation", "Process improvement", "Quality control", "Training",
          "Technical writing", "Data entry", "Customer service", "Administration",
          "Coordination", "Scheduling", "Budgeting", "Presentation", "Facilitation",
        ],
        soft: [
          "Communication", "Teamwork", "Leadership", "Problem-solving", "Critical thinking",
          "Time management", "Organization", "Adaptability", "Creativity",
          "Attention to detail", "Decision making", "Conflict resolution",
          "Emotional intelligence", "Negotiation",
        ],
        tools: [
          "Microsoft Office", "Google Workspace", "Zoom", "Slack", "Teams", "Trello",
          "Asana", "Monday.com", "Notion", "Evernote", "QuickBooks", "Salesforce",
          "Zendesk", "Adobe Acrobat", "Dropbox", "Google Drive", "OneDrive",
        ],
      },
    },
    french: {
      tech: {
        technical: [
          "JavaScript", "TypeScript", "React", "Angular", "Vue", "Node.js", "Express",
          "Next.js", "Redux", "GraphQL", "REST", "API", "HTML", "CSS", "SASS", "LESS",
          "Webpack", "Babel", "ESLint", "Jest", "Mocha", "Chai", "Cypress", "Python",
          "Django", "Flask", "Ruby", "Rails", "PHP", "Laravel", "Java", "Spring", "C#",
          ".NET", "SQL", "NoSQL", "MongoDB", "PostgreSQL", "MySQL", "Redis", "Docker",
          "Kubernetes", "AWS", "Azure", "GCP", "CI/CD", "Git", "Développement web",
          "Développement mobile", "Développement logiciel", "Programmation",
        ],
        soft: [
          "Communication", "Travail d'équipe", "Leadership", "Résolution de problèmes",
          "Pensée critique", "Gestion du temps", "Adaptabilité", "Créativité",
          "Collaboration", "Empathie", "Négociation", "Résolution de conflits",
          "Présentation", "Mentorat", "Coaching",
        ],
        tools: [
          "Jira", "Confluence", "Trello", "Asana", "Slack", "Teams", "GitHub", "GitLab",
          "Bitbucket", "VS Code", "IntelliJ", "Eclipse", "Photoshop", "Figma", "Sketch",
          "Adobe XD", "Postman", "Insomnia", "Jenkins", "Travis CI", "CircleCI",
        ],
      },
      general: {
        technical: [
          "Gestion de projet", "Recherche", "Analyse", "Planification", "Rapports",
          "Documentation", "Amélioration des processus", "Contrôle qualité", "Formation",
          "Rédaction technique", "Saisie de données", "Service à la clientèle",
          "Administration", "Coordination", "Planification", "Budgétisation",
          "Présentation", "Animation",
        ],
        soft: [
          "Communication", "Travail d'équipe", "Leadership", "Résolution de problèmes",
          "Pensée critique", "Gestion du temps", "Organisation", "Adaptabilité",
          "Créativité", "Souci du détail", "Prise de décision", "Résolution de conflits",
          "Intelligence émotionnelle", "Négociation",
        ],
        tools: [
          "Microsoft Office", "Google Workspace", "Zoom", "Slack", "Teams", "Trello",
          "Asana", "Monday.com", "Notion", "Evernote", "QuickBooks", "Salesforce",
          "Zendesk", "Adobe Acrobat", "Dropbox", "Google Drive", "OneDrive",
        ],
      },
    },
  };

  // Get skills for the detected domain and language
  const languageSkills = domainSkills[language] || domainSkills["english"];
  const domainSpecificSkills = languageSkills[domain] || languageSkills["general"];

  // Check for technical skills
  for (const skill of domainSpecificSkills.technical) {
    const regex = new RegExp(`\\b${skill.toLowerCase()}\\b`, "i");
    if (regex.test(lowerText)) {
      skills.push({
        name: skill,
        category: "Technical",
        confidence: 0.95, // High confidence for domain-specific skills
      });
    }
  }

  // Check for soft skills
  for (const skill of domainSpecificSkills.soft) {
    const regex = new RegExp(`\\b${skill.toLowerCase()}\\b`, "i");
    if (regex.test(lowerText)) {
      skills.push({
        name: skill,
        category: "Soft Skill",
        confidence: 0.95,
      });
    }
  }

  // Check for tools
  for (const tool of domainSpecificSkills.tools) {
    const regex = new RegExp(`\\b${tool.toLowerCase()}\\b`, "i");
    if (regex.test(lowerText)) {
      skills.push({
        name: tool,
        category: "Tool",
        confidence: 0.95,
      });
    }
  }

  // Also check for general skills that apply across domains
  if (domain !== "general") {
    const generalSkills = languageSkills["general"];

    if (generalSkills) {
      for (const skill of generalSkills.technical) {
        const regex = new RegExp(`\\b${skill.toLowerCase()}\\b`, "i");
        if (regex.test(lowerText)) {
          skills.push({
            name: skill,
            category: "Technical",
            confidence: 0.9,
          });
        }
      }

      for (const skill of generalSkills.soft) {
        const regex = new RegExp(`\\b${skill.toLowerCase()}\\b`, "i");
        if (regex.test(lowerText)) {
          skills.push({
            name: skill,
            category: "Soft Skill",
            confidence: 0.9,
          });
        }
      }

      for (const tool of generalSkills.tools) {
        const regex = new RegExp(`\\b${tool.toLowerCase()}\\b`, "i");
        if (regex.test(lowerText)) {
          skills.push({
            name: tool,
            category: "Tool",
            confidence: 0.9,
          });
        }
      }
    }
  }
}

// Extract skills from bullet points
function extractFromBulletPoints(text, skills, language) {
  const bulletPointPattern = /[•\-*]\s*([^•\-*\n]+)/g;
  let match;
  while ((match = bulletPointPattern.exec(text)) !== null) {
    if (match[1]) {
      const bulletText = match[1].trim();

      // Parse the bullet point with compromise
      const bulletDoc = nlp(bulletText);

      // Extract noun phrases from the bullet point
      const nounPhrases = bulletDoc.match("#Noun+");

      nounPhrases.forEach((phrase) => {
        const phraseText = phrase.text().trim();

        // Skip very short phrases and common words
        if (phraseText.length < 3 || isCommonWord(phraseText, language)) return;

        // Bullet points often contain skills, so higher confidence
        const confidence = 0.8;

        // Add to skills list
        skills.push({
          name: phraseText,
          category: inferCategoryFromContext(phrase),
          confidence,
        });
      });
    }
  }
}

// Remove duplicate skills
function removeDuplicates(skills) {
  const uniqueSkills = [];
  const skillMap = new Map();

  for (const skill of skills) {
    const lowerName = skill.name.toLowerCase();

    // If we've seen this skill before, keep the one with higher confidence
    if (skillMap.has(lowerName)) {
      const existing = skillMap.get(lowerName);
      if (skill.confidence > existing.confidence) {
        skillMap.set(lowerName, skill);
      }
    } else {
      skillMap.set(lowerName, skill);
    }
  }

  return Array.from(skillMap.values());
}

// Function to extract skills using compromise NLP
async function extractSkillsNLP(jobDescription) {
  try {
    // Detect language (English or French)
    const language = detectLanguage(jobDescription);

    // First, detect the domain of the job description
    const domain = detectJobDomain(jobDescription, language);

    // Parse the text with compromise
    const doc = nlp(jobDescription);

    // Extract potential skills using various NLP techniques
    const skills = [];

    // 1. Extract noun phrases that might be skills
    extractNounPhrases(doc, skills, language);

    // 2. Extract skills from context patterns
    extractFromContextPatterns(jobDescription, skills, language);

    // 3. Extract domain-specific skills
    extractDomainSpecificSkills(jobDescription, domain, skills, language);

    // 4. Extract from bullet points
    extractFromBulletPoints(jobDescription, skills, language);

    // Filter skills to keep only those with 1-3 words and in the desired categories
    const filteredSkills = skills
      .filter((skill) => {
        // Count words (split by spaces and filter out empty strings)
        const wordCount = skill.name.split(/\s+/).filter((word) => word.length > 0).length;
        return wordCount >= 1 && wordCount <= 3;
      })
      .filter((skill) => {
        // Keep only Technical, Soft Skill, and Tool categories
        return ["Technical", "Soft Skill", "Tool"].includes(skill.category);
      })
      // Filter out common words that aren't skills
      .filter((skill) => !isCommonNonSkill(skill.name, language))
      // Only keep skills with high confidence (important skills)
      .filter((skill) => skill.confidence >= 0.9);

    // Remove duplicates and sort by confidence
    const uniqueSkills = removeDuplicates(filteredSkills).sort((a, b) => b.confidence - a.confidence);

    // Only return the top skills (most important ones)
    // Limit to 5 skills per category maximum
    const technicalSkills = uniqueSkills.filter((s) => s.name );
    const softSkills = uniqueSkills.filter((s) => s.category === "Soft Skill").slice(0, 5);
    const tools = uniqueSkills.filter((s) => s.category === "Tool").slice(0, 5);

    return uniqueSkills.map(skill => skill.name);
  } catch (error) {
    console.error("Error extracting skills:", error);
    throw new Error("Failed to extract skills. Please try again.");
  }
}

// Main test function
async function main() {
  // Sample job description for testing
  const jobDescription = `
 Description du Poste : Infirmier/Infirmière
📌 Présentation du Poste
Nous recherchons un(e) infirmier/infirmière qualifié(e) pour rejoindre notre équipe et assurer des soins de qualité aux patients. Vous serez responsable de la prise en charge des patients, de l’administration des soins et du suivi médical en collaboration avec l’équipe soignante.

🩺 Responsabilités
✅ Assurer les soins infirmiers (pansements, injections, prélèvements, etc.)
✅ Administrer les traitements et surveiller leurs effets
✅ Collaborer avec les médecins et autres professionnels de santé
✅ Assurer l’accueil et l’écoute des patients et de leurs familles
✅ Gérer le dossier médical et assurer le suivi des prescriptions
✅ Appliquer les protocoles d’hygiène et de sécurité
✅ Participer aux soins d’urgence et aux interventions médicales

🎓 Profil Recherché
🔹 Diplôme : Diplôme d’État d’Infirmier (DEI) ou équivalent
🔹 Expérience : Une première expérience est un atout mais débutants acceptés
🔹 Compétences :

Connaissance des soins infirmiers et des protocoles médicaux

Capacité d’écoute et empathie

Rigueur et réactivité face aux urgences

Capacité à travailler en équipe

Maîtrise des outils informatiques médicaux

💼 Conditions
📍 Lieu : [Ville / Hôpital / Clinique]
⏳ Type de contrat : [CDI / CDD / Intérim]
⏰ Horaires : Travail en 3x8, week-ends possibles
💰 Rémunération : Selon expérience et grille salariale

🎯 Pourquoi nous rejoindre ?
🌟 Équipe bienveillante et dynamique
🚀 Opportunités de formation et d’évolution
🏥 Établissement reconnu pour la qualité de ses soins

🔗 Postulez dès maintenant !
  `;

  console.log("Extracting skills from job description...\n");
  
  try {
    const skills = await extractSkillsNLP(jobDescription);
    
    // Group skills by category
    const technicalSkills = skills.filter((skill) => skill.category === "Technical");
    const softSkills = skills.filter((skill) => skill.category === "Soft Skill");
    const tools = skills.filter((skill) => skill.category === "Tool");
    
    // Display results
    console.log("=== Technical Skills ===");
    technicalSkills.forEach(skill => {
      console.log(`${skill.name} (Confidence: ${Math.round(skill.confidence * 100)}%)`);
    });
    
    console.log("\n=== Soft Skills ===");
    softSkills.forEach(skill => {
      console.log(`${skill.name} (Confidence: ${Math.round(skill.confidence * 100)}%)`);
    });
    
    console.log("\n=== Tools ===");
    tools.forEach(skill => {
      console.log(`${skill.name} (Confidence: ${Math.round(skill.confidence * 100)}%)`);
    });
    
    console.log(`\nTotal skills extracted: ${skills.length}`);
    console.log("Skills : ", skills);
  } catch (error) {
    console.error("Error:", error.message);
  }
}

// Run the main function
//main();

// Export functions for potential reuse in other modules
module.exports = {
  extractSkillsNLP,
  detectLanguage,
  detectJobDomain
};