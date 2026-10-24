require('dotenv').config();

class AuthModel {
  static verifyCredentials(username, password) {
    const validUser = process.env.ADMIN_USERNAME || 'murugavel';
    const validPass = process.env.ADMIN_PASSWORD || 'future2026';

    if (username === validUser && password === validPass) {
      return {
        success: true,
        username: validUser,
        role: 'Administrator',
        studio: 'Murugavel Studio'
      };
    }
    return { success: false };
  }
}

module.exports = AuthModel;