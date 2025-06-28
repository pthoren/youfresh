exports.up = async function(knex) {
  // Create users table
  await knex.schema.createTable('users', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('email').notNullable().unique();
    table.string('name').notNullable();
    table.string('image').nullable();
    table.string('provider').notNullable();
    table.string('provider_id').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    table.unique(['provider', 'provider_id']);
  });

  // Create recipes table
  await knex.schema.createTable('recipes', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('name').notNullable();
    table.text('raw_ingredients').notNullable();
    table.json('parsed_ingredients').nullable();
    table.string('primary_protein').nullable();
    table.string('primary_carbohydrate').nullable();
    table.string('primary_vegetable').nullable();
    table.timestamp('last_ordered_at').nullable();
    table.integer('total_orders').defaultTo(0);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  // Create meal_plans table
  await knex.schema.createTable('meal_plans', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('name').notNullable();
    table.json('recipe_ids').notNullable();
    table.json('grocery_list').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('meal_plans');
  await knex.schema.dropTableIfExists('recipes');
  await knex.schema.dropTableIfExists('users');
};
