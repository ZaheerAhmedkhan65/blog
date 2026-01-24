const db = require('../config/db'); // adjust this based on your database file

class PostLike {
  static async findAll({ where }) {
    let query = 'SELECT * FROM post_likes WHERE 1=1';
    const params = [];

    if (where.post_id) {
      query += ` AND post_id IN (${where.post_id.map(() => '?').join(', ')})`;
      params.push(...where.post_id);
    }

    if (where.user_id) {
      query += ' AND user_id = ?';
      params.push(where.user_id);
    }

    const [rows] = await db.execute(query, params);
    return rows;
  }
}

module.exports = PostLike;
