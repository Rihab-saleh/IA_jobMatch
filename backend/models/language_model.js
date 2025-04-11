// models/language.model.js
const mongoose = require('mongoose');

const languageSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 50,
    },
    level: {
        type: String,
        enum: ['Beginner', 'Intermediate', 'Advanced', 'Fluent', 'Native'],
        required: true,
    },
   
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
    }, {
    timestamps: true,  // Crée automatiquement `createdAt` et `updatedAt`
});



module.exports = mongoose.model('Language', languageSchema);