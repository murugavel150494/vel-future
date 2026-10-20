// controllers/cricket.controller.js
const CricketModel = require('../models/cricket.model');
const path = require('path');

exports.createNewsVideo = async (req, res) => {
  try {
    const { timestamp } = req.body;
    
    // Generates the video and returns the file path (e.g., 'final-tamil-news-video.mp4')
    const result = await CricketModel.generateNewsVideoTask(timestamp);
    const absolutePath = path.resolve(result.videoPath);

    // Send the file directly to the browser as an attachment download
    res.download(absolutePath, 'final-tamil-news-video.mp4', (err) => {
      if (err) {
        console.error('[Download Error]', err);
        if (!res.headersSent) {
          res.status(500).json({ success: false, error: 'Could not download the generated video.' });
        }
      }
    });

  } catch (error) {
    console.error('[Controller Error]', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.createThumbnail = async (req, res) => {
  try {
    const { timestamp } = req.body;
    const result = await CricketModel.generateThumbnailTask(timestamp);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};