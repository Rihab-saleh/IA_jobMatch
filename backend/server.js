const express = require("express")
const connectDB = require("./config/db")
const cors = require("cors")
const config = require("./config/config")
const userRoutes = require("./routes/userRoutes")
const adminRoutes = require("./routes/adminRoutes")
const recommendationRoutes = require("./routes/recommendationRoutes")
const jobRoutes = require("./routes/jobRoutes")
const authRoutes = require("./routes/auth.routes")
const { authMiddleware, adminMiddleware } = require("./middlewares/authMiddleware")
const bcrypt = require("bcryptjs")
const Person = require("./models/person_model")
const Admin = require("./models/admin_model")

const app = express()
require("dotenv").config()

app.use(cors({
  origin: '*', // Or specify allowed origins here, e.g., "http://localhost:3000"
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json())
const path = require('path')
// Function to create the first admin person
async function createFirstAdmin() {
  try {
    const adminEmail = process.env.ADMIN_EMAIL
    const adminPassword = process.env.ADMIN_PASSWORD
    const adminFirstName = process.env.ADMIN_FIRST_NAME || "Admin"
    const adminLastName = process.env.ADMIN_LAST_NAME || "User"
    const adminAge = process.env.ADMIN_AGE || 30 // Default age if not provided

    if (!adminEmail || !adminPassword) {
      console.error("Admin email and password must be provided in environment variables")
      return
    }

    // Check if admin already exists in Person model
    const existingAdmin = await Person.findOne({ email: adminEmail })

    let adminPerson

    if (!existingAdmin) {
      // Create admin person
      const hashedPassword = await bcrypt.hash(adminPassword, 10)

      adminPerson = new Person({
        firstName: adminFirstName,
        lastName: adminLastName,
        email: adminEmail,
        password: hashedPassword,
        role: "admin",
        age: adminAge,
      })

      await adminPerson.save()
      console.log("Admin person created:", adminPerson)
    } else {
      adminPerson = existingAdmin
      console.log("Admin person already exists")
    }

    // Check if admin record exists in Admin model
    const existingAdminRecord = await Admin.findOne({ person: adminPerson._id })

    if (!existingAdminRecord) {
      // Create admin record
      const adminRecord = new Admin({
        person: adminPerson._id,
      })

      await adminRecord.save()
      console.log("Admin record created:", adminRecord)
    } else {
      console.log("Admin record already exists")
    }
  } catch (error) {
    console.error("Error creating first admin:", error)
  }
}

// Connect to the database and create the first admin person
connectDB().then(() => {
  //createFirstAdmin()
})

// Routes
app.use("/api/auth", authRoutes)

// Set up protected routes
app.use("/api/users", authMiddleware, userRoutes)
app.use("/api/admin", authMiddleware, adminMiddleware, adminRoutes)
app.use("/api/recommendations", authMiddleware, recommendationRoutes)
app.use("/api/jobs", authMiddleware, jobRoutes)
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')))
// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).send("Something broke!")
})

// Start the server
app.listen(config.app.port, () => {
  console.log(`Server is running on port ${config.app.port}`)
})

