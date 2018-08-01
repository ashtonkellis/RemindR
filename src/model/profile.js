'use strict';

import mongoose from 'mongoose';

const profileSchema = mongoose.Schema({
  accountId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    unique: true,
    ref: 'accounts',
  },
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  bio: {
    type: String,
  },
  imageId: {
    type: mongoose.Schema.Types.ObjectId,
    unique: true,
    // ref: 'assets',
  },
});

const skipInit = process.env.NODE_ENV === 'development';
export default mongoose.model('profiles', profileSchema, 'profiles', skipInit);
