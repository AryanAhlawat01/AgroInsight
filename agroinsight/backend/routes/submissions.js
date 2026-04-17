// routes/submissions.js
const express  = require('express');
const router   = express.Router();
const Submission = require('../models/Submission');
const { auth, optionalAuth } = require('../middleware/auth');

// ─── GET /api/submissions  (paginated + searchable) ───────────────────────────
router.get('/', optionalAuth, async (req, res) => {
  try {
    const page   = Math.max(1, parseInt(req.query.page)  || 1);
    const limit  = Math.min(100, parseInt(req.query.limit) || 15);
    const skip   = (page - 1) * limit;
    const search = req.query.search?.trim();
    const state  = req.query.state;
    const region = req.query.region;

    const filter = {};
    if (search) {
      filter.$or = [
        { state:    { $regex: search, $options: 'i' } },
        { district: { $regex: search, $options: 'i' } },
        { kharif_crop: { $regex: search, $options: 'i' } },
        { rabi_crop:   { $regex: search, $options: 'i' } },
      ];
    }
    if (state)  filter.state  = state;
    if (region) filter.region = region;
    if (req.query.mine === 'true') {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
      }
      filter.submitted_by = req.user.id;
    }

    const query = Submission.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    if (filter.submitted_by) {
      query.populate('submitted_by', 'name email');
    }

    const [data, total] = await Promise.all([
      query.lean(),
      Submission.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error('GET /submissions:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ─── POST /api/submissions ────────────────────────────────────────────────────
router.post('/', auth, async (req, res) => {
    try {
      const {
        state, district, land_size, land_category,
        irrigation_src, well_depth, kharif_crop, rabi_crop,
        crop_intensity, soil_type, notes,
      } = req.body;

      if (!state?.trim() || !district?.trim()) {
        return res.status(400).json({ success: false, error: 'State and District are required' });
      }

      const submission = new Submission({
        state: state.trim(),
        district: district.trim(),
        land_size:  land_size  ? parseFloat(land_size)  : null,
        land_category: land_category || null,
        irrigation_src: irrigation_src || null,
        well_depth: well_depth ? parseFloat(well_depth) : null,
        kharif_crop: kharif_crop?.trim() || null,
        rabi_crop:   rabi_crop?.trim()   || null,
        crop_intensity: crop_intensity || null,
        soil_type:  soil_type  || null,
        notes:      notes?.trim()        || null,
        submitted_by: req.user?.id || null,
      });

      const saved = await submission.save();
      const io = req.app.get('io');
      if (io) {
        io.emit('newSubmission', { type: 'submission', payload: saved });
      }
    res.status(201).json({ success: true, data: saved });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message).join(', ');
      return res.status(400).json({ success: false, error: messages });
    }
    console.error('POST /submissions:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ─── GET /api/submissions/:id ─────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const doc = await Submission.findById(req.params.id).lean();
    if (!doc) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: doc });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ─── DELETE /api/submissions/:id ──────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const doc = await Submission.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;
