const express = require('express')
const router = express.Router();
const auth = require('../../middleware/auth')
const User = require('../../models/User')
const jwt = require('jsonwebtoken')
const config = require('config')
const bcrypt = require('bcryptjs')
const { check, validationResult } = require('express-validator')

// @Route   GET api/auth
// @Desc    Getting the user
// @Access  Public 

router.get('/', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password')
        res.json(user);
    } catch (err) {
        console.error(err.message)
        res.status(500).send({ msg: 'Server Error' })
    }
});



// @Route   POST api/auth
// @Desc    Authenticate user & Get Token and also to login 
// @Access  Public 

router.post('/', [
    check('email', 'Please Include a valid email').isEmail(),
    check('password', 'Password is required').exists()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { //If there is an error
        return res.status(400).json({ errors: errors.array() }); // This is the response
    }

    const { email, password } = req.body;

    try {
        // See if user exist

        let user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ errors: [{ msg: 'Invalid Credentials' }] });
        }

        //Password Matches
        const isMatch = await bcrypt.compare(password, user.password)

        if (!isMatch) {
            return res.status(400).json({ errors: [{ msg: 'Invalid Credentials ' }] });
        }

        // Return jsonwebtoken
        const payload = {
            user: {
                id: user.id
            }
        }

        jwt.sign(
            payload,
            config.get('jwtSecret'),
            { expiresIn: 360000 },
            (err, token) => {
                if (err) throw err;
                res.json({ token });
            });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }

})


module.exports = router;