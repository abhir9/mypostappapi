const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const PostSchema = new Schema({
    text: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        required: true,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        required: true,
        default: Date.now
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    likes: {
        type: Number,
        default: 0,
    },
    userlikes: {
        type: Array
    }
});
module.exports = mongoose.model('Post', PostSchema);