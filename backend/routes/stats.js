const express = require('express');
const router = express.Router();
const Submission = require('../models/Submission');

// -------------------------------------------------------
// GET /api/stats  — summary KPI numbers for hero counters
// -------------------------------------------------------
const getStats = async (req, res) => {
  try {
    const [
      totalRecords,
      stateAgg,
      districtAgg,
      landAgg,
      wellAgg,
    ] = await Promise.all([
      Submission.countDocuments(),
      Submission.distinct('state'),
      Submission.distinct('district'),
      Submission.aggregate([
        { $match: { land_size: { $ne: null } } },
        { $group: { _id: null, totalLand: { $sum: '$land_size' }, avgLand: { $avg: '$land_size' } } },
      ]),
      Submission.aggregate([
        { $match: { well_depth: { $ne: null } } },
        { $group: { _id: null, avgWellDepth: { $avg: '$well_depth' } } },
      ]),
    ]);

    res.json({
      success: true,
      totalRecords,
      stateCount: stateAgg.length,
      districtCount: districtAgg.length,
      totalLand: landAgg[0]?.totalLand || 0,
      avgLandHolding: landAgg[0] ? landAgg[0].avgLand.toFixed(2) : '—',
      avgWellDepth: wellAgg[0] ? wellAgg[0].avgWellDepth.toFixed(1) : '—',
    });
  } catch (err) {
    console.error('GET /stats error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch stats' });
  }
};

router.get('/stats', getStats);

// Backward-compatible alias
router.get('/', getStats);

// -------------------------------------------------------
// GET /api/land  — land holding distribution (for chart)
// -------------------------------------------------------
router.get('/land', async (req, res) => {
  try {
    const filter = {};
    if (req.query.region && req.query.region !== 'all') {
      filter.state = req.query.region;
    }

    const byCategory = await Submission.aggregate([
      { $match: { ...filter, land_category: { $ne: null } } },
      { $group: { _id: '$land_category', count: { $sum: 1 } } },
      { $project: { category: '$_id', count: 1, _id: 0 } },
    ]);

    res.json({ success: true, byCategory });
  } catch (err) {
    console.error('GET /land error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch land data' });
  }
});

// -------------------------------------------------------
// GET /api/irrigation  — irrigation source breakdown
// -------------------------------------------------------
router.get('/irrigation', async (req, res) => {
  try {
    const filter = {};
    if (req.query.region && req.query.region !== 'all') {
      filter.state = req.query.region;
    }

    const bySubmission = await Submission.aggregate([
      { $match: { ...filter, irrigation_src: { $ne: null } } },
      { $group: { _id: '$irrigation_src', count: { $sum: 1 } } },
      { $project: { source: '$_id', count: 1, _id: 0 } },
      { $sort: { count: -1 } },
    ]);

    res.json({ success: true, bySubmission });
  } catch (err) {
    console.error('GET /irrigation error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch irrigation data' });
  }
});

// -------------------------------------------------------
// GET /api/cropping  — crop breakdown by season
// -------------------------------------------------------
router.get('/cropping', async (req, res) => {
  try {
    const [kharif, rabi] = await Promise.all([
      Submission.aggregate([
        { $match: { kharif_crop: { $ne: null, $ne: '' } } },
        { $group: { _id: { $toLower: '$kharif_crop' }, count: { $sum: 1 } } },
        { $project: { crop_name: '$_id', count: 1, season: { $literal: 'kharif' }, _id: 0 } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      Submission.aggregate([
        { $match: { rabi_crop: { $ne: null, $ne: '' } } },
        { $group: { _id: { $toLower: '$rabi_crop' }, count: { $sum: 1 } } },
        { $project: { crop_name: '$_id', count: 1, season: { $literal: 'rabi' }, _id: 0 } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
    ]);

    const topCrops = [...new Set([...kharif.map((x) => x.crop_name), ...rabi.map((x) => x.crop_name)])].slice(0, 10);

    res.json({
      success: true,
      topCrops,
      bySeasonCrop: [...kharif, ...rabi],
    });
  } catch (err) {
    console.error('GET /cropping error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch cropping data' });
  }
});

// -------------------------------------------------------
// GET /api/wells  — well depth trends (grouped by year)
// -------------------------------------------------------
router.get('/wells', async (req, res) => {
  try {
    const trend = await Submission.aggregate([
      { $match: { well_depth: { $ne: null } } },
      {
        $group: {
          _id: { $year: '$createdAt' },
          avg_depth: { $avg: '$well_depth' },
          count: { $sum: 1 },
        },
      },
      { $project: { year: '$_id', avg_depth: { $round: ['$avg_depth', 1] }, count: 1, _id: 0 } },
      { $sort: { year: 1 } },
    ]);

    res.json({ success: true, trend });
  } catch (err) {
    console.error('GET /wells error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch well data' });
  }
});

module.exports = router;
