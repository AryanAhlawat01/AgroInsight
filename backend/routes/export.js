const express = require('express');
const router = express.Router();
const Submission = require('../models/Submission');
const auth = require('../middleware/auth');

const headers = [
  'state', 'district', 'land_size', 'land_category',
  'irrigation_src', 'well_depth', 'kharif_crop', 'rabi_crop',
  'crop_intensity', 'soil_type', 'notes', 'createdAt',
];

const escapeCsv = (v) => {
  if (v == null) return '';
  const s = String(v);
  return s.includes(',') || s.includes('"') || s.includes('\n')
    ? `"${s.replace(/"/g, '""')}"`
    : s;
};

function sendExport(res, data, format, filePrefix) {
  if (format === 'csv') {
    if (data.length === 0) {
      return res.status(404).json({ success: false, error: 'No data to export' });
    }

    const rows = [
      headers.join(','),
      ...data.map((r) => headers.map((h) => escapeCsv(r[h])).join(',')),
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filePrefix}_${Date.now()}.csv"`);
    return res.send(rows);
  }

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="${filePrefix}_${Date.now()}.json"`);
  return res.json({ success: true, count: data.length, data });
}

// -------------------------------------------------------
// GET /api/export?format=csv|json&state=Punjab
// -------------------------------------------------------
router.get('/', async (req, res) => {
  try {
    const format = (req.query.format || 'json').toLowerCase();
    const filter = {};
    if (req.query.state) filter.state = req.query.state;

    const data = await Submission.find(filter)
      .sort({ createdAt: -1 })
      .limit(10000) // safety cap
      .select('-ip_hash -__v')
      .lean();

    return sendExport(res, data, format, 'agroinsight_export');
  } catch (err) {
    console.error('GET /export error:', err);
    res.status(500).json({ success: false, error: 'Export failed' });
  }
});

// -------------------------------------------------------
// GET /api/export/mine?format=csv|json
// -------------------------------------------------------
router.get('/mine', auth, async (req, res) => {
  try {
    const format = (req.query.format || 'json').toLowerCase();
    const data = await Submission.find({ user_id: req.user._id })
      .sort({ createdAt: -1 })
      .limit(10000)
      .select('-ip_hash -__v')
      .lean();

    return sendExport(res, data, format, 'agroinsight_my_entries');
  } catch (err) {
    console.error('GET /export/mine error:', err);
    return res.status(500).json({ success: false, error: 'Export failed' });
  }
});

module.exports = router;
