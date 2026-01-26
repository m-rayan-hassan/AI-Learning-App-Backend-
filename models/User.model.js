// models/User.js
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    // Not unique based on your requirement
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    // Not required because Google users won't provide one
  },
  profileImage: {
    type: String,
    default: "https://via.placeholder.com/150"
  },
  authSource: {
    type: String,
    enum: ['local', 'google'],
    default: 'local'
  }
}, { timestamps: true });

export default mongoose.model('User', userSchema);