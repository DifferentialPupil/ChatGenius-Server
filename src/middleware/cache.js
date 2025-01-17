const NodeCache = require('node-cache')
const { User } = require('../models')

const cache = new NodeCache()

async function getUserId(auth0id) {
    const userId = cache.get(auth0id)
    if (!userId) {
        const user = await User.findOne({ where: { auth0id: auth0id }, attributes: ['userid'] })
        cache.set(auth0id, user.userid, 60 * 60 * 24)
        return user.userid
    }
    return userId
}

module.exports = { cache, getUserId }