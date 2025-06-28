exports.up = async function(knex) {
  await knex.schema.table('recipes', (table) => {
    table.string('image_filename').nullable();
  });
};

exports.down = async function(knex) {
  await knex.schema.table('recipes', (table) => {
    table.dropColumn('image_filename');
  });
};
