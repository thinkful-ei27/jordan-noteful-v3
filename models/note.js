'use strict';

const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  title: {type: String, required: true },
  content: {type: String},
  folderId: {type: mongoose.Schema.Types.ObjectId, ref: 'Folder'}
});

noteSchema.set('timestamps', true);

noteSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    delete ret._id;
    delete ret.__v;
  }
});

module.exports = mongoose.model('Note', noteSchema);