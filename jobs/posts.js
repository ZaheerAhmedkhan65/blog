const cron = require('node-cron');
const db = require('../config/db');

// Run every minute
cron.schedule('* * * * *', async () => {
  try {
    const now = new Date();

    const [posts] = await db.query(`
      SELECT id FROM posts
      WHERE is_draft = FALSE
        AND scheduled_at <= ?
        AND published_at IS NULL
    `, [now]);

    for (const post of posts) {
      await db.query(`
        UPDATE posts
        SET published_at = ?
        WHERE id = ?
      `, [now, post.id]);
    }
  } catch (err) {
    console.error('Scheduled publishing failed:', err);
  }
});