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