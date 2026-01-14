import React, { useState } from 'react';
import './ReviewResult.css';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

const ReviewResult = ({ review }) => {
  const [expandedCategories, setExpandedCategories] = useState({});

  if (!review) {
    return <div className="no-review">Chưa có kết quả review</div>;
  }

  const toggleCategory = (category) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return '#ff4444';
      case 'high':
        return '#ff8800';
      case 'medium':
        return '#ffbb00';
      case 'low':
        return '#00aaff';
      default:
        return '#666';
    }
  };

  const getCategoryIcon = (category) => {
    const icons = {
      Security: '🔒',
      Performance: '⚡',
      Scalability: '📈',
      'Data Integrity': '💾',
      'Business Logic': '🧠',
      Architecture: '🏗️',
      Testability: '✅',
      Observability: '👁️',
    };
    return icons[category] || '📝';
  };

  const issues = review.issues || [];
  const groupedIssues = issues.reduce((acc, issue) => {
    const category = issue.category || 'General';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(issue);
    return acc;
  }, {});

  // Format text với xuống hàng và icon
  const formatText = (text) => {
    if (!text) return '';
    // Thay thế \n thành xuống hàng thực sự
    const lines = text.split('\\n').map((line, index) => (
      <React.Fragment key={index}>
        {line}
        {index < text.split('\\n').length - 1 && <br />}
      </React.Fragment>
    ));
    return lines;
  };

  return (
    <div className="review-result">
      <div className="review-summary-card">
        <h2>📋 Tóm tắt Review</h2>
        <div className="summary-text">{formatText(review.summary || review.codeSummary || 'Không có tóm tắt')}</div>
      </div>

      {review.codeSummary && review.codeSummary !== review.summary && (
        <div className="code-summary-card">
          <h3>📝 Tóm tắt Code</h3>
          <div className="code-summary-content">{formatText(review.codeSummary)}</div>
        </div>
      )}

      {/* Chỉ hiển thị phần issues nếu có vấn đề thực sự */}
      {Object.keys(groupedIssues).length > 0 ? (
        <div className="issues-section">
          <h2>🔍 Chi tiết các vấn đề</h2>
          {Object.entries(groupedIssues).map(([category, categoryIssues]) => (
            <div key={category} className="category-section">
              <div
                className="category-header"
                onClick={() => toggleCategory(category)}
              >
                <span className="category-title">
                  {getCategoryIcon(category)} {category}
                  <span className="issue-count">({categoryIssues.length})</span>
                </span>
                <span className="toggle-icon">
                  {expandedCategories[category] ? '▼' : '▶'}
                </span>
              </div>

              {expandedCategories[category] && (
                <div className="issues-list">
                  {categoryIssues.map((issue, index) => (
                    <div key={index} className="issue-card">
                      <div className="issue-header">
                        <span
                          className="severity-badge"
                          style={{ backgroundColor: getSeverityColor(issue.severity) }}
                        >
                          {issue.severity || 'Medium'}
                        </span>
                        {issue.line && (
                          <span className="line-number">Dòng {issue.line}</span>
                        )}
                      </div>

                      {issue.code && issue.line && (
                        <div className="issue-code">
                          <div className="code-label">📄 Code tại dòng {issue.line}:</div>
                          <SyntaxHighlighter
                            language="javascript"
                            style={vscDarkPlus}
                            customStyle={{ borderRadius: '6px', padding: '10px', marginTop: '8px' }}
                          >
                            {issue.code}
                          </SyntaxHighlighter>
                        </div>
                      )}

                      <div className="issue-content">
                        <div className="issue-item">
                          <strong>⚠️ Vấn đề:</strong>
                          <p>{issue.issue}</p>
                        </div>

                        {issue.whyDangerous && (
                          <div className="issue-item danger">
                            <strong>🛑 Tại sao nguy hiểm:</strong>
                            <p>{issue.whyDangerous}</p>
                          </div>
                        )}

                        {issue.impact && (
                          <div className="issue-item">
                            <strong>💥 Hậu quả:</strong>
                            <p>{issue.impact}</p>
                          </div>
                        )}

                        {issue.fix && (
                          <div className="issue-item fix">
                            <strong>✅ Cách khắc phục:</strong>
                            <pre>{issue.fix}</pre>
                          </div>
                        )}

                        {issue.benefit && (
                          <div className="issue-item benefit">
                            <strong>💡 Lợi ích khi sửa:</strong>
                            <p>{issue.benefit}</p>
                          </div>
                        )}

                        {issue.priority && (
                          <div className="priority-badge">
                            <span className={`priority-${issue.priority.toLowerCase().replace(' ', '-')}`}>
                              {issue.priority === 'Quick Win' && '⚡ Quick Win'}
                              {issue.priority === 'Short Term' && '📅 Short Term'}
                              {issue.priority === 'Long Term' && '🗓️ Long Term'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="no-issues-section">
          <div className="no-issues">
            <div className="success-icon">✅</div>
            <h3>Không phát hiện vấn đề nào!</h3>
            <p>Code của bạn trông tốt và không có vấn đề nghiêm trọng.</p>
          </div>
        </div>
      )}

      {review.recommendations && review.recommendations.length > 0 && (
        <div className="recommendations-section">
          <h2>💡 Đề xuất cải thiện</h2>
          <div className="recommendations-list">
            {review.recommendations.map((rec, index) => (
              <div key={index} className="recommendation-item">
                <h4>{typeof rec === 'string' ? rec : rec.title || `Đề xuất ${index + 1}`}</h4>
                {typeof rec === 'object' && rec.description && (
                  <p>{rec.description}</p>
                )}
                <div className="recommendation-meta">
                  {typeof rec === 'object' && rec.priority && (
                    <span className="recommendation-priority">{rec.priority}</span>
                  )}
                  {typeof rec === 'object' && rec.effort && (
                    <span className="recommendation-effort">⏱️ {rec.effort}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {review.pmSummary && (
        <div className="pm-summary-section">
          <h2>📊 Tổng kết cho Project Manager</h2>
          
          {review.pmSummary.topRisks && review.pmSummary.topRisks.length > 0 && (
            <div className="top-risks">
              <h3>🛑 Top Rủi Ro Lớn Nhất</h3>
              {review.pmSummary.topRisks.map((risk, index) => (
                <div key={index} className="risk-item">
                  <div className="risk-header">
                    <span className="risk-number">{index + 1}</span>
                    <span className={`risk-impact risk-${risk.impact?.toLowerCase()}`}>
                      {risk.impact || 'Medium'}
                    </span>
                  </div>
                  <h4>{risk.risk}</h4>
                  <p>{risk.description}</p>
                </div>
              ))}
            </div>
          )}

          {review.pmSummary.deployRecommendation && (
            <div className="deploy-recommendation">
              <h3>🚀 Khuyến nghị Deploy</h3>
              <div className="recommendation-content">{formatText(review.pmSummary.deployRecommendation)}</div>
            </div>
          )}

          {review.pmSummary.technicalDebt && (
            <div className="technical-debt">
              <h3>💳 Technical Debt</h3>
              <div className="debt-content">{formatText(review.pmSummary.technicalDebt)}</div>
            </div>
          )}

          {review.pmSummary.timeline && (
            <div className="timeline">
              <h3>⏰ Timeline Ước Tính</h3>
              <div className="timeline-content">{formatText(review.pmSummary.timeline)}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReviewResult;
