import mongoose from 'mongoose';

const ProblemsSchema = mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    userID: {
        type: String,
        required: true
    },
    location: {
        type: String,
    },
    description: {
        type: String,
        required: true
    },
    type: { 
        type: String,
        required: true
    },
    address: { 
        type: String
    },
    timestamp: {
        type: Number
    }
})

const Problems =  mongoose.model('event', ProblemsSchema);

export default Problems;