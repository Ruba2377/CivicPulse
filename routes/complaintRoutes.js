// routes/complaintRoutes.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const { auth } = require('../middleware/authMiddleware');
const Complaint = require('../models/Complaints.js');

const router = express.Router();

// Multer setup: store in uploads/
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + '-' + Math.round(Math.random()*1E9);
    cb(null, unique + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Create complaint
router.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    const { title, description, category, authority, lat, lng } = req.body;
    if (!title || !category || !authority) {
      return res.status(400).json({ message: 'title, category and authority are required' });
    }

    const complaint = new Complaint({
      title,
      description,
      category,
      authority,
      imageUrl: req.file ? `/uploads/${req.file.filename}` : undefined,
      location: {
        type: 'Point',
        coordinates: [parseFloat(lng) || 0, parseFloat(lat) || 0]
      },
      createdBy: req.user._id
    });

    await complaint.save();
    res.status(201).json({ message: 'Complaint submitted', complaint });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get complaints (citizen sees own or all depending query)
router.get('/', auth, async (req, res) => {
  try {
    const { mine, status, category } = req.query;
    const filter = {};
    if (mine === 'true') filter.createdBy = req.user._id;
    if (status) filter.status = status;
    if (category) filter.category = category;

    const complaints = await Complaint.find(filter).populate('createdBy','name email').sort({ createdAt: -1 });
    res.json(complaints);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single complaint
router.get('/:id', auth, async (req, res) => {
  try {
    const c = await Complaint.findById(req.params.id).populate('createdBy','name email');
    if (!c) return res.status(404).json({ message: 'Complaint not found' });
    res.json(c);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
