const path = require('path');
const fs = require('fs');
const CricketModel = require('../models/cricket.model');

/**
 * Controller for automated Tamil news video generation, 
 * SEO metadata extraction, and thumbnail prompt creation.
 */
exports.createNewsVideo = async (req, res) => {
  try {
    const timestamp = new Date().toISOString();
    console.log(`[CricketController] Received request to generate video at ${timestamp}`);

    // Call the updated model task
    const result = await CricketModel.generateNewsVideoTask(timestamp);

    // Return the full JSON response containing video, SEO details, and thumbnail prompt
    return res.status(200).json(result);

  } catch (error) {
    console.error('Error in createVideo controller:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Internal server error during video generation' 
    });
  }
};

/**
 * Controller for generating the standalone thumbnail image.
 * Accepts an optional custom prompt in the request body.
 */
exports.createThumbnail = async (req, res) => {
  try {
    const timestamp = new Date().toISOString();
    const customPrompt = req.body && req.body.prompt ? req.body.prompt : undefined;

    console.log(`[CricketController] Received request to generate thumbnail at ${timestamp}`);

    const thumbnailPath = await CricketModel.generateThumbnailTask(timestamp, customPrompt);

    return res.status(200).json({
      success: true,
      message: 'Thumbnail generated and saved successfully!',
      thumbnailPath,
      timestamp
    });

  } catch (error) {
    console.error('Error in createThumbnail controller:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Internal server error during thumbnail generation' 
    });
  }
};

exports.downloadVideo = async (req, res) => {
  try {
    const { folder, filename } = req.params;
    
    // Absolute path to outputs/videoDDMMYYYY/filename.mp4
    const filePath = path.join(__dirname, '../outputs', folder, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'Video file not found on server.' });
    }

    // Triggers file download response safely
    res.download(filePath, filename, (err) => {
      if (err) {
        // Ignore client abort errors (e.g., video player seeking or user canceling download)
        if (err.code === 'ECONNABORTED' || err.message === 'Request aborted') {
          console.log(`[Stream Notice] Client closed/aborted connection for file: ${filename}`);
          return;
        }

        console.error('Error during file download stream:', err);
        if (!res.headersSent) {
          res.status(500).json({ success: false, message: 'Could not download the file.' });
        }
      }
    });

  } catch (error) {
    console.error('Error in downloadVideo controller:', error);
    if (!res.headersSent) {
      return res.status(500).json({ success: false, error: error.message || 'Internal server error during download' });
    }
  }
};