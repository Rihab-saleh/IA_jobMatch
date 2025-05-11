const nodemailer = require('nodemailer');
const User = require('../models/user_model');
const Notification = require('../models/notification_model');
const Person = require('../models/person_model');

let transporter = null;

/** Create or return a cached transporter */
function getTransporter() {
  if (transporter) return transporter;

  const { EMAIL_USER, GMAIL_APP_PASSWORD, NODE_ENV } = process.env;

  if (!EMAIL_USER || !GMAIL_APP_PASSWORD) {
    throw new Error('❌ SMTP configuration is missing (EMAIL_USER or GMAIL_APP_PASSWORD).');
  }

  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: EMAIL_USER,
      pass: GMAIL_APP_PASSWORD,
    },
    tls: {
      rejectUnauthorized: NODE_ENV === 'production',
    },
  });

  return transporter;
}

function buildHTMLEmail(greeting, jobs) {
  return `
    <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 30px;">
      <div style="max-width: 640px; margin: auto; background-color: #ffffff; padding: 40px; border-radius: 12px; box-shadow: 0 5px 20px rgba(0,0,0,0.1);">
        <h2 style="color: #264653; font-size: 24px;">${greeting}</h2>
        <p style="font-size: 16px; color: #444;">Here are some opportunities that match your profile:</p>
        ${jobs.map(job => {
          // Ensure URL is properly formatted
          let jobUrl = job.url || job.applyUrl || job.sourceUrl || '#';
          
          // Add https:// prefix if the URL doesn't have a protocol
          if (jobUrl !== '#' && !jobUrl.startsWith('http://') && !jobUrl.startsWith('https://')) {
            jobUrl = 'https://' + jobUrl;
          }
          
          return `
          <div style="margin-bottom: 30px; border-bottom: 1px solid #eee; padding-bottom: 20px;">
            <h3 style="margin: 0; color: #2a9d8f; font-size: 20px;">${job.title}</h3>
            <p><strong>Company:</strong> ${job.company}</p>
            <p><strong>Location:</strong> ${job.location}</p>
            <p>🎯 <strong>Match Percentage:</strong> ${job.matchPercentage}%</p>
            <div style="margin: 10px 0;">
              <strong>📌 Skills:</strong><br/>
              ${job.skills.length && job.skills[0] !== 'Not specified'
                ? job.skills.map(skill => `<span style="display:inline-block; background-color:#e9f5f2; color:#264653; padding:5px 10px; border-radius:20px; margin:5px 5px 0 0; font-size:13px;">${skill}</span>`).join('')
                : '<span style="color: #999;">Not specified</span>'
              }
            </div>
            <a href="${jobUrl}" style="display:inline-block; margin-top:15px; background-color:#264653; color:#fff; padding:10px 18px; text-decoration:none; border-radius:6px; font-size:14px;" target="_blank">🔎 View Job</a>
          </div>
        `}).join('')}
        <p style="font-size: 16px; color: #444;">Good luck with your job search!</p>
        <p style="font-size: 12px; color: #999; margin-top: 30px;">This email was sent automatically via <strong>Job Match</strong>. Please do not reply directly to this message.</p>
      </div>
    </div>`;
}

/** Build plain text email content */
function buildTextEmail(greeting, jobs) {
  return `${greeting}\n\nVoici vos nouvelles recommandations :\n\n` +
    jobs.map(job => {
      // Ensure URL is properly formatted
      let jobUrl = job.url || job.applyUrl || job.sourceUrl || 'Lien non disponible';
      
      // Add https:// prefix if the URL doesn't have a protocol
      if (jobUrl !== 'Lien non disponible' && !jobUrl.startsWith('http://') && !jobUrl.startsWith('https://')) {
        jobUrl = 'https://' + jobUrl;
      }
      
      return `- ${job.title} chez ${job.company} (${job.location})\n` +
        `  🎯 Correspondance : ${job.matchPercentage}%\n` +
        `  📌 Compétences : ${job.skills.length && job.skills[0] !== 'Non spécifiées' 
          ? job.skills.join(', ') 
          : 'Non spécifiées'}\n` +
        `  🔗 ${jobUrl}`;
    }).join('\n\n') +
    `\n\nBonne chance dans vos recherches !`;
}

/** Generic email sender */
async function sendEmail({ to, subject, text, html }) {
  const transporter = getTransporter();
  const mailOptions = {
    from: `"Job Match " <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
    html,
  };

  return transporter.sendMail(mailOptions);
}

/** Send job recommendations to user */
async function sendJobRecommendationsEmail(email, recommendations = []) {
  try {
    const cleanEmail = email.trim().toLowerCase();

    // Recherche de la personne dans la base de données
    const person = await Person.findOne({ email: new RegExp(`^${cleanEmail}$`, 'i') });
    if (!person) throw new Error(`❌ Person not found for email: ${cleanEmail}`);

    // Recherche de l'utilisateur associé à cette personne
    const user = await User.findOne({ person: person._id }).populate('person');
    if (!user) throw new Error(`❌ User not found for email: ${cleanEmail}`);

    // Si aucune recommandation n'est disponible
    if (!recommendations.length) {
      return { success: true, sent: false, reason: 'No recommendations' };
    }

    // Limiter à 5 recommandations et structurer les informations
    const jobs = recommendations.slice(0, 5).map(job => {
      // Get the URL from various possible sources
      let jobUrl = job.applyUrl || job.url || job.sourceUrl;
      
      // Ensure URL has proper format
      if (jobUrl && !jobUrl.startsWith('http://') && !jobUrl.startsWith('https://')) {
        jobUrl = 'https://' + jobUrl;
      }
      
      return {
        id: job.id || Math.random().toString(36).substring(2, 9),
        title: job.title || 'Titre non spécifié',
        company: job.company || 'Entreprise non spécifiée',
        location: job.location?.name || job.location || 'Localisation non précisée',
        matchPercentage: job.matchPercentage || 0,
        skills: (job.skillMatches && job.skillMatches.length > 0)
          ? job.skillMatches
          : (job.skills && job.skills.length > 0)
            ? job.skills
            : ['Non spécifiées'], // Ajoutez une valeur par défaut
        url: jobUrl || '#',
        description: job.description || '',
      };
    });

    const greeting = person.fullName ? `Hello ${person.fullName},` : 'Hello,';

    // Création du contenu de l'email
    const emailContent = {
      subject: `💼 ${jobs.length} nouvelles opportunités pour vous`,
      text: buildTextEmail(greeting, jobs),
      html: buildHTMLEmail(greeting, jobs),
    };

    // Envoi de l'email
    await sendEmail({ to: cleanEmail, ...emailContent });

    // Créer une notification pour chaque job
    await Promise.all(jobs.map(async (job) => {
      // Vérifier si une notification existe déjà pour ce job
      const existingNotification = await Notification.findOne({
        userId: user._id,
        notificationType: 'jobAlert',
        jobTitle: job.title,
        jobUrl: job.url,
      });
      
      // Si aucune notification n'existe, en créer une nouvelle
      if (!existingNotification) {
        await Notification.create({
          userId: user._id,
          notificationType: 'jobAlert',
          jobTitle: job.title,
          jobUrl: job.url,
          jobCompany: job.company,
          jobLocation: job.location,
          jobMatchPercentage: job.matchPercentage,
          jobSkills: job.skills,
          jobDescription: job.description,
          message: `Nouvelle recommandation d'emploi: ${job.title} chez ${job.company}`,
          createdAt: new Date(),
        });
      }
    }));

    return { success: true, sent: true, jobCount: jobs.length };

  } catch (error) {
    console.error('[ERROR] sendJobRecommendationsEmail:', error.message);
    return { success: false, sent: false, error: error.message }; // Retourner un objet d'erreur utile
  }
}

module.exports = {
  sendJobRecommendationsEmail,
  sendEmail,
};