const db = require('../config/db');

class Follower {
    static async createFollower(followerId, userId) {
        const [result] = await db.query(
            'INSERT INTO followers (follower_user_id, followed_user_id) VALUES (?, ?)',
            [followerId, userId]
        );
        const [follow] = await db.query('SELECT * FROM followers WHERE id = ?', [result.insertId]);
        return follow[0];
    }

    static async deleteFollower(followerId, followingId) {
        const [follow] = await db.query(
            'SELECT * FROM followers WHERE follower_user_id = ? AND followed_user_id = ?',
            [followerId, followingId]
        );
        await db.query(
            'DELETE FROM followers WHERE follower_user_id = ? AND followed_user_id = ?',
            [followerId, followingId]
        );
        return follow[0];
    }

    static async getFollowingsByUserId(userId) {
        const [followings] = await db.query(`
            SELECT 
                f.id as follow_id,
                f.follower_user_id,
                f.followed_user_id,
                f.created_at as followed_at,
                u.id as user_id,
                u.name,
                u.email,
                u.avatar,
                u.created_at as user_created_at
            FROM followers f
            JOIN users u ON f.followed_user_id = u.id
            WHERE f.follower_user_id = ?
            ORDER BY f.created_at DESC
        `, [userId]);
        return followings;
    }

    static async getFollowersByUserId(userId) {
        const [followers] = await db.query(`
            SELECT 
                f.id as follow_id,
                f.follower_user_id,
                f.followed_user_id,
                f.created_at as followed_at,
                u.id as user_id,
                u.name,
                u.email,
                u.avatar,
                u.created_at as user_created_at
            FROM followers f
            JOIN users u ON f.follower_user_id = u.id
            WHERE f.followed_user_id = ?
            ORDER BY f.created_at DESC
        `, [userId]);
        return followers;
    }

    static async getFollowingsCountByUserId(userId) {
        const [count] = await db.query(
            'SELECT COUNT(*) as count FROM followers WHERE follower_user_id = ?',
            [userId]
        );
        return count[0].count;
    }

    static async getFollowersCountByUserId(userId) {
        const [count] = await db.query(
            'SELECT COUNT(*) as count FROM followers WHERE followed_user_id = ?',
            [userId]
        );
        return count[0].count;
    }

    static async getFollowersByUserIdAndFollowerId(userId, followerId) {
        const [follows] = await db.query(
            'SELECT * FROM followers WHERE follower_user_id = ? AND followed_user_id = ?',
            [followerId, userId]
        );
        return follows;
    }

    // Check if a user is following another user
    static async isFollowing(followerId, followingId) {
        const [follows] = await db.query(
            'SELECT * FROM followers WHERE follower_user_id = ? AND followed_user_id = ?',
            [followerId, followingId]
        );
        return follows.length > 0;
    }

    // Get mutual followers count between two users
    static async getMutualFollowersCount(userId1, userId2) {
        const [result] = await db.query(`
            SELECT COUNT(*) as count FROM followers f1
            INNER JOIN followers f2 ON f1.follower_user_id = f2.follower_user_id
            WHERE f1.followed_user_id = ? AND f2.followed_user_id = ?
        `, [userId1, userId2]);
        return result[0].count;
    }
}

module.exports = Follower;