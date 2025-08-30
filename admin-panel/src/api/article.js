
import { articlesAPI, categoriesAPI } from '../../../shared/api'

// --- Article Categories ---

export function getArticleCategories() {
  return categoriesAPI.list();
}

export function createArticleCategory(data) {
  return categoriesAPI.create(data);
}

export function updateArticleCategory(id, data) {
  return categoriesAPI.update(id, data);
}

export function deleteArticleCategory(id) {
  return categoriesAPI.delete(id);
}

// --- Articles ---

export function getArticles(params) {
  return articlesAPI.list(params);
}

export function getArticle(id) {
  return articlesAPI.getById(id);
}

export function createArticle(data) {
  return articlesAPI.create(data);
}

export function updateArticle(id, data) {
  return articlesAPI.update(id, data);
}

export function deleteArticle(id) {
  return articlesAPI.delete(id);
}
