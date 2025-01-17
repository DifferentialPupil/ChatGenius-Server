const { User } = require('../models')
const { getUserId } = require('../middleware/cache')

const getAllUsers = async (req, res) => {
    try {
        const users = await User.findAll()
        res.json(users)
    } catch (error) {
        next(error)
    }
}

const getUserById = async (req, res, next) => {
    console.log("-------------------------------------")
    try {
        const user = await User.findByPk(req.params.id)
        res.json(user)
    } catch (error) {
        console.log(error)
    }
}

const getCurrentUser = async (req, res) => {
    // const userid = await getUserId(req.oidc.user.sub)
    // console.log(userid)

    // if (userid === undefined) {
    //     res.status(404).json({ error: 'User not authenticated' })
    //     return
    // }
    const user = await User.findOne({ where: { auth0id: req.params.auth0id }, attributes: ['userid'] })
    console.log(user)
    res.json(user)
}

const createUser = async (req, res) => {
    try {
        const user = await User.create({
            auth0id: req.body.auth0id,
            username: req.body.username,
            displayname: req.body.displayname,
            email: req.body.email,
            avatarurl: req.body.avatarurl
        })
        res.json(user)
    } catch (error) {
        console.log(error)
    }
}

const findUserByDisplayName = async (req, res) => {
    try {
        // get name from path
        console.log(req.params.displayname)
        const user = await User.findOne({ where: { username: req.params.displayname } })
        res.json(user)
    } catch (error) {
        console.log(error)
    }
}

module.exports = {
    getAllUsers,
    getUserById,
    getCurrentUser,
    createUser,
    findUserByDisplayName
}