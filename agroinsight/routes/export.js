// routes/export.js
const express        = require('express');
const router         = express.Router();
const { optionalAuth } = require('../middleware/auth');
const Submission     = require('../models/Submission');

// ─── GET /api/export?format=csv|json&state=...&region=...&mine=true ──────
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { format = 'csv', state, region, mine } = req.query;

    const filter = {};
    if (state)  filter.state  = state;
    if (region) filter.region = region;
    if (mine === 'true') {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
      }
      filter.submitted_by = req.user.id;
    }

    const docs = await Submission.find(filter).sort({ createdAt: -1 }).lean();

    if (format === 'json') {
      res.setHeader('Content-Disposition', 'attachment; filename="agroinsight_export.json"');
      res.setHeader('Content-Type', 'application/json');
      return res.json({ exported: docs.length, data: docs });
    }

    // Default: CSV
    const fields = [
      'state', 'district', 'region', 'land_size', 'land_category',
      'irrigation_src', 'well_depth', 'kharif_crop', 'rabi_crop',
      'crop_intensity', 'soil_type', 'notes', 'submitted_by', 'createdAt',
    ];

    const csvRows = [
      fields.join(','),
      ...docs.map(d =>
        fields.map(f => {
          const v = d[f] ?? '';
          const s = String(v).replace(/"/g, '""');
          return s.includes(',') || s.includes('\n') ? `"${s}"` : s;
        }).join(',')
      ),
    ];

    res.setHeader('Content-Disposition', 'attachment; filename="agroinsight_export.csv"');
    res.setHeader('Content-Type', 'text/csv');
    res.send(csvRows.join('\n'));
  } catch (err) {
    console.error('GET /export:', err);
    res.status(500).json({ success: false, error: 'Export failed' });
  }
});

module.exports = router;
