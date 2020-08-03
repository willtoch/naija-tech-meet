const mongoose = require('mongoose');

const URI = 'mongodb+srv://will-first:willfirst@cluster0.xzgem.mongodb.net/linkedIn?retryWrites=true&w=majority';

const connectDB = async () => {
    await mongoose.connect(URI, {
        useUnifiedTopology: true,
        useNewUrlParser: true
    })
    .then( () => console.log('MongoDB connected'))
    .catch(err => console.log(err));

};

module.exports = connectDB;