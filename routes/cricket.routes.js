const express = require('express');
const router = express.Router();
const cricketController = require('../controllers/cricket.controller');

router.post('/create-video', cricketController.createNewsVideo);
router.post('/create-thumbnail', cricketController.createThumbnail);

module.exports = router;