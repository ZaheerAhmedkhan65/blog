const db = require('../config/db');

class Post {
    // Create a new post
    static async createPost(content, user_id, media_url, parent_post_id, is_draft, scheduled_at, published_at) {
        const [result] = await db.query(
            `
        INSERT INTO posts (
            content,
            user_id,
            media_url,
            parent_post_id,
            is_draft,
            scheduled_at,
            published_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
            [
                content,
                user_id,
                media_url,
                parent_post_id,
                is_draft,
                scheduled_at,
                published_at
            ]
        );

        const [post] = await db.query('SELECT * FROM posts WHERE id = ?', [result.insertId]);
        return post[0];
    }

    static async createPost(content, user_id, media_url, parent_post_id, is_draft, scheduled_at, published_at) {
        const [result] = await db.query(
            `
        INSERT INTO posts (
            content,
            user_id,
            media_url,
            parent_post_id,
            is_draft,
            scheduled_at,
            published_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
            [
                content,
                user_id,
                media_url,
                parent_post_id,
                is_draft,
                scheduled_at,
                published_at
            ]
        );

        const [post] = await db.query('SELECT * FROM posts WHERE id = ?', [result.insertId]);
        return post[0];
    }

    // Get post by ID
    static async getPostById(id) {
        const [post] = await db.query('SELECT * FROM posts WHERE id = ?', [id]);
        return post[0];
    }

    static async getPostDataById(id) {
        const [post] = await db.query(`
            SELECT p.*, u.name, u.avatar, u.email
            FROM posts p
            JOIN users u ON p.user_id = u.id
            WHERE p.id = ?
        `, [id]);
        return post[0];
    }

    // Get all posts
    static async getAllPosts() {
        const [posts] = await db.query('SELECT * FROM posts');
        return posts;
    }

    // Get all posts by a specific user
    static async getPostsByUser(userId) {
        const [posts] = await db.query(`
            SELECT p.*, u.name, u.avatar, u.email
            FROM posts p
            JOIN users u ON p.user_id = u.id
            WHERE p.user_id = ?
            ORDER BY p.created_at DESC
        `, [userId]);
        return posts;
    }

    static async getPostsCountByUser(userId) {
        const [count] = await db.query('SELECT COUNT(*) as count FROM posts WHERE user_id = ?', [userId]);
        return count[0].count;
    }

    // Update a post
    static async updatePost(id, content, user_id, media_url, parent_post_id, is_draft, scheduled_at, published_at) {
        await db.query(
            'UPDATE posts SET content = ?, user_id = ?, media_url = ?, parent_post_id = ?, is_draft = ?, scheduled_at = ?, published_at = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [content, user_id, media_url, parent_post_id, is_draft, scheduled_at, published_at, id]
        );
        const [updatedPost] = await db.query('SELECT * FROM posts WHERE id = ?', [id]);
        return updatedPost[0];
    }

    // Delete a post
    static async deletePost(id) {
        const [post] = await db.query('SELECT * FROM posts WHERE id = ?', [id]);
        await db.query('DELETE FROM posts WHERE id = ?', [id]);
        return post[0]; // Return deleted post data if needed
    }

    static async searchPost(query) {
        const [results] = await db.query('SELECT * FROM posts WHERE content LIKE ?', [`%${query}%`]);
        return results;
    }

    static async toggleLike(postId, userId, type) {
        // Check if user already reacted
        const [existing] = await db.query(
            'SELECT * FROM post_likes WHERE post_id = ? AND user_id = ?',
            [postId, userId]
        );

        if (existing && existing.length > 0) {
            const currentType = existing[0].type;
            if (currentType === type) {
                // Remove reaction if same type clicked again
                await db.query(
                    'DELETE FROM post_likes WHERE post_id = ? AND user_id = ?',
                    [postId, userId]
                );
                return { action: 'removed', type };
            } else {
                // Update reaction if different type
                await db.query(
                    'UPDATE post_likes SET type = ? WHERE post_id = ? AND user_id = ?',
                    [type, postId, userId]
                );
                return { action: 'updated', from: currentType, to: type };
            }
        } else {
            // Add new reaction
            await db.query(
                'INSERT INTO post_likes (post_id, user_id, type) VALUES (?, ?, ?)',
                [postId, userId, type]
            );
            return { action: 'added', type };
        }
    }

    static async getReactions(postId) {
        const [likes] = await db.query(
            'SELECT COUNT(*) as count FROM post_likes WHERE post_id = ? AND type = "like"',
            [postId]
        );
        const [dislikes] = await db.query(
            'SELECT COUNT(*) as count FROM post_likes WHERE post_id = ? AND type = "dislike"',
            [postId]
        );
        return {
            likes: likes[0].count,
            dislikes: dislikes[0].count
        };
    }

    static async getUserReaction(postId, userId) {
        const [reaction] = await db.query(
            'SELECT type FROM post_likes WHERE post_id = ? AND user_id = ?',
            [postId, userId]
        );
        return reaction.length > 0 ? reaction[0].type : null;
    }

    // Repost methods
    static async toggleRepost(postId, userId) {
        // Check if already reposted
        const [existing] = await db.query(
            'SELECT * FROM post_reposts WHERE post_id = ? AND user_id = ?',
            [postId, userId]
        );

        if (existing && existing.length > 0) {
            // Remove repost
            await db.query(
                'DELETE FROM post_reposts WHERE post_id = ? AND user_id = ?',
                [postId, userId]
            );
            return { action: 'removed' };
        } else {
            // Add repost
            await db.query(
                'INSERT INTO post_reposts (post_id, user_id) VALUES (?, ?)',
                [postId, userId]
            );
            return { action: 'added' };
        }
    }

    static async getRepostCount(postId) {
        const [result] = await db.query(
            'SELECT COUNT(*) as count FROM post_reposts WHERE post_id = ?',
            [postId]
        );
        return result[0].count;
    }

    static async hasReposted(postId, userId) {
        const [result] = await db.query(
            'SELECT 1 FROM post_reposts WHERE post_id = ? AND user_id = ?',
            [postId, userId]
        );
        return result.length > 0;
    }

    static async getTrendingPosts(limit = 10, timePeriod = '1 HOUR') {
        try {
            // Use a single query with conditional logic
            const query = `
                SELECT 
                    p.*,
                    COUNT(DISTINCT l.id) AS likes,
                    COUNT(DISTINCT dl.id) AS dislikes,
                    COUNT(DISTINCT r.id) AS reposts,
                    (COUNT(DISTINCT l.id) + (COUNT(DISTINCT r.id) * 2)) AS engagement_score,
                    CASE 
                        WHEN p.created_at >= NOW() - INTERVAL ${timePeriod} THEN FALSE
                        ELSE TRUE
                    END AS is_fallback
                FROM 
                    posts p
                LEFT JOIN 
                    post_likes l ON p.id = l.post_id AND l.type = 'like'
                LEFT JOIN 
                    post_likes dl ON p.id = dl.post_id AND dl.type = 'dislike'
                LEFT JOIN 
                    post_reposts r ON p.id = r.post_id
                WHERE 
                    p.created_at >= NOW() - INTERVAL ${timePeriod} OR
                    NOT EXISTS (
                        SELECT 1 FROM posts 
                        WHERE created_at >= NOW() - INTERVAL ${timePeriod}
                        LIMIT 1
                    )
                GROUP BY 
                    p.id
                ORDER BY 
                    is_fallback ASC,  -- Show non-fallback results first
                    engagement_score DESC
                LIMIT ${limit}
            `;

            const [posts] = await db.query(query);
            return posts;
        } catch (error) {
            console.error('Database error:', error);
            throw error;
        }
    }


}

module.exports = Post;
