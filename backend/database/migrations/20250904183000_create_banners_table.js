const knex = require('knex');

/**
 * @param {knex} knex
 */
exports.up = function(knex) {
  return knex.schema.createTable('banners', function(table) {
    table.increments('id').primary();
    table.string('title', 255).notNullable();
    table.string('image_url', 2048).notNullable();
    table.string('link_url', 2048).nullable();
    table.integer('sort_order').defaultTo(0);
    table.boolean('is_visible').defaultTo(true);
    table.timestamps(true, true);
  });
};

/**
 * @param {knex} knex
 */
exports.down = function(knex) {
  return knex.schema.dropTable('banners');
};
