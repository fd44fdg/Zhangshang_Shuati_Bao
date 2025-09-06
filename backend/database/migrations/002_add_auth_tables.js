/**
 * 添加认证相关缺失表：refresh_tokens 与 audit_logs
 * 解决 login-v2 插入 refresh_tokens 时 500 (表不存在) 的问题
 */

exports.up = async function(knex) {
  const hasRefresh = await knex.schema.hasTable('refresh_tokens');
  if (!hasRefresh) {
    await knex.schema.createTable('refresh_tokens', table => {
      table.increments('id').primary();
      table.integer('user_id').unsigned().notNullable();
      table.string('token_hash', 64).notNullable().index(); // sha256
      table.timestamp('expires_at').notNullable();
      table.boolean('revoked').defaultTo(false).index();
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.index(['user_id', 'revoked']);
    });
  }

  const hasAudit = await knex.schema.hasTable('audit_logs');
  if (!hasAudit) {
    await knex.schema.createTable('audit_logs', table => {
      table.increments('id').primary();
      table.integer('actor_id').unsigned();
      table.string('action', 50).notNullable();
      table.string('resource_type', 50);
      table.integer('resource_id').unsigned();
      table.text('before_json');
      table.text('after_json');
      table.string('ip', 64);
      table.string('ua', 255);
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.foreign('actor_id').references('id').inTable('users').onDelete('SET NULL');
      table.index(['actor_id']);
      table.index(['action']);
      table.index(['resource_type']);
      table.index(['created_at']);
    });
  }
};

exports.down = async function(knex) {
  const hasAudit = await knex.schema.hasTable('audit_logs');
  if (hasAudit) await knex.schema.dropTable('audit_logs');
  const hasRefresh = await knex.schema.hasTable('refresh_tokens');
  if (hasRefresh) await knex.schema.dropTable('refresh_tokens');
};
