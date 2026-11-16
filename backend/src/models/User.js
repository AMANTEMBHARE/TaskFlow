const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name must be at most 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true, // creates a unique index: duplicate registrations fail at the database level
      lowercase: true,
      trim: true,
      maxlength: 254,
    },
    // select:false -> never returned by queries unless explicitly requested with +passwordHash
    passwordHash: { type: String, required: true, select: false },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        delete ret.passwordHash; // belt and braces: never serialize the hash
        return ret;
      },
    },
  }
);

module.exports = mongoose.model('User', userSchema);
