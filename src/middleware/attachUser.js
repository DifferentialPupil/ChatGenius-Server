const { User } = require('../models')

const attachUser = async (req, res, next) => {
    try {

        const auth0id = req.auth?.payload?.sub
        if (!auth0id) {
            return res.status(401).json({ message: 'No Auth0 sub found on request.' })
        }

        // TODO: Cache the user record
        
        const userRecord = await User.findOne({
            where: { 'auth0_id': auth0id }
        })
        
        if (!userRecord) {
            return res.status(404).json({ message: 'User not found in database.' })
        }
    
        // Attach user to request
        req.user = userRecord.dataValues
        next()

    } catch (error) {

        console.error('Error attaching user:', error)
        next(error)

    }
}
module.exports = { attachUser }