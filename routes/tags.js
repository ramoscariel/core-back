const express = require("express");
const db = require("../config/db");
const authenticateToken = require("../middleware/auth");

const router = express.Router();

// get all tags
router.get("/", async (req, res) => {
  try {
    const [tags] = await db.query("SELECT * FROM tags", []);
    res.json(tags);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// get tag by name

router.get("/:name", async (req, res) => {
  const { name } = req.params;

  try {
    const [tag] = await db.query("SELECT * FROM tags WHERE tag_name = ?", [
      name,
    ]);
    res.json(tag);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// get post's tags
router.get("/post/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [tags] = await db.query(
      `SELECT B.tag_id,B.tag_name FROM tagged A 
            INNER JOIN tags B ON A.tag_id = B.tag_id
            WHERE post_id = ?`,
      [id]
    );
    if (tags.length === 0) return res.json([]);
    res.json(tags);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// create new tag
router.post("/", authenticateToken, async (req, res) => {
  const { tag_name } = req.body;

  try {
    const [result] = await db.query("INSERT INTO tags (tag_name) VALUES (?)", [
      tag_name,
    ]);
    res.status(201).json({ tagId: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// associate tag to post

router.post("/post/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { tag_id } = req.body;
  try {
    const [result] = await db.query(
      "INSERT INTO tagged (post_id, tag_id) VALUES (?, ?)",
      [id, tag_id]
    );
    res.status(201).json({ message: "Tagged record created" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// delete all tagged records for a post
router.delete("/post/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    // Check if the user is the author of the post
    const [post] = await db.query(
      "SELECT author_id FROM posts WHERE post_id = ?",
      [id]
    );

    if (post.length === 0) {
      return res.status(404).json({ message: "Post not found" });
    }

    // If the user is not the author, deny access
    if (post[0].author_id !== req.user.userId) {
      return res
        .status(403)
        .json({ message: "You are not the author of this post" });
    }

    // Perform the deletion of all tagged records associated with the post
    const [result] = await db.query("DELETE FROM tagged WHERE post_id = ?", [
      id,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "No tags found for this post" });
    }
    res.status(201).json({ message: "Tagged records deleted" });
  } catch (error) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
