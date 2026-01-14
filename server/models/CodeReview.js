const mongoose = require('mongoose');

const CodeReviewSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true
  },
  language: {
    type: String,
    default: 'javascript'
  },
  fileName: {
    type: String,
    default: 'unknown'
  },
  review: {
    summary: String,
    issues: [{
      category: String,
      severity: String,
      priority: String,
      line: Number,
      code: String,
      issue: String,
      whyDangerous: String,
      impact: String,
      fix: String,
      benefit: String
    }],
    recommendations: [{
      title: String,
      description: String,
      priority: String,
      effort: String
    }],
    codeSummary: String,
    pmSummary: {
      topRisks: [{
        risk: String,
        impact: String,
        description: String
      }],
      deployRecommendation: String,
      technicalDebt: String,
      timeline: String
    }
  },
  rawResponse: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('CodeReview', CodeReviewSchema);
