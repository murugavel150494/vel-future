const AuthModel = require('../models/auth.model');

class AuthController {
  static login(req, res) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ 
          success: false, 
          message: 'Username and password are required.' 
        });
      }

      const authResult = AuthModel.verifyCredentials(username, password);

      if (authResult.success) {
        const token = 'murugavel-future-jwt-token-2026';
        
        return res.status(200).json({
          success: true,
          message: 'Welcome to Murugavel Studio - Login Successful',
          token,
          user: {
            username: authResult.username,
            role: authResult.role,
            studio: authResult.studio
          }
        });
      } else {
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid credentials. Please check your username and password.' 
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Internal server error during authentication.' 
      });
    }
  }
}

module.exports = AuthController;