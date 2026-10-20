const express = require('express');
const router = express.Router();
const top10Controller = require('../controllers/top10.controller');

router.post('/create-video', top10Controller.createTop10Video);
router.post('/create-thumbnail', top10Controller.createTop10Thumbnail);

module.exports = router;