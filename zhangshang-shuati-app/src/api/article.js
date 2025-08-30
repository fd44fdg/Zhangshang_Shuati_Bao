
import { articlesAPI, categoriesAPI } from '../../../shared/api'

// Get list of all article categories
export function getArticleCategories() {
  return categoriesAPI.list();
}

// Get list of articles with pagination
export function getArticles(params) {
  return articlesAPI.list(params);
}

// Get a single article by its ID
export function getArticle(id) {
  return articlesAPI.getById(id);
}
