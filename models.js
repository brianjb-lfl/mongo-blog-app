'use strict';

/*global mongoose */

const postSchema = mongoose.Schema({
  title: {String, required: true}, 
  content: {String, required: true},
  author: {
    firstName: String,
    lastName: String
  },
  created: {type: String, default: Date.now}
});


