const express = require('express');
const { 
  getAllUsers, 
  getUserById, 
  createUser, 
  findUserByDisplayName, 
  getUserByAuth0Id,
  getCurrentUser,
  updateCurrentUser,
  updateUserStatus,
  deleteUser,
  getUserDirectMessages,
  // AI Avatar functions
  getUserAvatar,
  createUserAvatar,
  updateUserAvatar,
  getAvatarCommunicationHistory,
  provideFeedback,
  sendAIMessage
} = require('../controllers/users');

// Import notification preferences functions from notifications controller
const {
  getNotificationPreferences,
  updateNotificationPreferences
} = require('../controllers/notifications');

// Import mention functions
const {
  getUserMentions,
  countUnreadMentions
} = require('../controllers/mentions');

const router = express.Router();

// Public routes

// Authenticated routes
router
  // User management
  .get('/', getAllUsers) // Get all users (with pagination and filtering)
  .post('/', createUser) // Create a new user
  .get('/me', getCurrentUser) // Get current user details
  .patch('/me', updateCurrentUser) // Update current user
  .put('/me/status', updateUserStatus) // Update user status
  .get('/me/notification-preferences', getNotificationPreferences) // Get notification preferences
  .patch('/me/notification-preferences', updateNotificationPreferences) // Update notification preferences
  .get('/me/direct-messages', getUserDirectMessages) // Get direct message conversations
  
  // Mentions
  .get('/me/mentions', getUserMentions) // Get mentions for current user
  .get('/me/mentions/count', countUnreadMentions) // Count unread mentions
  
  // AI Avatar management
  .get('/me/avatar', getUserAvatar) // Get user's AI avatar
  .post('/me/avatar', createUserAvatar) // Create user's AI avatar
  .patch('/me/avatar', updateUserAvatar) // Update user's AI avatar
  .get('/me/avatar/history', getAvatarCommunicationHistory) // Get AI avatar communication history
  
  // User lookup
  .get('/auth0id/:auth0id', getUserByAuth0Id) // Get user by Auth0 ID
  .get('/:id', getUserById) // Get user by ID
  .delete('/:id', deleteUser) // Delete a user
  .get('/name/:displayname', findUserByDisplayName); // Find user by display name

// Create a separate router for AI-related endpoints 
// that don't fit naturally under the users resource
const aiRouter = express.Router();

aiRouter
  .post('/send-message', sendAIMessage) // Send a message using AI avatar
  .post('/feedback', provideFeedback); // Provide feedback on AI communication

module.exports = { router, aiRouter};