const { json } = require('express');
const express = require('express')
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../../middleware/auth');
const Post = require('../../models/Post');
const Profile = require('../../models/Profile');
const User = require('../../models/User');

// @Route   POST api/posts
// @Desc    Create a post
// @Access  Private

router.post('/', [auth, [
    check('text', 'Text is Required').not().isEmpty()
]], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }

    try {
        const user = await User.findById(req.user.id).select('-password');

        const newPost = new Post({
            text: req.body.text,
            name: user.name,
            avatar: user.avatar,
            user: req.user.id
        })

        const post = await newPost.save();
        res.json(post);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error')
    }

})

// @Route   GET api/posts
// @Desc    Get all comments
// @Access  Public

router.get('/', auth, async (req, res) => {
    try {
        const posts = await Post.find().sort({ date: -1 })
        res.json(posts)
    } catch (err) {
        console.error(err.message)
        res.status(500).send('Server Error')
    }
})

// @Route   GET api/posts/:id
// @Desc    Get comment by ID
// @Access  Public

router.get('/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) { // Pag walang comment or If there is no comment/post
            return res.status(404).json({ msg: 'Post not found' })
        }

        res.json(post)
    } catch (err) {
        console.error(err.message)
        if (err.kind === 'ObjectId') { // Pag walang comment or If there is no comment/post
            return res.status(404).json({ msg: 'Post not found' })
        }
        res.status(500).send('Server Error')
    }
})

// @Route   DELETE api/posts/:id
// @Desc    Delete comment by ID
// @Access  Private

router.delete('/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) { // Pag walang comment or If there is no comment/post
            return res.status(404).json({ msg: 'Post not found' })
        }
        //Check user
        if (post.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized' })
        }
        
        await post.remove();
        res.json({ msg: 'Comment has been deleted ' })
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') { // Pag walang comment or If there is no comment/post
            return res.status(404).json({ msg: 'Post not found' })
        }
        res.status(500).send('Server Error')
    }
})

module.exports = router;