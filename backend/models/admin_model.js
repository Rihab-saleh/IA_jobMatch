const mongoose = require('mongoose');
const Person = require('./person_model'); // Import Person model

// Define the Admin schema
const adminSchema = new mongoose.Schema({
    person: {
        type: mongoose.Schema.Types.ObjectId, // Reference to Person model
        ref: 'Person', // Refers to the Person collection
        required: true // Ensure that each Admin has a Person
    },
}, { 
    timestamps: true // Automatically create createdAt and updatedAt fields
});

// Create the Admin model based on the schema
const Admin = mongoose.model('Admin', adminSchema);

module.exports = Admin;
