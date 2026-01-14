import React, { useEffect } from 'react';
import './ReviewDetailModal.css';
import ReviewResult from './ReviewResult';

const ReviewDetailModal = ({ open, reviewItem, onClose }) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open || !reviewItem) return null;

  const { fileName, language, createdAt, review } = reviewItem;

  const reviewForRender = (review && typeof review === 'object') ? review : null;

  return (
    <div className="rdm-overlay" onClick={onClose}>
      <div className="rdm-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <header className="rdm-header">
          <div>
            <h3>{fileName || 'Untitled'}</h3>
            <div className="rdm-meta">
              <span className="rdm-language">{language || 'unknown'}</span>
              <span className="rdm-date">{new Date(createdAt).toLocaleString('vi-VN')}</span>
            </div>
          </div>
          <button className="rdm-close" onClick={onClose} aria-label="Close">✕</button>
        </header>

        <div className="rdm-body">
          {reviewForRender ? (
            <ReviewResult review={reviewForRender} />
          ) : (
            <section>
              <h4>Chi tiết review</h4>
              <pre className="rdm-pre">{String(review ?? '')}</pre>
            </section>
          )}
        </div>

        <footer className="rdm-footer">
          <button className="rdm-close-btn" onClick={onClose}>Đóng</button>
        </footer>
      </div>
    </div>
  );
};

export default ReviewDetailModal;
