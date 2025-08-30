
import request from '@/utils/request'

// Get all exam definitions
export function getExams() {
  return request({
    url: '/exams',
    method: 'get'
  })
}

// Get a single exam definition
export function getExam(id) {
  return request({
    url: `/exams/${id}`,
    method: 'get'
  })
}

// Create a new exam definition
export function createExam(data) {
  return request({
    url: '/exams',
    method: 'post',
    data
  })
}

// Update an exam definition
export function updateExam(id, data) {
  return request({
    url: `/exams/${id}`,
    method: 'put',
    data
  })
}

// Delete an exam definition
export function deleteExam(id) {
  return request({
    url: `/exams/${id}`,
    method: 'delete'
  })
}
