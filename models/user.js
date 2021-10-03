const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const saltRounds = 10;

const userSchema = mongoose.Schema({
    name: {
        type: String,
        maxlength: 50
    },
    email: {
        type: String,
        trim: true,
        unique: 1
    },
    password: {
        type: String,
        minlength: 8
    },
    role: {
        type: Number,
        default: 0
    },
    image: String,
    token: {
        type: String
    },
    tokenExp: {
        type: Number
    }
});

userSchema.pre('save', function (next) {
    var user = this;

    if (user.isModified('password')) {
        bcrypt.genSalt(saltRounds, function (error, salt) {
            if (error) return next(error);
            bcrypt.hash(user.password, salt, function (error, hash) {
                if (error) return next(error);
                user.password = hash;
                next();
            })
        })
    } else {
        next();
    }
})

userSchema.methods.comparePassword = function (plainPassword, callback) {
    bcrypt.compare(plainPassword, this.password, function (error, isMatch) {
        if (error) return callback(error);
        callback(null, isMatch);
    })
}

userSchema.methods.issueToken = function (callback) {
    var user = this;
    var token = jwt.sign(user._id.toJSON(), 'signed');
    user.token = token;
    user.save(function (error, userInfo) {
        if (error) return callback(error);
        callback(null, userInfo);
    })

}
userSchema.methods.unsignToken = function (callback) {
    var user = this;
    var unsignedToken = jwt.verify(user.token, 'signed');
}

userSchema.statics.findByToken = function (token, callback) {
    var user = this;
    jwt.verify(token, 'signed', function (error, decoded) {
        if (error) throw error;
        user.findOne({ '_id': decoded, 'token': token }, function (error, user) {
            if (error) return callback(error);
            callback(null, user);
        })
    })
}

const User = mongoose.model('User', userSchema);

module.exports = { User };