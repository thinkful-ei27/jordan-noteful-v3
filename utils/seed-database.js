'use strict';

const mongoose = require('mongoose');

const { MONGODB_URI } = require('../config');

const Note = require('../models/note');
const Folder = require('../models/folder');
const Tag = require('../models/tag');

const { notes, folders, tags } = require('../db/data');


mongoose.connect(MONGODB_URI, { useNewUrlParser: true })
  .then(() => mongoose.connection.db.dropDatabase())
  .then(() => {
    return Promise.all([
      Note.insertMany(notes)
        .then(results => {
          console.info(`Inserted ${results.length} Notes`);
        }),
      Folder.insertMany(folders)
        .then(results => {
          console.info(`Inserted ${results.length} Folders`);
        }),
      Tag.insertMany(tags)
        .then(results => {
          console.info(`Inserted ${results.length} Tags`);
        }),
      Folder.createIndexes(),
      Tag.createIndexes()
    ]);
  })
  .then(() => mongoose.disconnect())
  .catch(err => {
    console.error(err);
  });