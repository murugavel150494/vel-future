const Top10Model = require('../models/top10.model');

exports.createTop10Video = async (req, res) => {
  try {
    const { timestamp } = req.body;
    const result = await Top10Model.generateTop10VideoTask(timestamp);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.createTop10Thumbnail = async (req, res) => {
  try {
    const { timestamp } = req.body;
    const result = await Top10Model.generateTop10ThumbnailTask(timestamp);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};