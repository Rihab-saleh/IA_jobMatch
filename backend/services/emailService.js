import nodemailer from 'nodemailer';
import mongoose from 'mongoose';
import NotificationSettings from '../models/notification_model.js';
import User from '../models/user_model.js';

// Cache du transporteur SMTP
let transporter = null;

/**
 * Crée ou retourne le transporteur SMTP configuré
 */
export function getTransporter() {
  if (transporter) return transporter;

  if (!process.env.EMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    throw new Error('Configuration SMTP manquante');
  }

  transporter = nodemailer.createTransport({
    service: 'gmail',
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
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

/**
 * Envoie un email générique
 */
export async function sendEmail({ to, subject, text, html }) {
  try {
    const transport = getTransporter();

    const info = await transport.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || 'Notification System'}" <${process.env.EMAIL_USER}>`,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject,
      text,
      html: html || text
    });

    return { 
      success: true, 
      messageId: info.messageId 
    };
  } catch (error) {
    console.error('Email sending error:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
}

/**
 * Récupère les paramètres de notification d'un utilisateur
 */
export async function getNotificationSettings(userId, userEmail, userName) {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error('ID utilisateur invalide');
  }

  const settings = await NotificationSettings.findOne({ userId });

  return {
    email: settings?.email ?? true,
    jobAlerts: settings?.jobAlerts ?? true,
    applicationUpdates: settings?.applicationUpdates ?? true,
    frequency: settings?.frequency ?? 'daily',
    userEmail: userEmail, // Utilise l'email du token
    userName: userName // Utilise le nom complet du token
  };
}

/**
 * Met à jour les paramètres de notification
 */
export async function updateNotificationSettings(userId, { email, jobAlerts, applicationUpdates, frequency }) {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error('ID utilisateur invalide');
  }

  const updatedSettings = await NotificationSettings.findOneAndUpdate(
    { userId },
    { 
      email,
      jobAlerts,
      applicationUpdates,
      frequency: ['immediately', 'daily', 'weekly'].includes(frequency) 
        ? frequency 
        : 'daily'
    },
    { new: true, upsert: true }
  );

  return {
    email: updatedSettings.email,
    jobAlerts: updatedSettings.jobAlerts,
    applicationUpdates: updatedSettings.applicationUpdates,
    frequency: updatedSettings.frequency
  };
}


export async function sendJobAlertEmail(type, data, req) {
  const userName = req.user.fullName; // Get the user's full name from the token
  const recipientEmail = req.user.email; // Get the user's email from the token
  const greeting = userName ? `Bonjour ${userName},` : 'Bonjour,';

  let emailContent;

  switch (type) {
    case 'job_alert':
      emailContent = {
        subject: `Nouvelle recommandation d'emploi: ${data.jobTitle}`,
        text: `${greeting}\nNous avons trouvé un emploi qui correspond à votre profil:\n\n` +
              `Poste: ${data.jobTitle}\nEntreprise: ${data.company}\nLieu: ${data.location}\n` +
              `Salaire: ${data.salary}\nDescription: ${data.description}\nLien: ${data.url}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4a00e0;">Nouvelle recommandation d'emploi</h2>
            <p>${greeting}</p>
            <p>Nous avons trouvé un emploi qui correspond à votre profil :</p>
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
              <h3 style="margin-top: 0; color: #4a00e0;">${data.jobTitle}</h3>
              <p><strong>Entreprise :</strong> ${data.company}</p>
              <p><strong>Lieu :</strong> ${data.location}</p>
              <p><strong>Salaire :</strong> ${data.salary}</p>
              <p>${data.description}</p>
              <a href="${data.url}" style="display: inline-block; background-color: #4a00e0; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px; margin-top: 10px;">Voir l'offre complète</a>
            </div>
            <p>Cordialement,<br>L'équipe de recrutement</p>
          </div>
        `,
      };
      break;

    case 'application_update':
      emailContent = {
        subject: `Mise à jour de candidature: ${data.status}`,
        text: `${greeting}\nVotre candidature pour ${data.jobTitle} chez ${data.company}\n` +
              `Statut : ${data.status}\nMessage : ${data.message}\nLien : ${data.url}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4a00e0;">Mise à jour de candidature</h2>
            <p>${greeting}</p>
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
              <h3 style="margin-top: 0;">${data.jobTitle}</h3>
              <p><strong>Entreprise :</strong> ${data.company}</p>
              <p><strong>Statut :</strong> <span style="color: #4a00e0;">${data.status}</span></p>
              <p>${data.message}</p>
              <a href="${data.url}" style="display: inline-block; background-color: #4a00e0; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px; margin-top: 10px;">Détails de la candidature</a>
            </div>
            <p>Cordialement,<br>L'équipe de recrutement</p>
          </div>
        `,
      };
      break;

    default:
      emailContent = {
        subject: 'Notification système',
        text: `${greeting}\nVous avez reçu une nouvelle notification.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4a00e0;">Notification système</h2>
            <p>${greeting}</p>
            <p>Vous avez reçu une nouvelle notification.</p>
          </div>
        `,
      };
      break;
  }

  // Send the email using Nodemailer
  try {
    const transporter = getTransporter();

    const info = await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || 'Notification System'}" <${process.env.EMAIL_USER}>`,
      to: recipientEmail,
      subject: emailContent.subject,
      text: emailContent.text,
      html: emailContent.html,
    });

    console.log('Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error.message);
    return { success: false, error: error.message };
  }
}

export async function verifyEmailConfig() {
  try {
    const transport = getTransporter();
    await transport.verify();
    return { valid: true };
  } catch (error) {
    return { 
      valid: false, 
      error: error.message 
    };
  }
}