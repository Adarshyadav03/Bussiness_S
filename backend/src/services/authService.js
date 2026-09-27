const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');
const jwtConfig = require('../config/jwt');

async function login(email, password) {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  });

  if (!user) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    error.errorCode = 'UNAUTHORIZED';
    throw error;
  }

  const isPasswordValid = await bcrypt.compare(password, user.password_hash);
  if (!isPasswordValid) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    error.errorCode = 'UNAUTHORIZED';
    throw error;
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    jwtConfig.secret,
    { expiresIn: jwtConfig.expiresIn }
  );

  return {
    success: true,
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
}

async function signup(name, email, password) {
  const normalizedEmail = email.toLowerCase().trim();
  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    const error = new Error('User with this email already exists');
    error.statusCode = 400;
    error.errorCode = 'DUPLICATE_EMAIL';
    throw error;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const newUser = await prisma.user.create({
    data: {
      name: name.trim(),
      email: normalizedEmail,
      password_hash: passwordHash,
      role: 'SALES_USER', // Default role requirement
    },
  });

  return {
    success: true,
    message: 'Account created successfully. Please login.',
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
    },
  };
}

module.exports = { login, signup };
