// routes/adminRoutes.js
const express = require('express');
const { auth, adminOnly } = require('../middleware/authMiddleware');
const Complaint = require('../models/Complaint');

const router = express.Router();

// Get all complaints (admin)
router.get('/complaints', auth, adminOnly, async (req, res) => {
  try {
    const complaints = await Complaint.find().populate('createdBy','name email').sort({ createdAt: -1 });
    res.json(complaints);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update status
router.patch('/complaints/:id/status', auth, adminOnly, async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['pending','in-progress','resolved'];
    if (!allowed.includes(status)) return res.status(400).json({ message: 'Invalid status' });

    const comp = await Complaint.findByIdAndUpdate(req.params.id, { status, updatedAt: Date.now() }, { new: true });
    if (!comp) return res.status(404).json({ message: 'Complaint not found' });
    res.json({ message: 'Status updated', complaint: comp });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Assign to department/official
router.patch('/complaints/:id/assign', auth, adminOnly, async (req, res) => {
  try {
    const { assignedTo } = req.body;
    const comp = await Complaint.findByIdAndUpdate(req.params.id, { assignedTo, updatedAt: Date.now() }, { new: true });
    if (!comp) return res.status(404).json({ message: 'Complaint not found' });
    res.json({ message: 'Assigned', complaint: comp });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Basic analytics route
router.get('/analytics', auth, adminOnly, async (req, res) => {
  try {
    const total = await Complaint.countDocuments();
    const byStatus = await Complaint.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);
    const byCategory = await Complaint.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } }
    ]);
    res.json({ total, byStatus, byCategory });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

