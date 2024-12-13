const express = require("express");
const db = require("../config/db");
const authenticateToken = require("../middleware/auth");

const router = express.Router();

// get all posts
router.get("/", async (req, res) => {
  try {
    const [posts] = await db.query(
      "SELECT post_id, title , DATE(creation_time) creation_time, author_id, updated_count FROM posts WHERE parent_post_id IS NULL",
      []
    );

    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// get user's liked posts
router.get("/liked/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [posts] = await db.query(
      `SELECT A.post_id post_id, A.title title , DATE(A.creation_time) creation_time FROM posts A
      INNER JOIN votes B ON A.post_id=B.post_id
      WHERE user_id = ? AND vote_value = 1;`,
      [id]
    );

    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// get user's published post
router.get("/posted/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [posts] = await db.query(
      `SELECT post_id, title , DATE(creation_time) creation_time FROM posts
      WHERE author_id = ?`,
      [id]
    );

    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//get post by id
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const [post] = await db.query(
      "SELECT post_id,parent_post_id, author_id ,DATE(creation_time) creation_time, title,content FROM posts WHERE post_id = ?",
      [id]
    );
    if (post.length === 0)
      return res.status(404).json({ message: "Post not found" });
    res.json(post[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//create a new post
router.post("/", authenticateToken, async (req, res) => {
  const { title, content, parent_post_id } = req.body;

  try {
    const [result] = await db.query(
      "INSERT INTO posts (title, content, author_id, parent_post_id) VALUES (?, ?, ?, ?)",
      [title, content, req.user.userId, parent_post_id]
    );
    res.status(201).json({ postId: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//update a post
router.put("/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { title, content } = req.body;
  try {
    const [result] = await db.query(
      "UPDATE posts SET title = ?, content = ? WHERE post_id = ? AND author_id = ?",
      [title, content, id, req.user.userId]
    );

    if (result.affectedRows === 0) {
      return res.status(403).json({
        error:
          "You are not authorized to update this post or it does not exist.",
      });
    }

    res.json({ message: "Post updated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
