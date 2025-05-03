// routes/log.js
const express = require('express');
const router = express.Router();
const VisitorLog = require('../models/visitor_model');

router.get('/log-visit', (req, res) => {
    const log = new VisitorLog({
      ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
      route: req.originalUrl,
      method: req.method,
    });
  
    log.save()
      .then(() => {
        res.status(200).json({
          success: true,
          message: 'Visite enregistrée avec succès',
        });
      })
      .catch((err) => {
        console.error('Erreur d\'enregistrement visiteur :', err);
        res.status(500).json({
          success: false,
          message: 'Erreur lors de l\'enregistrement de la visite',
        });
      });
  });
  

module.exports = router;
