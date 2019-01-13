'use strict';

const express = require('express');
const mongoose = require('mongoose');

const Tag = require('../models/tag');

const router = express.Router();

/* ========== GET/READ ALL ITEMS ========== */

router.get('/', (req, res, next) => {

  Tag.find()
    .sort({normalized:1})
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
  const tagId = req.params.id;

  if(!mongoose.Types.ObjectId.isValid(tagId)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }

  Tag.findById(tagId)
    .then(results => {
      if (results) {
        res.json(results)
          .status(200);
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
  const { name } = req.body;

  const newTag = { name: name };

  if(!newTag.name) {
    const err = new Error('Missing `name` in request body');
    err.status = 400;
    return next(err);
  }

  Tag.create(newTag)
    .then(results => {
      res.location(`${req.originalUrl}/${results.id}`)
        .status(201)
        .json(results);
    })
    .catch(err => {
      if (err.code === 11000) {
        err = new Error('That tag already exists');
        err.status = 400;
      }
      next(err);
    });
});

/* ========== PUT/UPDATE A SINGLE ITEM ========== */

router.put('/:id', (req, res, next) => {

  const updateId = req.params.id;
  const updateObj = { name: req.body.name };

  if(!mongoose.Types.ObjectId.isValid(updateId)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }

  if(!updateObj.name) {
    const err = new Error('Missing `name` in request body');
    err.status = 400;
    return next(err);
  }

  Tag.findByIdAndUpdate(updateId, {$set: updateObj}, {new: true})
    .then(results => {
      res.json(results);
    })
    .catch(err => {
      if (err.code === 11000) {
        err = new Error('That tag already exists');
        err.status = 400;
      }
      next(err);
    });
});

/* ========== DELETE/REMOVE A SINGLE ITEM ========== */

router.delete('/:id', (req, res, next) => {
  
  const deleteId = req.params.id;

  if(!mongoose.Types.ObjectId.isValid(deleteId)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }

  Tag.findByIdAndDelete(deleteId)
    .then()
    .then(res.sendStatus(204))
    .catch(err => {
      next(err);
    });
});

module.exports = router;