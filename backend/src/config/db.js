const mongoose = require('mongoose');
const logger = require('../utils/logger');

async function connectDB(uri) {
  mongoose.set('strictQuery', true);
  mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));
  mongoose.connection.on('reconnected', () => logger.info('MongoDB reconnected'));

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  logger.info('MongoDB connected', { database: mongoose.connection.name });
}

module.exports = connectDB;
