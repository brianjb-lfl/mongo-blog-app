'use strict';

const bodyParser = require('body-parser');
const express = require('express');
const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

const {PORT, DATABASE_URL} = require('./config');
const {Post} = require('./models');

const app = express();
app.use(bodyParser.json());

app.get('/posts', (req, res) => {
  Post
    .find()
    .limit(20)
    .then(posts => {
      res.json({
        posts: posts.map(
          (post) => post.apiRepr())
      });
    })
    .catch(
      err => {
        console.error(err);
        res.status(500).json({message: 'Internal server error'});
      });
});

app.get('/posts/:id', (req, res) => {
  Post
    .findById(req.params.id)
    .then(post => res.json(post.apiRepr()))
    .catch(err => {
      console.error(err);
      res.status(500).json({message: 'Internal server error'});
    });
});


app.post('/posts', (req, res) => {
  const reqFields = ['title', 'content', 'author'];
  for (let i = 0; i < reqFields.length; i++){
    const field = reqFields[i];
    if(!(field in req.body)) {
      const message = `Missing \`${field}\` in request body`;
      console.error(message);
      return res.status(400).send(message);
    }
  }
  
  Post
    .create({
      title: req.body.title,
      content: req.body.content,
      author: req.body.author
    })
    .then(
      post => res.status(201).json(post.apiRepr())            // should have location header
    )
    .catch(err => {
      console.error(err);
      res.status(500).json({message: 'Internal server error'});
    });
});

app.put('/posts/:id', (req, res) => {
  if(!(req.params.id && req.body.id && req.params.id === req.body.id)) {
    const message = `Request header id ${req.params.id} and 
      body id ${req.body.id} mismatch`;
    console.error(message);
    return res.status(400).send(message);
  }

  const updateableFields = ['title', 'content', 'author'];
  let updateObj = {};
  updateableFields.forEach( field => {
    if(field in req.body){
      updateObj[field] = req.body[field];
    }
    console.log(updateObj);
  });  
  Post
    .findByIdAndUpdate(req.params.id, {$set: updateObj} )
    .then(res.sendStatus(204))
    .catch(err => res.status(500).json({message: 'Internal server error'}));
});


app.delete('/posts/:id', (req, res) => {
  console.log(req.params.id);
  Post
    .findByIdAndRemove(req.params.id)
    .then(res.sendStatus(204))
    .catch(err => res.status(500).json({message: 'Internal server error'}));  
});


app.use('*', function(req, res) {
  res.status(404).json({message: 'endpoint not found'});
});

let server;

// this function connects to our database, then starts the server
function runServer(databaseUrl=DATABASE_URL, port=PORT) {

  return new Promise((resolve, reject) => {
    mongoose.connect(databaseUrl, err => {
      if (err) {
        return reject(err);
      }
      server = app.listen(port, () => {
        console.log(`Your app is listening on port ${port}`);
        resolve();
      }).on('error', err => {
        mongoose.disconnect();
        reject(err);
      });
    });
  });
}

// this function closes the server, and returns a promise. we'll
// use it in our integration tests later.
function closeServer() {
  return mongoose.disconnect().then(() => {
    return new Promise((resolve, reject) => {
      console.log('Closing server');
      server.close(err => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });
  });
}

// if server.js is called directly (aka, with `node server.js`), this block
// runs. but we also export the runServer command so other code (for instance, test code) can start the server as needed.
if (require.main === module) {
  runServer().catch(err => console.error(err));
}

module.exports = {app, runServer, closeServer};