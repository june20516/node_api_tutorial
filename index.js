const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const Schema = mongoose.Schema;
const app = express();
const port = 5000;
const config = require('./config/key');
const { User } = require('./models/user');
const { auth } = require('./middleware/auth')

app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());


mongoose.connect(config.mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

app.get('/', (req, res) => {
  res.send('Hello World! Have a happy Thanks giving! but my battery has been going..')
});

app.post('/api/users/register', (req, res) => {
  const user = new User(req.body);
  user.save((err, userInfo) => {
    if (err) return res.json({ success: false, err });
    return res.status(200).json({
      success: true
    })
  });
})

app.post('/api/users/login', (req, res) => {
  User.findOne({ email: req.body.email }, (error, userInfo) => {
    if (!userInfo) {
      return res.json({
        loginSuccess: false,
        message: "Check your email"
      })
    }

    userInfo.comparePassword(req.body.password, (error, isMatch) => {
      if (error) return res.status(403).json({ loginSuccess: false, message: error });
      if (!isMatch) {
        return res.json({ loginSuccess: false, message: "password is wrong." })
      }

      userInfo.issueToken((error, user) => {
        if (error) return res.status(500).send(error);
        res.cookie('x_auth', user.token)
          .status(200)
          .json({ loginSuccess: true, userId: user._id })
      })
    })
  })
})

app.get('/api/users/auth', auth, (req, res) => {
  res.status(200).json({
    _id: req.user._id,
    isAdmin: req.user.role === 0 ? false : true,
    isAuth: true,
    email: req.user.email,
    name: req.user.name,
    image: req.user.image
  })
})

app.get('/api/users/logout', auth, (req, res) => {
  User.findOneAndUpdate(
    { _id: req.user._id }, 
    { token: ''},
    (error, user) =>{
      if(error) return res.json({ success: false, error });
      return res.status(200).send({
        success: true
      })
    }
  )
})

app.get('/api/landing', (req, res) => {
  res.send('hello client! here is server.')
})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
});
