// routes/analytics.js
const express    = require('express');
const router     = express.Router();
const Submission = require('../models/Submission');

// ─── GET /api/stats  ──────────────────────────────────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    const [
      totalRecords,
      stateCount,
      districtCount,
      landAgg,
      wellAgg,
    ] = await Promise.all([
      Submission.countDocuments(),
      Submission.distinct('state').then(a => a.length),
      Submission.distinct('district').then(a => a.length),
      Submission.aggregate([
        { $match: { land_size: { $ne: null } } },
        { $group: { _id: null, total: { $sum: '$land_size' }, avg: { $avg: '$land_size' } } },
      ]),
      Submission.aggregate([
        { $match: { well_depth: { $ne: null } } },
        { $group: { _id: null, avg: { $avg: '$well_depth' } } },
      ]),
    ]);

    res.json({
      success: true,
      totalRecords,
      stateCount,
      districtCount,
      totalLand:       landAgg[0]?.total      ?? 0,
      avgLandHolding:  landAgg[0]?.avg?.toFixed(2) ?? '—',
      avgWellDepth:    wellAgg[0]?.avg?.toFixed(1)  ?? '—',
    });
  } catch (err) {
    console.error('GET /stats:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ─── GET /api/land  ───────────────────────────────────────────────────────────
router.get('/land', async (req, res) => {
  try {
    const filter = {};
    if (req.query.region) filter.region = req.query.region;

    const byCategory = await Submission.aggregate([
      { $match: { ...filter, land_category: { $ne: null } } },
      { $group: { _id: '$land_category', count: { $sum: 1 }, totalArea: { $sum: '$land_size' } } },
      { $project: { _id: 0, category: '$_id', count: 1, totalArea: 1 } },
      { $sort: { category: 1 } },
    ]);

    const byState = await Submission.aggregate([
      { $match: filter },
      { $group: { _id: '$state', count: { $sum: 1 }, avgLand: { $avg: '$land_size' } } },
      { $project: { _id: 0, state: '$_id', count: 1, avgLand: { $round: ['$avgLand', 2] } } },
      { $sort: { count: -1 } },
      { $limit: 15 },
    ]);

    res.json({ success: true, byCategory, byState });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ─── GET /api/irrigation  ────────────────────────────────────────────────────
router.get('/irrigation', async (req, res) => {
  try {
    const filter = {};
    if (req.query.region) filter.region = req.query.region;

    const bySubmission = await Submission.aggregate([
      { $match: { ...filter, irrigation_src: { $ne: null } } },
      { $group: { _id: '$irrigation_src', count: { $sum: 1 } } },
      { $project: { _id: 0, source: '$_id', count: 1 } },
      { $sort: { count: -1 } },
    ]);

    res.json({ success: true, bySubmission });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ─── GET /api/cropping  ──────────────────────────────────────────────────────
router.get('/cropping', async (req, res) => {
  try {
    const [kharif, rabi] = await Promise.all([
      Submission.aggregate([
        { $match: { kharif_crop: { $ne: null } } },
        { $group: { _id: '$kharif_crop', count: { $sum: 1 } } },
        { $project: { _id: 0, crop_name: '$_id', count: 1, season: { $literal: 'kharif' } } },
        { $sort: { count: -1 } }, { $limit: 10 },
      ]),
      Submission.aggregate([
        { $match: { rabi_crop: { $ne: null } } },
        { $group: { _id: '$rabi_crop', count: { $sum: 1 } } },
        { $project: { _id: 0, crop_name: '$_id', count: 1, season: { $literal: 'rabi' } } },
        { $sort: { count: -1 } }, { $limit: 10 },
      ]),
    ]);

    const allCrops = [...kharif, ...rabi];
    const topCrops = [...new Set(allCrops.map(c => c.crop_name))].slice(0, 10);

    res.json({ success: true, bySeasonCrop: allCrops, topCrops });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ─── GET /api/wells  ─────────────────────────────────────────────────────────
router.get('/wells', async (req, res) => {
  try {
    const trend = await Submission.aggregate([
      { $match: { well_depth: { $ne: null } } },
      { $group: {
        _id:       { $year: '$createdAt' },
        avg_depth: { $avg: '$well_depth' },
        count:     { $sum: 1 },
      }},
      { $project: { _id: 0, year: '$_id', avg_depth: { $round: ['$avg_depth', 1] }, count: 1 } },
      { $sort: { year: 1 } },
    ]);

    const byState = await Submission.aggregate([
      { $match: { well_depth: { $ne: null } } },
      { $group: { _id: '$state', avg_depth: { $avg: '$well_depth' } } },
      { $project: { _id: 0, state: '$_id', avg_depth: { $round: ['$avg_depth', 1] } } },
      { $sort: { avg_depth: -1 } },
    ]);

    res.json({ success: true, trend, byState });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;
