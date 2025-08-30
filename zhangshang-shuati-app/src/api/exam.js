
import request from '@/utils/request'

// Get list of all available exams
export function getExams() {
  return request.get('/exams');
}

// Start an exam attempt
export function startExam(examId) {
  return request.post(`/exams/${examId}/start`);
}

// Submit answers for an attempt
export function submitExam(attemptId, answers) {
  return request.post(`/attempts/${attemptId}/submit`, { answers });
}

// Get the results of a completed attempt
export function getExamResult(attemptId) {
  return request.get(`/attempts/${attemptId}/result`);
}
