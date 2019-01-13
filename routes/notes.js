'use strict';

const express = require('express');
const mongoose = require('mongoose');

const Note = require('../models/note');

const router = express.Router();

/* ========== GET/READ ALL ITEMS ========== */

router.get('/', (req, res, next) => {

  const { searchTerm, folderId, tagId } = req.query;
  let filter = {};

  if (searchTerm) {
    const regex = new RegExp(searchTerm, 'i');
    filter.$or = [{ 'title': regex }, { 'content': regex }];
  }

  if (folderId) {
    filter.folderId = folderId;
  }

  if (tagId) {
    filter.tags = tagId;
  }

  Note.find(filter)
    .populate('tags')
    .sort({ updatedAt: 'desc' })
    .then(results => {
      if (results) {
        res.json(results);
      } else {
        next();
      }
    })
    .catch(err => {
      next(err);
    });
});

/* ========== GET/READ A SINGLE ITEM ========== */
router.get('/:id', (req, res, next) => {

  const noteId = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(noteId)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }

  Note.findById(noteId)
    .populate('tags')
    .then(results => {
      if (results) {
        res.json(results);
      } else {
        next();
      }
    })
    .catch(err => {
      next(err);
    });
});

/* ========== POST/CREATE AN ITEM ========== */
router.post('/', (req, res, next) => {

  const { title, content, folderId, tags = [] } = req.body;

  const newItem = {
    title: title,
    content: content,
    folderId: folderId,
    tags: tags
  };

  if (newItem.folderId === '') {
    delete newItem.folderId;
  }

  if (!newItem.title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }

  if (folderId && !mongoose.Types.ObjectId.isValid(folderId)) {
    const err = new Error('The folder id is not valid');
    err.status = 400;
    return next(err);
  }

  tags.forEach(tagId => {
    if (tagId && !mongoose.Types.ObjectId.isValid(tagId)) {
      const err = new Error('There is an invalid tag id');
      err.status = 400;
      return next(err);
    }
  });

  Note.create(newItem)
    .then(note => note.populate('tags').execPopulate())
    .then(populatedNote => {
      res.location(`${req.originalUrl}/${populatedNote.id}`)
        .status(201)
        .json(populatedNote);
    })
    .catch(err => {
      if (err.code === 11000) {
        err = new Error('A note with that title already exists');
        err.status = 400;
      }
      next(err);
    });
});

/* ========== PUT/UPDATE A SINGLE ITEM ========== */
router.put('/:id', (req, res, next) => {

  const updateId = req.params.id;
  const { title, content, folderId, tags = [] } = req.body;

  if (!mongoose.Types.ObjectId.isValid(updateId)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }


  if (folderId && !mongoose.Types.ObjectId.isValid(folderId)) {
    const err = new Error('The `folderId` is not valid');
    err.status = 400;
    return next(err);
  }

  if (tags.length) {
    const badTags = tags.filter((tag) => !mongoose.Types.ObjectId.isValid(tag));
    if (badTags.length) {
      const err = new Error('There is an invalid `tagId`');
      err.status = 400;
      return next(err);
    }
  }

  if (!title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }

  const updateObj = { title, content, folderId, tags };

  if (updateObj.folderId === '') {
    delete updateObj.folderId;
    updateObj.$unset = { folderId: '' };
  }

  Note.findByIdAndUpdate(updateId, { $set: updateObj }, { new: true })
    .populate('tags')
    .then(results => {
      res.json(results);
    })
    .catch(err => {
      if (err.code === 11000) {
        err = new Error('A note with that title already exists');
        err.status = 400;
      }
      next(err);
    });
});

/* ========== DELETE/REMOVE A SINGLE ITEM ========== */
router.delete('/:id', (req, res, next) => {

  const deleteId = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(deleteId)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }

  Note.findByIdAndDelete(deleteId)
    .then(res.sendStatus(204))
    .catch(err => {
      next(err);
    });
});

module.exports = router;




