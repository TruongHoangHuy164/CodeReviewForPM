import React, { useState, useEffect } from 'react';
import './HistoryPanel.css';
import ReviewDetailModal from './ReviewDetailModal';

const HistoryPanel = ({ onSelectReview }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedReview, setSelectedReview] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/history');
      const data = await response.json();
      setReviews(data.reviews || []);
    } catch (err) {
      setError('Không thể tải lịch sử');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc muốn xóa review này?')) {
      try {
        await fetch(`http://localhost:5000/api/history/${id}`, {
          method: 'DELETE'
        });
        fetchHistory();
      } catch (err) {
        alert('Lỗi khi xóa review');
      }
    }
  };

  const handleViewDetail = async (id) => {
    try {
      const response = await fetch(`http://localhost:5000/api/history/${id}`);
      const data = await response.json();
      if (data.success && data.review) {
        // Keep compatibility with parent callback
        onSelectReview && onSelectReview({ review: data.review.review });
        // Show modal locally
        setSelectedReview({
          fileName: data.review.fileName,
          language: data.review.language,
          createdAt: data.review.createdAt,
          review: data.review.review
        });
        setModalOpen(true);
      }
    } catch (err) {
      alert('Lỗi khi tải chi tiết review');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN');
  };

  return (
    <div className="history-panel">
      <div className="history-header">
        <h3>📚 Lịch sử Review</h3>
        <button onClick={fetchHistory} className="refresh-btn">
          🔄 Làm mới
        </button>
      </div>

      {loading && <div className="loading">Đang tải...</div>}
      {error && <div className="error">{error}</div>}

      {!loading && !error && (
        <div className="history-list">
          {reviews.length === 0 ? (
            <div className="no-history">Chưa có lịch sử review nào</div>
          ) : (
            reviews.map((review) => (
              <div key={review._id} className="history-item">
                <div className="history-info">
                  <h4>{review.fileName || 'Unknown'}</h4>
                  <span className="language-badge">{review.language}</span>
                  <span className="date">{formatDate(review.createdAt)}</span>
                </div>
                <p className="summary">{review.review?.summary?.substring(0, 100) || 'Không có tóm tắt'}...</p>
                <div className="history-actions">
                  <button
                    onClick={() => handleViewDetail(review._id)}
                    className="view-btn"
                  >
                    👁️ Xem
                  </button>
                  <button
                    onClick={() => handleDelete(review._id)}
                    className="delete-btn"
                  >
                    🗑️ Xóa
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <ReviewDetailModal
        open={modalOpen}
        reviewItem={selectedReview}
        onClose={() => { setModalOpen(false); setSelectedReview(null); }}
      />
    </div>
  );
};

export default HistoryPanel;
