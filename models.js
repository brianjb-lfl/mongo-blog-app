'use strict';

/*global mongoose */
const mongoose = require('mongoose');


const postSchema = mongoose.Schema({
  title: {type: String, required: true}, 
  content: {type: String, required: true},
  author: {
    firstName: String,
    lastName: String
  },
  created: {type: String, default: Date.now}
});

postSchema.virtual('authorname').get(function() {
  return `${this.author.firstName} ${this.author.lastName}`.trim();
});

postSchema.methods.apiRepr = function() {
  return {
    id: this._id,
    title: this.title,
    content: this.content,
    author: this.authorname,
    created: this.created
  };
};

const Post = mongoose.model('Post', postSchema);

module.exports = {Post};