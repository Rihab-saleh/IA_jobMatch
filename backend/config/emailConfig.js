const nodemailer = require("nodemailer");
const { google } = require("googleapis");

// Logging amélioré avec couleurs
const logInfo = (message) => console.log('\x1b[36m[INFO]\x1b[0m', message);
const logWarning = (message) => console.log('\x1b[33m[WARN]\x1b[0m', message);
const logError = (message, error = null) => {
  console.error('\x1b[31m[ERROR]\x1b[0m', message);
  if (error) console.error(error.stack || error);
};

// Vérification des variables d'environnement
function checkEnvVars() {
  const requiredVars = ['EMAIL_USER'];
  if (process.env.EMAIL_USE_OAUTH === 'true') {
    requiredVars.push('OAUTH_CLIENT_ID', 'OAUTH_CLIENT_SECRET', 'OAUTH_REFRESH_TOKEN');
  } else {
    requiredVars.push('EMAIL_APP_PASSWORD');
  }

  const missingVars = requiredVars.filter(v => !process.env[v]);
  if (missingVars.length > 0) {
    logError(`Variables manquantes: ${missingVars.join(', ')}`);
    return false;
  }
  return true;
}

// Générateur de token OAuth2
async function getOAuthToken() {
  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.OAUTH_CLIENT_ID,
      process.env.OAUTH_CLIENT_SECRET,
      process.env.OAUTH_REDIRECT_URI || 'https://developers.google.com/oauthplayground'
    );

    oauth2Client.setCredentials({
      refresh_token: process.env.OAUTH_REFRESH_TOKEN
    });

    const { token } = await oauth2Client.getAccessToken();
    return token;
  } catch (error) {
    logError('Échec de la génération du token OAuth2', error);
    throw error;
  }
}

// Configuration du transporteur
async function setupTransporter() {
  if (!checkEnvVars()) {
    logWarning('Configuration email incomplète - service désactivé');
    return null;
  }

  const isOAuth = process.env.EMAIL_USE_OAUTH === 'true';
  const config = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    auth: {
      user: process.env.EMAIL_USER
    },
    tls: {
      rejectUnauthorized: process.env.NODE_ENV === 'production'
    },
    connectionTimeout: 10000
  };

  if (isOAuth) {
    try {
      config.port = 465;
      config.secure = true;
      config.auth.type = 'OAuth2';
      config.auth.clientId = process.env.OAUTH_CLIENT_ID;
      config.auth.clientSecret = process.env.OAUTH_CLIENT_SECRET;
      config.auth.refreshToken = process.env.OAUTH_REFRESH_TOKEN;
      config.auth.accessToken = await getOAuthToken();
    } catch (error) {
      logError('Échec de la configuration OAuth2', error);
      return null;
    }
  } else {
    config.port = process.env.SMTP_PORT || 587;
    config.secure = false;
    config.auth.pass = process.env.EMAIL_APP_PASSWORD;
  }

  const transporter = nodemailer.createTransport(config);

  if (isOAuth) {
    transporter.on('token', token => {
      logInfo('Token OAuth2 rafraîchi');
      transporter.options.auth.accessToken = token.accessToken;
    });
  }

  return transporter;
}

// Service email
class EmailService {
  constructor() {
    this.transporterPromise = setupTransporter();
    this.verifyConnection();
  }

  async verifyConnection() {
    try {
      const transporter = await this.transporterPromise;
      if (!transporter) return false;

      await transporter.verify();
      logInfo('Connexion SMTP vérifiée');
      return true;
    } catch (error) {
      logError('Échec de la vérification SMTP', error);
      return false;
    }
  }

  async sendEmail(options) {
    try {
      const transporter = await this.transporterPromise;
      if (!transporter) {
        throw new Error('Service email non disponible');
      }

      const mailOptions = {
        from: options.from || `"${process.env.EMAIL_FROM_NAME || 'System'}" <${process.env.EMAIL_USER}>`,
        ...options
      };

      const info = await transporter.sendMail(mailOptions);
      logInfo(`Email envoyé à ${options.to}`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      logError(`Échec d'envoi à ${options.to}`, error);
      return {
        success: false,
        error: error.message,
        ...(process.env.NODE_ENV === 'development' && { details: error.stack })
      };
    }
  }
}

// Singleton du service email
const emailService = new EmailService();

// Debug SMTP
if (process.env.EMAIL_DEBUG === 'true') {
  emailService.transporterPromise.then(transporter => {
    transporter?.set('debug', (level, message) => {
      console.log(`[SMTP ${level}] ${message}`);
    });
  });
}

module.exports = {
  transporter: emailService.transporterPromise,
  sendEmail: emailService.sendEmail.bind(emailService),
  verifyConnection: emailService.verifyConnection.bind(emailService)
};