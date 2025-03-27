const mongoose = require("mongoose")

const personSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    age: { type: Number, required: false },
    phoneNumber: { 
      type: String, 
      required: false,
      validate: {
        validator: function(v) {
          // Validation plus permissive pour les numéros internationaux
          return !v || /^\+?[0-9\s\-\(\)]{8,20}$/.test(v);
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

