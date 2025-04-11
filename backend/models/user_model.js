const mongoose = require('mongoose');
const person = require('./person_model'); // Import Person model
const skills = require('./skill_model'); // Import Skill model
const profile = require('./profile_model'); // Import Profile model
const notifications = require('./notification_model'); // Import Notification model
const UserPreferences = require('./UserPreferences_model'); // Import UserPreferences model
const request=require('./accountstatus_request');

const userSchema = new mongoose.Schema({
    person: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Person',
      required: true
    },
    skills: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Skill',
      default: []
    }],
    profile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Profile',
      required: false,
    },
    isActive: {
      type: Boolean,
      default: true
    },
    
    accountStatusRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'request',
      required: false,
    },
    notifications: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Notification',
      default: []
    }],
    UserPreferences: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UserPreferences',
      required: false
    }
  }, { timestamps: true });
  
  const User = mongoose.model('User', userSchema, 'users');
  
  module.exports = User;