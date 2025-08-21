// routes/adminRoutes.js
const express = require('express');
const { auth, adminOnly } = require('../middleware/authMiddleware');
const Complaint = require('../models/Complaint.js'); // ✅ lowercase to match filename

const router = express.Router();
// ✅ Add this test route
router.get('/test', (req, res) => {
  res.json({ route: 'admin', status: 'ok' });
});



/**
 * @route   GET /admin/complaints
 * @desc    Get all complaints (admin only)
 */
router.get('/complaints', auth, adminOnly, async (req, res) => {
  try {
    const complaints = await Complaint.find()
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(complaints);
  } catch (err) {
    console.error('Error fetching complaints:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   PATCH /admin/complaints/:id/status
 * @desc    Update complaint status
 */
router.patch('/complaints/:id/status', auth, adminOnly, async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['pending', 'in-progress', 'resolved'];

    if (!status || !allowed.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const updatedComplaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      { status, updatedAt: Date.now() },
      { new: true }
    );

    if (!updatedComplaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    res.json({ message: 'Status updated', complaint: updatedComplaint });
  } catch (err) {
    console.error('Error updating status:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   PATCH /admin/complaints/:id/assign
 * @desc    Assign complaint to department/official
 */
router.patch('/complaints/:id/assign', auth, adminOnly, async (req, res) => {
  try {
    const { assignedTo } = req.body;

    if (!assignedTo) {
      return res.status(400).json({ message: 'AssignedTo field is required' });
    }

    const updatedComplaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      { assignedTo, updatedAt: Date.now() },
      { new: true }
    );

    if (!updatedComplaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    res.json({ message: 'Assigned successfully', complaint: updatedComplaint });
  } catch (err) {
    console.error('Error assigning complaint:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /admin/analytics
 * @desc    Basic complaint analytics
 */
router.get('/analytics', auth, adminOnly, async (req, res) => {
  try {
    const total = await Complaint.countDocuments();

    const byStatus = await Complaint.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const byCategory = await Complaint.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    res.json({ total, byStatus, byCategory });
  } catch (err) {
    console.error('Error fetching analytics:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
