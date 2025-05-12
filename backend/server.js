const express = require("express");
const connectDB = require("./config/db");
const cors = require("cors");
const config = require("./config/config");
const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");
const { startScheduledRecommendations } = require('./services/recommendationScheduler'); 
const recommendationRoutes = require("./routes/recommendationRoutes");
const jobRoutes = require("./routes/jobRoutes");
const authRoutes = require("./routes/auth.routes");
const { authMiddleware, adminMiddleware } = require("./middlewares/authMiddleware");
const notificationRoutes = require("./routes/notificationRoutes");
const AdminConfig = require("./models/adminConfig_model");
const logVisitor = require('./middlewares/visitorLog');
const axios = require('axios');
const bcrypt = require("bcryptjs");
const Person = require("./models/person_model");
const Admin = require("./models/admin_model");
const path = require("path");
const logRoutes = require('./routes/log');

const app = express();
require("dotenv").config();

// Configuration CORS
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:3000", "http://192.168.1.100:5173"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept", "X-Requested-With", 'X-Ollama-Response-Time'],
  })
);
app.use(logVisitor);
// Middleware pour parser les requêtes JSON
app.use(express.json());

// Fonction pour créer le premier administrateur
async function createFirstAdmin() {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminFirstName = process.env.ADMIN_FIRST_NAME || "Admin";
    const adminLastName = process.env.ADMIN_LAST_NAME || "User";
    const adminAge = process.env.ADMIN_AGE || 30; // Âge par défaut si non fourni

    if (!adminEmail || !adminPassword) {
      console.error("Admin email and password must be provided in environment variables");
      return;
    }

    // Vérifier si l'administrateur existe déjà dans le modèle Person
    const existingAdmin = await Person.findOne({ email: adminEmail });

    let adminPerson;

    if (!existingAdmin) {
      // Créer un nouvel administrateur
      const hashedPassword = await bcrypt.hash(adminPassword, 10);

      adminPerson = new Person({
        firstName: adminFirstName,
        lastName: adminLastName,
        email: adminEmail,
        password: hashedPassword,
        role: "admin",
        age: adminAge,
      });

      await adminPerson.save();
      console.log("Admin person created:", adminPerson);
    } else {
      adminPerson = existingAdmin;
      console.log("Admin person already exists");
    }

    // Vérifier si l'enregistrement admin existe dans le modèle Admin
    const existingAdminRecord = await Admin.findOne({ person: adminPerson._id });

    if (!existingAdminRecord) {
      const adminRecord = new Admin({
        person: adminPerson._id,
      });

      await adminRecord.save();
      console.log("Admin record created:", adminRecord);
    } else {
      console.log("Admin record already exists");
    }
  } catch (error) {
    console.error("Error creating first admin:", error);
  }
}

// Connexion à la base de données et création du premier administrateur
connectDB()
  .then(() => {
    createFirstAdmin();
  })
  .catch((error) => {
    console.error("Failed to connect to the database:", error);
    process.exit(1); // Quitter le processus avec un code d'erreur
  });

// Définir les routes
app.use('/api', logRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", authMiddleware, userRoutes);
app.use("/api/admin", authMiddleware, adminMiddleware, adminRoutes);
app.use("/api/recommendations", authMiddleware, recommendationRoutes);
app.use("/api/jobs", authMiddleware, jobRoutes);
app.use("/api/notifications", authMiddleware, notificationRoutes);


// Gestion des routes non trouvées
app.use((req, res, next) => {
  res.status(404).json({ error: "Route not found" });
});
startScheduledRecommendations();
let modelName = 'llama2'; // Default model
let recommendationRunTime = '00:00'; 
// Fonction pour récupérer la configuration de l'admin
async function fetchAdminConfig() {
  try {
    const configData = await AdminConfig.findOne();
    if (configData) {
      if (configData.llmModel) {
        modelName = configData.llmModel;
        console.log(`Model selected from AdminConfig: ${modelName}`);
      } else {
        modelName = 'defaultModel';
        console.warn("No model found in AdminConfig, using default model");
      }

      if (configData.dailyRunTime) {
        recommendationRunTime = configData.dailyRunTime;
        console.log(`Recommendation scheduler time set to: ${recommendationRunTime}`);
      } else {
        recommendationRunTime = '00:00';
        console.warn("No dailyRunTime found in AdminConfig, using default 00:00");
      }
    } else {
      modelName = 'defaultModel';
      recommendationRunTime = '00:00';
      console.warn("No AdminConfig document found, using defaults");
    }
  } catch (error) {
    console.error("Error fetching admin configuration:", error.message);
    modelName = 'defaultModel';
    recommendationRunTime = '00:00';
  }
}

// Keep Ollama model alive
function keepOllamaModelAlive({ model, intervalMs = 60 * 1000 }) {
  const ollamaUrl = 'http://127.0.0.1:11434/api/generate';

  const pingModel = async () => {
    try {
      await axios.post(ollamaUrl, {
        prompt: 'ping',
        model: modelName,
        stream: false,
        options: { num_predict: 1 }
      });
      console.log(`Model being used: ${modelName}`);

      console.log(`[Ollama] Keep-alive ping successful for model "${model}"`);
    } catch (error) {
      console.log(`Model being used: ${modelName}`);

      console.warn(`[Ollama] Keep-alive ping failed: ${error.message}`);
    }
  };

  // Initial ping
  pingModel();

  // Repeat at interval
  setInterval(pingModel, intervalMs);
}


app.listen(config.app.port, async () => {
  console.log(`Server is running on port ${config.app.port}`);
  if (!config.app.port) {
    console.error("Error: Application port is not defined in the configuration.");
    process.exit(1);
  }
  await fetchAdminConfig();
  keepOllamaModelAlive({ model: modelName, intervalMs: 60_000 });
  if (!config.app.port) {
    console.error("Error: Application port is not defined in the configuration.");
    process.exit(1);
  }
});


