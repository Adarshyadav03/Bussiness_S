module.exports = {
  secret: process.env.JWT_SECRET || 'erp_jwt_secret_key_2026_super_secure_production_secret',
  expiresIn: process.env.JWT_EXPIRES_IN || '1d',
};
