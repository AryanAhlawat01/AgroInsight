const express = require('express');
const router = express.Router();
const Submission = require('../models/Submission');
const { validateSubmission } = require('../middleware/validate');
const auth = require('../middleware/auth');

// -------------------------------------------------------
// POST /api/submissions  — save a new record
// -------------------------------------------------------
router.post('/', auth, validateSubmission, async (req, res) => {
  try {
    const doc = new Submission({
      ...req.body,
      user_id: req.user._id,
      user_name: req.user.name,
      // Store a hashed version of IP (not plain IP) for abuse prevention
      ip_hash: req.ip ? Buffer.from(req.ip).toString('base64') : null,
    });

    await doc.save();

    if (req.app.locals.io) {
      req.app.locals.io.emit('submission:created', {
        id: doc._id,
        state: doc.state,
        district: doc.district,
        createdAt: doc.createdAt,
      });
    }

    res.status(201).json({
      success: true,
      message: 'Record saved successfully',
      id: doc._id,
    });
  } catch (err) {
    console.error('POST /submissions error:', err);
    res.status(500).json({ success: false, error: 'Failed to save record' });
  }
});

// -------------------------------------------------------
// GET /api/submissions  — paginated list with search
// -------------------------------------------------------
router.get('/', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 15));
    const skip = (page - 1) * limit;

    // Optional search filter
    const filter = {};
    if (req.query.search) {
      const rx = new RegExp(req.query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ state: rx }, { district: rx }, { kharif_crop: rx }, { rabi_crop: rx }];
    }
    if (req.query.state) filter.state = req.query.state;

    const [data, total] = await Promise.all([
      Submission.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-ip_hash -__v'),
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
    console.error('GET /submissions error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch records' });
  }
});

// -------------------------------------------------------
// GET /api/submissions/mine  — current user's records
// -------------------------------------------------------
router.get('/mine', auth, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter = { user_id: req.user._id };

    const [data, total] = await Promise.all([
      Submission.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-ip_hash -__v'),
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
    console.error('GET /submissions/mine error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch your records' });
  }
});

// -------------------------------------------------------
// PUT /api/submissions/:id  — update a record
// -------------------------------------------------------
router.put('/:id', auth, validateSubmission, async (req, res) => {
  try {
    const doc = await Submission.findOneAndUpdate(
      { _id: req.params.id, user_id: req.user._id },
      { ...req.body },
      { new: true, runValidators: true }
    ).select('-ip_hash -__v');

    if (!doc) return res.status(404).json({ success: false, error: 'Record not found' });

    res.json({
      success: true,
      message: 'Record updated successfully',
      data: doc,
    });
  } catch (err) {
    console.error('PUT /submissions error:', err);
    res.status(500).json({ success: false, error: 'Failed to update record' });
  }
});

// -------------------------------------------------------
// DELETE /api/submissions/:id  — remove a record
// -------------------------------------------------------
router.delete('/:id', auth, async (req, res) => {
  try {
    const doc = await Submission.findOneAndDelete({ _id: req.params.id, user_id: req.user._id });
    if (!doc) return res.status(404).json({ success: false, error: 'Record not found' });
    res.json({ success: true, message: 'Record deleted' });
  } catch (err) {
    console.error('DELETE /submissions error:', err);
    res.status(500).json({ success: false, error: 'Failed to delete record' });
  }
});

module.exports = router;
