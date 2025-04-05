const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const forgotPasswordSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Utilisateur requis']
  },
  token: {
    type: String,
    required: [true, 'Token requis'],
    unique: true
  },
  expiresAt: {
    type: Date,
    required: [true, 'Date d\'expiration requise'],
    index: { expires: '1h' } // Auto-suppression après expiration
  },
  ipAddress: {
    type: String,
    required: [true, 'Adresse IP requise']
  },
  userAgent: {
    type: String,
    required: [true, 'User-Agent requis']
  },
  isUsed: {
    type: Boolean,
    default: false
  },
  attempts: {
    type: Number,
    default: 0,
    max: [3, 'Maximum 3 tentatives autorisées']
  }
}, {
  timestamps: true,
  versionKey: false
});

// Middleware pour hacher le token avant sauvegarde
forgotPasswordSchema.pre('save', async function(next) {
  if (this.isModified('token')) {
    this.token = await bcrypt.hash(this.token, 10);
  }
  next();
});

// Méthode pour vérifier le token
forgotPasswordSchema.methods.invalidate = async function() {
  try {
    // Vérifie si le document est déjà en cours de sauvegarde
    if (this.$isSaving) {
      return this;
    }

    // Marque le document comme étant en cours de sauvegarde
    this.$isSaving = true;
    this.isUsed = true;
    
    // Sauvegarde avec gestion explicite des erreurs
    await this.save();
    
    // Réinitialise le flag de sauvegarde
    this.$isSaving = false;
    return this;
  } catch (error) {
    this.$isSaving = false;
    console.error('Erreur lors de l\'invalidation:', error);
    throw error;
  }
};

const ForgotPassword = mongoose.model('ForgotPassword', forgotPasswordSchema);

module.exports = ForgotPassword;