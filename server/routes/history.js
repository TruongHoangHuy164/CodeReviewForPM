const express = require('express');
const router = express.Router();
const CodeReview = require('../models/CodeReview');

// GET /api/history - Lấy lịch sử review
router.get('/', async (req, res) => {
  try {
    const reviews = await CodeReview.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .select('fileName language review.summary createdAt')
      .lean();

    res.json({ success: true, reviews });
  } catch (error) {
    console.error('History error:', error);
    res.status(500).json({ error: 'Lỗi khi lấy lịch sử' });
  }
});

// GET /api/history/:id - Lấy chi tiết một review
router.get('/:id', async (req, res) => {
  try {
    const review = await CodeReview.findById(req.params.id);
    
    if (!review) {
      return res.status(404).json({ error: 'Không tìm thấy review' });
    }

    res.json({ success: true, review });
  } catch (error) {
    console.error('Get review error:', error);
    res.status(500).json({ error: 'Lỗi khi lấy review' });
  }
});

// DELETE /api/history/:id - Xóa một review
router.delete('/:id', async (req, res) => {
  try {
    await CodeReview.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Đã xóa review' });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ error: 'Lỗi khi xóa review' });
  }
});

module.exports = router;
