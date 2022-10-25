import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  firstname: { 
    type: String, 
    default: null 
  },
  lastname: { 
    type: String, 
    default: null 
  },
  email: { 
    type: String, 
    unique: true 
  },
  userID: { 
    type: String, 
    unique: true 
  },
  password: { 
    type: String 
  },
  city: { 
    type: String 
  },
  token: { 
    type: String 
  }
});

const User = mongoose.model("User", userSchema);

export default User;