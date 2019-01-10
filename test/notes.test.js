'use strict';

const chai = require('chai');
const chaiHttp =  require('chai-http');
const mongoose = require('mongoose');

const app = require('../server');

const { TEST_MONGODB_URI } = require('../config');
const Note = require('../models/note');
const { notes } = require('../db/data');

const expect = chai.expect;
chai.use(chaiHttp);

describe('Notes API resource', function() {

  // SET UP AND TEAR DB DOWN BEFORE EVERY TEST
  // Connect to the database before all tests
  before(function() {
    return mongoose.connect(TEST_MONGODB_URI)
      .then(() => mongoose.connection.db.dropDatabase());
  });

  // Seed data runs before each test
  beforeEach(function () {
    return Note.insertMany(notes);
  });

  // Drop database runs after each test
  afterEach(function () {
    return mongoose.connection.db.dropDatabase();
  });

  // Disconnect after all tests
  after(function () {
    return mongoose.disconnect();
  });
  // END OF BEFORE AND AFTER TEST SETUPS

  // Test for GET all Notes
  describe('GET /notes', function () {
    it('should return all existing notes', function() {

      let res;
      return chai.request(app)
        .get('/api/notes')
        .then(function(_res) {
          res = _res;
          expect(res).to.have.status(200);
          expect(res.body).to.have.lengthOf.at.least(1);
          return Note.count();
        })
        .then(function(count) {
          expect(res.body).to.have.lengthOf(count);
        });
    });

    it('should return notes with correct fields', function() {
      
      let resNote;
      return chai.request(app)
        .get('/api/notes')
        .then(function(res) {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.an('array');
          expect(res.body).to.have.lengthOf.at.least(1);

          res.body.forEach(function(note) {
            expect(note).to.be.an('object');
            expect(note).to.include.keys('id', 'title', 'content', 'createdAt', 'updatedAt', 'folderId');
          });
          resNote = res.body[0];
          console.log((resNote));
          return Note.findById(resNote.id);
        })
        .then(function(note) {
          console.log(note);
          expect(resNote.id).to.equal(note.id);
          expect(resNote.title).to.equal(note.title);
          expect(resNote.content).to.equal(note.content);
          expect(resNote.folderId).to.equal(note.folderId.toString());
        });
    });
  });

  describe('GET note by Id', function () {
    it('should return one note that matches the Id in the Url', function() {

      let data;

      return Note.findOne()
        .then(_data => {
          data = _data;
          return chai.request(app)
            .get(`/api/notes/${data.id}`)
            .then(function(res) {
              expect(res).to.have.status(200);
              expect(res).to.be.json;
          
              expect(res.body).to.be.an('object');
              expect(res.body).to.include.keys('id', 'title', 'content', 'createdAt', 'updatedAt', 'folderId');

              expect(res.body.id).to.equal(data.id);
              expect(res.body.title).to.equal(data.title);
              expect(res.body.content).to.equal(data.content);
              expect(res.body.folderId).to.equal(data.folderId.toString());
              expect(new Date(res.body.createdAt)).to.eql(data.createdAt);
              expect(new Date(res.body.updatedAt)).to.eql(data.updatedAt);

            });
        });
    });
  });

  describe('POST note', function() {
    it('should create a new note', function() {

      let newNote = {
        'title': 'The Best Cats are Big Cats',
        'content': 'Lions and Tigers... No Bears!'
      };
      let res;

      return chai.request(app)
        .post('/api/notes')
        .send(newNote)
        .then(function(_res) {
          res = _res;
          expect(res).to.have.status(201);
          expect(res).to.be.json;

          expect(res.body).to.be.an('object');
          expect(res.body).to.include.keys('id', 'title', 'content', 'createdAt', 'updatedAt');

          return Note.findById(res.body.id);
        })
        .then(data => {
          expect(res.body.id).to.equal(data.id);
          expect(res.body.title).to.equal(data.title);
          expect(res.body.content).to.equal(data.content);
          expect(new Date(res.body.createdAt)).to.eql(data.createdAt);
          expect(new Date(res.body.updatedAt)).to.eql(data.updatedAt);
        });
    });
  });

  describe('PUT note', function() {
    it('should update note with new data', function() {

      const updateNote = {
        title: 'What is the hottest club this holiday season?',
        content: 'The Cat Club!!!!!!'
      };

      return Note
        .findOne()
        .then(function(note) {
          updateNote.id = note.id;
          updateNote.createdAt = note.createdAt;
          updateNote.updatedAt = note.updatedAt;

          return chai.request(app)
            .put(`/api/notes/${note.id}`)
            .send(updateNote);
        })
        .then(function(res) {

          expect(res).to.have.status(200);
          expect(res).to.be.json;

          expect(res.body).to.be.an('object');
          expect(res.body).to.include.keys('id', 'title', 'content', 'createdAt', 'updatedAt', 'folderId');

          return Note.findById(updateNote.id);
        })
        .then(note => {
          expect(note.id).to.equal(updateNote.id);
          expect(note.title).to.equal(updateNote.title);
          expect(note.content).to.equal(updateNote.content);
          expect(new Date(note.createdAt)).to.eql(updateNote.createdAt);
          expect(new Date(note.updatedAt)).to.be.greaterThan(updateNote.updatedAt);
        });
    });
  });

  describe('Delete note', function() {
    it('should delete note by id', function() {

      let deleteNoteId;
      return Note
        .findOne()
        .then(function(note) {
          deleteNoteId = note.id;

          return chai.request(app)
            .delete(`/api/notes/${deleteNoteId}`);
        })
        .then(function(res) {

          expect(res).to.have.status(204);

          return Note.findById(deleteNoteId);
        })
        .then(note => {
          expect(note).to.be.null;
        });
    });
  });

});
