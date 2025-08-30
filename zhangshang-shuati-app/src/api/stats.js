
import request from '@/utils/request'

// Get user's statistics summary
export function getStatsSummary() {
  return request.get('/stats/summary');
}

// Get user's knowledge progress
export function getKnowledgeProgress() {
  return request.get('/stats/knowledge-progress');
}

// Get user's recent mistakes
export function getRecentMistakes() {
  return request.get('/stats/recent-mistakes');
}
