const express = require('express')
const request = require('request')
const config = require('config')
const router = express.Router();
const auth = require('../../middleware/auth')
const Profile = require('../../models/Profile')
const User = require('../../models/User')
const { check, validationResult } = require('express-validator');
const { findOneAndRemove } = require('../../models/Profile');

// @Route   GET api/profile/me
// @Desc    Get current profile
// @Access  Private

router.get('/me', auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id }).populate('user', ['name', 'avatar']);
        if (!profile) {
            return res.status(400).json({ msg: 'There is no profile for this user' })
        }

        res.json(profile);
    } catch (err) {
        console.error(err.message)
        res.status(500).send('Server Error')
    }
})

// @Route   POST api/profile
// @Desc    Create or Update a user profile
// @Access  Private

router.post('/', [auth, [
    check('status', 'Status is required').not().isEmpty(),
    check('skills', 'Skills is required').not().isEmpty()
]], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }

    const {
        company, website, location, bio, status, github_username, skills, youtube, facebook, twitter, instagram, linkedin
    } = req.body;

    // Built profile object
    const profileFields = {};
    profileFields.user = req.user.id;
    if (company) profileFields.company = company;
    if (website) profileFields.website = website;
    if (location) profileFields.location = location;
    if (bio) profileFields.bio = bio;
    if (status) profileFields.status = status;
    if (github_username) profileFields.github_username = github_username;
    if (skills) {
        profileFields.skills = skills.split(',').map(skills => skills.trim());
    }
    // Build Social Object
    profileFields.social = {}
    if (youtube) profileFields.social.youtube = youtube;
    if (facebook) profileFields.social.facebook = facebook;
    if (twitter) profileFields.social.twitter = twitter;
    if (instagram) profileFields.social.instagram = instagram;
    if (linkedin) profileFields.social.linkedin = linkedin;

    try {
        let profile = await Profile.findOne({ user: req.user.id })
        if (profile) {
            //How to Update profile
            profile = await Profile.findOneAndUpdate(
                { user: req.user.id }, { $set: profileFields }, { new: true }
            );
            return res.json(profile)
        }
        // Create
        profile = new Profile(profileFields);
        await profile.save();
        res.json(profile);
    } catch (err) {
        console.error(err.message)
        res.status(500).send('Server Error')
    }
})


// @Route   Get api/profile
// @Desc    Get All Profile
// @Access  Public

router.get('/', async (req, res) => {
    try {
        const profiles = await Profile.find().populate('user', ['name', 'avatar']);
        res.json(profiles)
    } catch (err) {
        console.error(err.message)
        res.status(500).send('Server Error')
    }
})


// @Route   Get api/profile/user/user_id
// @Desc    Get Profile by User ID
// @Access  Public

router.get('/user/:user_id', async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.params.user_id }).populate('user', ['name', 'avatar']);

        if (!profile)
            return res.status(400).json({ msg: 'There is no current profile' });

        res.json(profile)
    } catch (err) {
        console.error(err.message)
        if (err.kind == 'ObjectId') {
            return res.status(400).json({ msg: 'There is no current profile' });
        }
        res.status(500).send('Server Error')
    }
})

// @Route   DELETE api/profile
// @Desc    Delete Profile  , user & posts
// @Access  Private

router.delete('/', auth, async (req, res) => {
    try {
        // @todo - remove user posts
        //Remove Profile
        await Profile.findOneAndRemove({ user: req.user.id });
        //Remove User
        await User.findOneAndRemove({ _id: req.user.id });
        res.json({ msg: 'User has been deleted' })
    } catch (err) {
        console.error(err.message)
        res.status(500).send('Server Error')
    }
})


// @Route   PUT api/profile/experience
// @Desc    Add profile experience
// @Access  Private

router.put('/experience', [auth, [
    check('title', 'Title is required').not().notEmpty(),
    check('company', 'Company is required').not().notEmpty(),
    check('from', 'From Date is required').not().notEmpty()
]], async (req, res) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }

    const {
        title,
        company,
        location,
        from,
        to,
        current,
        description
    } = req.body;

    const newExp = {

        title,
        company,
        location,
        from,
        to,
        current,
        description
    }

    try {
        const profile = await Profile.findOne({ user: req.user.id })
        profile.experience.unshift(newExp);
        await profile.save();
        res.json(profile);
    } catch (err) {
        console.error(err.message)
        res.status(500).send('Server Error')
    }
});

// @Route   DELETE api/profile/experience/:exp_id
// @Desc    Delete Experience from Profile
// @Access  Private

router.delete('/experience/:exp_id', auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id })
        //Get remove indedx
        const removeIndex = profile.experience.map(item => item.id).indexOf(req.params.exp_id)
        profile.experience.splice(removeIndex, 1);
        await profile.save();
        res.json(profile);
    } catch (err) {
        console.error(err.message)
        res.status(500).send('Server Error')
    }
})

// @Route   PUT api/profile/education
// @Desc    Add profile education
// @Access  Private

router.put('/education', [auth, [
    check('school', 'School is Required').not().isEmpty(),
    check('degree', 'Degree is Required').not().isEmpty(),
    check('field_of_study', 'Field of Study is Required').not().isEmpty(),
    check('from', 'From is Required').not().isEmpty()
]], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }

    const {
        school,
        degree,
        field_of_study,
        from,
        to,
        current,
        description
    } = req.body;

    const newEducation = {
        school,
        degree,
        field_of_study,
        from,
        to,
        current,
        description
    }

    try {
        const profile = await Profile.findOne({ user: req.user.id })
        profile.education.unshift(newEducation);
        await profile.save();
        res.json(profile);
    } catch (err) {
        console.error(err.message);
        res.status(400).send('Server Error')
    }
})

// @Route   DELETE api/profile/education/:exp_id
// @Desc    Delete Education from Profile
// @Access  Private

router.delete('/education/:edu_id', auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id })
        //Get Remove Index
        const removeIndex = profile.education
            .map(item => item.id)
            .indexOf(req.params.edu_id)
        profile.education.splice(removeIndex, 1)
        await profile.save();
        res.json(profile);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error')
    }
})

// @Route   GET api/profile/github/:username
// @Desc    Get user repos from Github
// @Access  Public

router.get('/github/:username', auth, (req, res) => {
    try {
        const options = {
            uri: `https://api.github.com/users/${req.params.username}/repos?per_page=5&sort=created: asc&client_id=${config.get('githubClientId')}&client_secret=${config.get('githubSecret')}`,
            method: 'GET',
            headers: {'user-agent': 'node-js'}
        };
        request(options,(error ,response, body) => {
             if (error) console.error(error);

             if(response.statusCode !== 200) {
                 res.status(404).json({ msg: 'No Github Profile found'})
             }

             res.json(JSON.parse(body));
        })
    } catch (err) {
        console.error(err.message)
        res.status(500).send('Server Error')
    }
})




module.exports = router;