const mongoose = require("mongoose")

const personSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { 
      type: String, 
      required: true, 
      unique: true,
      lowercase: true,
      trim: true
    },
    resetToken: {
      type: String,
      default: null,
    },
    resetTokenExpires: {
      type: Date,
      default: null
    },
    //
    age: { type: Number, required: false },
    phoneNumber: { 
      type: String, 
      required: false,
      validate: {
        validator: function(v) {
          // Validation simple pour numéro de téléphone (peut être adapté)
          return !v || /^[0-9]{8,15}$/.test(v)
        },
        message: props => `${props.value} n'est pas un numéro de téléphone valide!`
      }
    },
    password: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    profilePicture: {
      url: { type: String, default: null },
      publicId: { type: String, default: null },
    },
    role: {
      type: String,
      required: true,
      enum: ["user", "admin"],
      default: "user",
    },
  },
  { timestamps: true },
)

const Person = mongoose.model("Person", personSchema)

module.exports = Person

