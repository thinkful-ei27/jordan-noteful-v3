'use strict';

const mongoose = require('mongoose');

const { MONGODB_URI } = require('../config');

const Note = require('../models/note');
const Folder = require('../models/folder')

const { notes, folders } = require('../db/data');


mongoose.connect(MONGODB_URI, { useNewUrlParser:true })
  .then(() => mongoose.connection.db.dropDatabase())
  .then(() => Folder.insertMany(folders))
  .then(results => {
    console.info(`Inserted ${results.length} Folders`);
  })
  .then(Folder.createIndexes())
  .then(() => Note.insertMany(notes))
  .then(results => {
    console.info(`Inserted ${results.length} Notes`);
  })
  .then(() => mongoose.disconnect())
  .catch(err => {
    console.error(err);
  });