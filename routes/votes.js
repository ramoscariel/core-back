const express = require('express');
const db = require('../config/db');
const authenticateToken = require('../middleware/auth');

const router = express.Router();

//get post's vote count
router.get('/post/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [vote_count] = await db.query(
            `SELECT SUM(CASE WHEN vote_value = 1 THEN 1 ELSE -1 END) AS vote_count
            FROM votes
            WHERE post_id = ?
            GROUP BY post_id`, [id]);
        if (vote_count.length === 0) return res.status(404).json({ message: 'Post does not exist or it does not have any votes' });
        res.json(vote_count[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// get user's vote on a post
router.get('/user/post', async (req, res) => {
    const { user_id,post_id } = req.query;
    try {
        const [vote] = await db.query(
            'SELECT * FROM votes WHERE user_id = ? AND post_id = ?',
            [user_id,post_id]
        );
        if (vote.length === 0) return res.status(404).json({ message: 'User has not voted on this post or post does not exist'});
        res.json(vote[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// vote (create vote record)
router.post('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { vote_value } = req.body;

    try {
        const [result] = await db.query(
            'INSERT INTO votes (user_id, post_id, vote_value) VALUES (?, ?,?)',
            [req.user.userId,id,vote_value]
        );
        res.status(201).json({ message: 'Vote created' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// update vote
router.put('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { vote_value } = req.body;
    try {
        const [result] = await db.query(
            'UPDATE votes SET vote_value= ? WHERE post_id = ? AND user_id = ?',
            [vote_value, id, req.user.userId]
        );

        if (result.affectedRows === 0) {
            return res.status(403).json({ error: 'You are not authorized to update this vote or it does not exist.' });
        }

        res.json({ message: 'Vote updated successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;