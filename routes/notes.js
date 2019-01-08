'use strict';

const express = require('express');
const mongoose = require('mongoose');

const Note = require('../models/note');

const router = express.Router();

/* ========== GET/READ ALL ITEMS ========== */

router.get('/', (req, res, next) => {

  const searchTerm = req.query.searchTerm;
  const regex = new RegExp(searchTerm, 'i');

  Note.find({
    $or: [
      { title: regex },
      { content: regex }
    ]
  }).sort({updatedAt: 'desc'})
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

  const { title, content } = req.body;

  const newItem = {
    title: title,
    content: content
  };

  if(!newItem.title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }

  Note.create(newItem)
    .then(results => {
      res.location(`${req.originalUrl}/${results.id}`)
        .status(201)
        .json(results);
    })
    .catch(err => {
      next(err);
    });
});

/* ========== PUT/UPDATE A SINGLE ITEM ========== */
router.put('/:id', (req, res, next) => {

  const updateId = req.params.id;
  const updateObj = {};
  const updatableFields = ['title', 'content'];

  updatableFields.forEach(field => {
    if (field in req.body) {
      updateObj[field] = req.body[field];
    }
  });

  if(!updateObj.title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }

  Note.findByIdAndUpdate(updateId, {$set: updateObj})
    .then(results => {
      res.json(results);
    })
    .catch(err => {
      next(err);
    });
});

/* ========== DELETE/REMOVE A SINGLE ITEM ========== */
router.delete('/:id', (req, res, next) => {

  const deleteId = req.params.id;

  Note.findByIdAndDelete(deleteId)
    .then(res.sendStatus(204))
    .catch(err => {
      next(err);
    });
});

module.exports = router;
