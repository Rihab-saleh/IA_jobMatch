// lib/emailService.js
import nodemailer from 'nodemailer';

// Créer un transporteur SMTP réutilisable
let transporter = null;

export function getTransporter() {
    if (transporter) return transporter;
    
    transporter = nodemailer.createTransport({
      service: 'gmail',
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  
    return transporter;
  }

export async function sendEmail({ to, subject, text, html }) {
  try {
    if (!process.env.EMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      throw new Error('Configuration d\'email manquante');
    }

    const transport = getTransporter();
    
    const info = await transport.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || 'Votre Application'}" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html: html || text,
    });

    console.log('Email envoyé avec succès:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email:', error);
    return { success: false, error: error.message };
  }
}


function getEmailTemplate(type, data) {
  switch (type) {
    case 'job_recommendation':
      return {
        subject: `Nouvelle recommandation d'emploi: ${data.jobTitle}`,
        text: `Nous avons trouvé un emploi qui correspond à votre profil: ${data.jobTitle} chez ${data.company} à ${data.location}. Salaire: ${data.salary}. Pour en savoir plus, visitez notre site.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Nouvelle recommandation d'emploi</h2>
            <p>Bonjour,</p>
            <p>Nous avons trouvé un emploi qui correspond à votre profil:</p>
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
              <h3 style="color: #4a00e0; margin-top: 0;">${data.jobTitle}</h3>
              <p><strong>Entreprise:</strong> ${data.company}</p>
              <p><strong>Lieu:</strong> ${data.location}</p>
              <p><strong>Salaire:</strong> ${data.salary}</p>
              <p>${data.description}</p>
              <a href="${data.url}" style="display: inline-block; background-color: #4a00e0; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px; margin-top: 10px;">Voir l'offre</a>
            </div>
            <p>Cordialement,<br>L'équipe de recrutement</p>
          </div>
        `,
      };
    
    case 'application_update':
      return {
        subject: `Mise à jour de votre candidature: ${data.status}`,
        text: `Votre candidature pour le poste de ${data.jobTitle} chez ${data.company} a été mise à jour. Statut actuel: ${data.status}.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Mise à jour de votre candidature</h2>
            <p>Bonjour,</p>
            <p>Votre candidature pour le poste de <strong>${data.jobTitle}</strong> chez <strong>${data.company}</strong> a été mise à jour.</p>
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
              <p><strong>Statut actuel:</strong> <span style="color: #4a00e0;">${data.status}</span></p>
              <p>${data.message}</p>
              <a href="${data.url}" style="display: inline-block; background-color: #4a00e0; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px; margin-top: 10px;">Voir les détails</a>
            </div>
            <p>Cordialement,<br>L'équipe de recrutement</p>
          </div>
        `,
      };
    
    case 'test_notification':
      return {
        subject: 'Test de notification par email',
        text: 'Ceci est un email de test pour vérifier vos paramètres de notification.',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Test de notification</h2>
            <p>Bonjour,</p>
            <p>Ceci est un email de test pour vérifier que vos paramètres de notification fonctionnent correctement.</p>
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
              <p>Si vous recevez cet email, cela signifie que vos paramètres de notification par email sont correctement configurés.</p>
            </div>
            <p>Cordialement,<br>L'équipe de support</p>
          </div>
        `,
      };
    
    default:
      return {
        subject: 'Notification',
        text: 'Vous avez reçu une nouvelle notification.',
        html: '<div><p>Vous avez reçu une nouvelle notification.</p></div>',
      };
  }
}


export async function sendNotificationEmail(to, type, data = {}) {
  try {
    // Sélectionner le template en fonction du type
    const template = getEmailTemplate(type, data);
    
    return await sendEmail({
      to,
      subject: template.subject,
      text: template.text,
      html: template.html,
    });
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email de notification:', error);
    return { success: false, error: error.message };
  }
}


export async function verifyEmailConfig() {
    try {
      if (!process.env.EMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
        console.error('Configuration manquante - EMAIL_USER:', !!process.env.EMAIL_USER, 'GMAIL_APP_PASSWORD:', !!process.env.GMAIL_APP_PASSWORD);
        return false;
      }
      
      const transport = getTransporter();
      await transport.verify();
      console.log('✅ Configuration email valide');
      return true;
    } catch (error) {
      console.error('❌ Erreur de vérification SMTP:', error.message);
      if (error.code) console.error('Code erreur:', error.code);
      return false;
    }
  }
