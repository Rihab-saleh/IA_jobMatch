const nodemailer = require('nodemailer');
const mongoose = require('mongoose');
const NotificationSettings = require('../models/notification_model.js');

// Cache du transporteur SMTP
let transporter = null;

/**
 * Crée ou retourne le transporteur SMTP configuré
 */
 function getTransporter() {
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
 * Récupère les notifications d'un utilisateur
 */
 async function getNotifications(userId) {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error("ID utilisateur invalide");
  }

  try {
    // Récupérer les notifications pour l'utilisateur
    const notifications = await NotificationSettings.find({ userId }).sort({ createdAt: -1 });

    if (!notifications || notifications.length === 0) {
      return { success: true, message: "Aucune notification trouvée", notifications: [] };
    }

    return { success: true, notifications };
  } catch (error) {
    console.error("Erreur lors de la récupération des notifications :", error.message);
    throw new Error("Impossible de récupérer les notifications");
  }
}

/**
 * Marque une notification comme lue
 */
 async function markAsRead(notificationId) {
  if (!mongoose.Types.ObjectId.isValid(notificationId)) {
    throw new Error("ID notification invalide");
  }

  try {
    // Recherche et mise à jour de la notification
    const updatedNotification = await NotificationSettings.findByIdAndUpdate(
      notificationId,
      { read: true },
      { new: true }
    );

    if (!updatedNotification) {
      throw new Error("Notification introuvable");
    }

    return {
      success: true,
      message: "Notification marquée comme lue",
      notification: updatedNotification,
    };
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la notification :", error.message);
    throw new Error("Impossible de marquer la notification comme lue");
  }
}

/**
 * Envoie un email
 */
 async function sendEmail({ to, subject, text, html }) {
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
 async function getNotificationSettings(userId, userEmail, userName) {
  try {
    
    
    // Vérification de l'ID
    if (!userId) {
      throw new Error('ID utilisateur manquant');
    }
    
    let settings = null;
    
    // Essayez de trouver les paramètres si l'ID est valide
    if (mongoose.Types.ObjectId.isValid(userId)) {
      try {
        settings = await NotificationSettings.findOne({ userId });
      } catch (dbError) {
        console.error('Erreur lors de la recherche des paramètres:', dbError);
      }
    } else {
      console.warn('ID utilisateur non valide pour MongoDB:', userId);
    }

    // Retournez les paramètres trouvés ou des valeurs par défaut
    return {
      email: settings?.email ?? true,
      jobAlerts: settings?.jobAlerts ?? true,
      applicationUpdates: settings?.applicationUpdates ?? true,
      frequency: settings?.frequency ?? 'daily',
      userEmail: userEmail, // Email du token
      userName: userName    // Nom du token
    };
  } catch (error) {
    console.error('Erreur dans getNotificationSettings:', error);
    throw error;
  }
}

/**
 * Met à jour les paramètres de notification
 */
 async function updateNotificationSettings(userId, { email, jobAlerts, applicationUpdates, frequency }) {
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
        : 'daily',
      lastUpdated: Date.now()
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

/**
 * Envoie un email d'alerte d'emploi ou de mise à jour de candidature
 */
 async function sendJobAlertEmail(type, data, req) {
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

  // Send the email using the sendEmail function
  return await sendEmail({
    to: recipientEmail,
    subject: emailContent.subject,
    text: emailContent.text,
    html: emailContent.html
  });
}

/**
 * Vérifie la configuration email
 */
 async function verifyEmailConfig() {
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
module.exports = {
  getTransporter,
  getNotifications,
  markAsRead,
  sendEmail,
  getNotificationSettings,
  updateNotificationSettings,
  sendJobAlertEmail,
  verifyEmailConfig
};
