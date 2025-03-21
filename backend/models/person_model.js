const mongoose = require("mongoose")

const personSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    age: { type: Number, required: false },
    phoneNumber: { type: String, required: false },
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

