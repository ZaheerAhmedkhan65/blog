const db = require('../config/db');

class User {
    static async createUser(name, email, passwordDigest) {
        const [result] = await db.query(
            'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
            [name, email, passwordDigest]
        );
        const [user] = await db.query('SELECT * FROM users WHERE id = ?', [result.insertId]);
        return user[0];
    }

    static async getUserById(id) {
        const [user] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
        return user[0];
    }

    static async getAllUsers() {
        const [users] = await db.query('SELECT * FROM users');
        return users;
    }

    static async findAll({ where }) {
        let query = 'SELECT * FROM users WHERE id IN (' + where.id.map(() => '?').join(', ') + ')';
        const [rows] = await db.execute(query, where.id);
        return rows;
      }

    static async findUser(username){
        const [user] = await db.query('SELECT * FROM users WHERE name = ? OR email = ?', [username,username]);
        return user[0];
    }

    static async findById(id){
        const [user] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
        return user[0];
    }

    static async getUserPosts(userId) {
        const [posts] = await db.query('SELECT * FROM posts WHERE user_id = ?', [userId]);
        return posts;
    }

    static async findByEmail(email) {
        const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        return rows[0];
    }

    static async findByResetToken(token) {
        const [rows] = await db.query(
            'SELECT * FROM users WHERE resetToken = ? AND resetTokenExpiry > NOW()',
            [token]
        );
        return rows[0];
    }

    static async updateUserPassword(id, updates) {
        const { resetToken, resetTokenExpiry, password } = updates;
        
        const [result] = await db.query(
            'UPDATE users SET resetToken = ?, resetTokenExpiry = ?, password = ? WHERE id = ?',
            [resetToken, resetTokenExpiry, password, id]
        );
        return result;
    }

    static async updateUser(id, updates) {
        const { resetToken, resetTokenExpiry } = updates;
        
        const [result] = await db.query(
            'UPDATE users SET resetToken = ?, resetTokenExpiry = ? WHERE id = ?',
            [resetToken, resetTokenExpiry, id]
        );
        return result;
    }

    static async findByUsername(name) {
        const [rows] = await db.query('SELECT * FROM users WHERE name = ?', [name]);
        return rows[0];
    }

    static async updateAvatar(id, avatar, avatar_public_id) {
        const [result] = await db.query(
            'UPDATE users SET avatar = ?, avatar_public_id = ? WHERE id = ?',
            [avatar, avatar_public_id, id]
        );
        return result;
    }

    static async getSuggestedUsers(currentUserId) {
        // First get users that current user already follows
        const [following] = await db.query(
            'SELECT followed_user_id FROM followers WHERE follower_user_id = ?',
            [currentUserId]
        );
        const followingIds = following.map(f => f.followed_user_id);
        
        // Add current user to excluded IDs
        const excludedIds = [...followingIds, currentUserId];
        
        // Handle empty array case for NOT IN clause
        const exclusionClause = excludedIds.length > 0 
            ? 'u.id NOT IN (?)' 
            : '1=1'; // Always true if no exclusions
        
        // Get suggested users with multiple ranking factors
        const query = `
            SELECT 
                u.*,
                COUNT(DISTINCT p.id) * 0.5 AS post_score,
                COUNT(DISTINCT f.follower_user_id) * 0.3 AS follower_score,
                COUNT(DISTINCT r.id) * 0.2 AS recent_activity_score,
                (COUNT(DISTINCT p.id) * 0.5 + 
                COUNT(DISTINCT f.follower_user_id) * 0.3 + 
                COUNT(DISTINCT r.id) * 0.2) AS total_score
            FROM users u
            LEFT JOIN posts p ON u.id = p.user_id
            LEFT JOIN followers f ON u.id = f.followed_user_id
            LEFT JOIN (
                SELECT user_id, id FROM posts 
                WHERE created_at > DATE_SUB(NOW(), INTERVAL 7 DAY)
                UNION
                SELECT user_id, id FROM post_likes 
                WHERE created_at > DATE_SUB(NOW(), INTERVAL 7 DAY)
                UNION
                SELECT user_id, id FROM post_reposts 
                WHERE created_at > DATE_SUB(NOW(), INTERVAL 7 DAY)
            ) r ON u.id = r.user_id
            WHERE ${exclusionClause}
            GROUP BY u.id
            ORDER BY total_score DESC
            LIMIT 5
        `;
        
        // Execute query with parameters only if needed
        const [users] = excludedIds.length > 0
            ? await db.query(query, [excludedIds])
            : await db.query(query);
        
        return users;
    }
}

module.exports = User;
