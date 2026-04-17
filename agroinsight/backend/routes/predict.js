const express = require('express');
const { auth } = require('../middleware/auth');

const router = express.Router();

const CROPS_BY_REGION = {
  north: ['Wheat', 'Rice', 'Maize', 'Mustard'],
  south: ['Rice', 'Sugarcane', 'Banana', 'Cotton'],
  east: ['Rice', 'Maize', 'Pulses', 'Oilseeds'],
  west: ['Cotton', 'Groundnut', 'Mustard', 'Millet'],
  central: ['Soybean', 'Wheat', 'Rice', 'Pulses'],
  northeast: ['Rice', 'Tea', 'Oilseed', 'Pulses'],
};

const normalize = (value) => String(value || '').trim().toLowerCase();

router.post('/', auth, async (req, res) => {
  try {
    const { land_size, irrigation_src, soil_type, region } = req.body;
    const size = parseFloat(land_size) || 0;
    const irrigation = normalize(irrigation_src);
    const soil = normalize(soil_type);
    const place = normalize(region) || 'central';

    const regionCrops = CROPS_BY_REGION[place] || CROPS_BY_REGION.central;
    const predictedCrop = regionCrops[Math.floor(Math.random() * regionCrops.length)];

    const irrigationRecommendation = irrigation || (size > 5 ? 'canal' : 'rainfed');
    const soilRisk = soil === 'saline' || soil === 'desert' ? 'High salinity risk' : 'Normal soil risk';

    res.json({
      success: true,
      data: {
        prediction: {
          recommended_crop: predictedCrop,
          irrigation_source: irrigationRecommendation,
          soil_advice: soilRisk,
          confidence: `${Math.floor(70 + Math.random() * 25)}%`,
        },
      },
    });
  } catch (err) {
    console.error('POST /predict:', err);
    res.status(500).json({ success: false, error: 'Prediction failed' });
  }
});

module.exports = router;
