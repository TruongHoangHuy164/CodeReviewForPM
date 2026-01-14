import React, { useState } from 'react';
import './App.css';
import CodeInput from './components/CodeInput';
import ReviewResult from './components/ReviewResult';
import HistoryPanel from './components/HistoryPanel';

function App() {
  const [reviewData, setReviewData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showHistory, setShowHistory] = useState(false);

  const handleReview = async (code, language, fileName) => {
    setLoading(true);
    setError(null);
    setReviewData(null);

    try {
      const response = await fetch('http://localhost:5000/api/review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, language, fileName }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.details || data.error || 'Lỗi khi review code';
        console.error('API Error:', data);
        throw new Error(errorMsg);
      }

      setReviewData(data);
    } catch (err) {
      console.error('Review error:', err);
      setError(err.message || 'Có lỗi xảy ra khi review code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>🔍 Code Review AI</h1>
        <p>Review code chuyên nghiệp cho Middle Developer</p>
        <button 
          className="history-btn"
          onClick={() => setShowHistory(!showHistory)}
        >
          {showHistory ? 'Ẩn' : 'Hiện'} Lịch sử
        </button>
      </header>

      {showHistory && (
        <HistoryPanel onSelectReview={(review) => setReviewData({ review })} />
      )}

      <main className="App-main">
        <CodeInput onReview={handleReview} loading={loading} />
        
        {error && (
          <div className="error-message">
            <strong>❌ Lỗi:</strong> {error}
          </div>
        )}

        {loading && (
          <div className="loading">
            <div className="spinner"></div>
            <p>Đang phân tích code...</p>
          </div>
        )}

        {reviewData && !loading && (
          <ReviewResult review={reviewData.review} />
        )}
      </main>
    </div>
  );
}

export default App;
