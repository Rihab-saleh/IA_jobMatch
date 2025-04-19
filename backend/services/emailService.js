const nodemailer = require('nodemailer');
const { getRecommendationsForUser } = require('./recommendationService');
const User = require('../models/user_model');
const Notification = require('../models/notification_model');

let transporter = null;

// Configuration du transporteur SMTP
function getTransporter() {
  if (transporter) return transporter;

  if (!process.env.EMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    throw new Error('Configuration SMTP manquante');
  }

  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD
    },
    tls: {
      rejectUnauthorized: process.env.NODE_ENV === 'production'
    }
  });

  return transporter;
}

// Envoi des recommandations par email
async function sendJobRecommendationsEmail(userId) {
  try {
    // Récupération des données
    const user = await User.findById(userId);
    if (!user) throw new Error('Utilisateur introuvable');
    
    const recommendations = await getRecommendationsForUser(userId);
    if (!recommendations.length) return { success: true, sent: false };

    // Formatage des jobs
    const jobs = recommendations
      .slice(0, 5)
      .map(job => ({
        title: job.title,
        company: job.company || 'Entreprise non spécifiée',
        location: job.location || 'Localisation non précisée',
        matchPercentage: job.matchPercentage,
        skills: job.skillMatches?.slice(0, 3) || [],
        url: job.applyUrl || `${process.env.BASE_URL}/jobs/${job.id}`
      }));

    // Construction du contenu
    const greeting = user.fullName ? `Bonjour ${user.fullName},` : 'Bonjour,';
    const emailContent = {
      subject: `💼 ${jobs.length} nouvelles offres correspondent à votre profil`,
      text: buildTextEmail(greeting, jobs),
      html: buildHTMLEmail(greeting, jobs)
    };

    // Envoi de l'email
    console.log('Email préparé:', emailContent.subject);
    const result = await sendEmail({
      to: user.email,
      ...emailContent
    });
    console.log('Résultat envoi:', result);
    // Journalisation
    await Notification.create({
      userId,
      type: 'email_job_recommendations',
      content: `Email envoyé avec ${jobs.length} recommandations`,
      metadata: {
        jobs: jobs.map(job => job.id),
        emailStatus: result.success ? 'delivered' : 'failed'
      }
    });

    return result;

  } catch (error) {
    console.error(`Erreur recommandations email pour ${userId}:`, error.message);
    return { 
      success: false,
      error: error.message 
    };
  }
}

// Construction version texte
function buildTextEmail(greeting, jobs) {
  let content = `${greeting}\n\nVoici vos recommandations personnalisées :\n\n`;
  
  jobs.forEach((job, index) => {
    content += `➤ ${job.title}\n`;
    content += `   Entreprise : ${job.company}\n`;
    content += `   Localisation : ${job.location}\n`;
    content += `   Correspondance : ${job.matchPercentage}%\n`;
    content += `   Compétences : ${job.skills.join(', ') || '-'}\n`;
    content += `   Postuler : ${job.url}\n\n`;
  });

  content += "\nCordialement,\nL'équipe CareerConnect";
  return content;
}

// Construction version HTML
function buildHTMLEmail(greeting, jobs) {
  return `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 20px auto; padding: 20px;">
      <div style="border-bottom: 2px solid #2563eb; padding-bottom: 15px; margin-bottom: 25px;">
        <h1 style="color: #1e293b; margin: 0;">Nouvelles Opportunités</h1>
        <p style="color: #64748b; margin: 5px 0 0;">${greeting}</p>
      </div>

      ${jobs.map(job => `
        <div style="background: #f8fafc; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <h2 style="color: #2563eb; margin: 0 0 10px 0;">${job.title}</h2>
            <span style="background: ${getMatchColor(job.matchPercentage)};
                        color: white;
                        padding: 4px 12px;
                        border-radius: 20px;
                        font-size: 0.9em;">
              ${job.matchPercentage}% match
            </span>
          </div>
          
          <div style="color: #475569;">
            <p style="margin: 8px 0;">
              <strong>🏢 Entreprise :</strong> 
              ${job.company}
            </p>
            <p style="margin: 8px 0;">
              <strong>📍 Localisation :</strong> 
              ${job.location}
            </p>
            <p style="margin: 8px 0;">
              <strong>🛠️ Compétences :</strong> 
              ${job.skills.join(', ') || '-'}
            </p>
            <a href="${job.url}" 
               style="display: inline-block;
                      background: #2563eb;
                      color: white;
                      padding: 10px 20px;
                      text-decoration: none;
                      border-radius: 5px;
                      margin-top: 10px;
                      transition: background 0.3s;">
              Voir l'offre →
            </a>
          </div>
        </div>
      `).join('')}

      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
        <p style="color: #64748b; font-size: 0.9em;">
          Ces recommandations sont générées automatiquement en fonction de votre profil.
          <br>
          <a href="${process.env.BASE_URL}/preferences" style="color: #2563eb;">Gérer vos préférences</a>
        </p>
      </div>
    </div>
  `;
}

// Couleur selon le pourcentage
function getMatchColor(percentage) {
  if (percentage >= 90) return '#16a34a';   // Vert
  if (percentage >= 75) return '#2563eb';   // Bleu
  return '#ea580c';                        // Orange
}

// Fonction générique d'envoi d'email
async function sendEmail({ to, subject, text, html }) {
  try {
    const transport = getTransporter();
    const info = await transport.sendMail({
      from: `"CareerConnect" <${process.env.EMAIL_USER}>`,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject,
      text,
      html
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Erreur envoi email:', error);
    return { success: false, error: error.message };
  }
}

// Vérification configuration SMTP
async function verifyEmailConfig() {
  try {
    const transport = getTransporter();
    await transport.verify();
    return { valid: true };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

module.exports = {
  sendJobRecommendationsEmail,
  verifyEmailConfig,
  sendEmail
};