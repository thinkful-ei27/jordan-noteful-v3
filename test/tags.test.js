'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');

const app = require('../server');

const { TEST_MONGODB_URI } = require('../config');

const Tag = require('../models/tag');
const Note = require('../models/note');
const { tags, notes } = require('../db/data');

const expect = chai.expect;
chai.use(chaiHttp);

describe('Tags API resource', function () {

  // ====*****====  SET UP AND TEAR DB DOWN BEFORE EVERY TEST ====*****====  \\
  // ====*****====   Connect to the database before all tests  ====*****====  \\
  before(function () {
    return mongoose.connect(TEST_MONGODB_URI)
      .then(() => mongoose.connection.db.dropDatabase());
  });

  beforeEach(function () {
    return Promise.all([
      Tag.insertMany(tags),
      Tag.createIndexes(),

      Note.insertMany(notes),
      Note.createIndexes()
    ]);
  });

  afterEach(function () {
    return mongoose.connection.db.dropDatabase();
  });

  after(function () {
    return mongoose.disconnect();
  });


  // ====*****====  Test for GET all Tags ====*****====  \\
  describe('GET /tags', function () {
    it('should return all existing tags', function () {

      let res;
      return chai.request(app)
        .get('/api/tags')
        .then(function (_res) {
          res = _res;
          expect(res).to.have.status(200);
          expect(res.body).to.have.lengthOf.at.least(1);
          return Tag.count();
        })
        .then(function (count) {
          expect(res.body).to.have.lengthOf(count);
        });
    });
    it('should return tags with correct files', function () {

      let resTag;
      return chai.request(app)
        .get('/api/tags')
        .then(function (res) {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.an('array');
          expect(res.body).to.have.lengthOf.at.least(1);

          res.body.forEach(function (tag) {
            expect(tag).to.be.an('object');
            expect(tag).to.include.keys('id', 'name', 'createdAt', 'updatedAt');
          });
          resTag = res.body[0];
          return Tag.findById(resTag.id);
        })
        .then(function (tag) {
          expect(resTag.id).to.equal(tag.id);
          expect(resTag.name).to.equal(tag.name);
        });
    });
  });


  // ====*****====  Test for GET Tag by Id ====*****====  \\
  describe('GET tag by Id', function () {
    it('should return one tag that matches the Id in the Url', function () {

      let data;
      return Tag.findOne()
        .then(_data => {
          data = _data;
          return chai.request(app)
            .get(`/api/tags/${data.id}`)
            .then(function (res) {
              expect(res).to.have.status(200);
              expect(res).to.be.json;
              expect(res.body).to.be.an('object');
              expect(res.body).to.include.keys('id', 'name', 'createdAt', 'updatedAt');
              expect(res.body.id).to.equal(data.id);
              expect(res.body.title).to.equal(data.title);
              expect(new Date(res.body.createdAt)).to.eql(data.createdAt);
              expect(new Date(res.body.updatedAt)).to.eql(data.updatedAt);

            });
        });
    });

    it('should return 400 error on invalid Id', function () {
      let badId = '99';
      return chai.request(app)
        .get(`/api/tags/${badId}`)
        .then(function (res) {
          expect(res).be.json;
          expect(res).to.have.status(400);
          expect(res.body).to.be.an('object');
          expect(res.body.message).to.equal('The `id` is not valid');
        });
    });
  });


  // ====*****====  Test for POST a Tag ====*****====  \\
  describe('POST tag', function () {
    it('should create a new tag', function () {

      let newTag = {
        'name': 'School',
      };
      let res;

      return chai.request(app)
        .post('/api/tags')
        .send(newTag)
        .then(function (_res) {
          res = _res;
          expect(res).to.have.status(201);
          expect(res).to.be.json;

          expect(res.body).to.be.an('object');
          expect(res.body).to.include.keys('id', 'name', 'createdAt', 'updatedAt');

          return Tag.findById(res.body.id);
        })
        .then(data => {
          expect(res.body.id).to.equal(data.id);
          expect(res.body.name).to.equal(data.name);
          expect(new Date(res.body.createdAt)).to.eql(data.createdAt);
          expect(new Date(res.body.updatedAt)).to.eql(data.updatedAt);
        });
    });

    it('should return 400 error and message when no name is provided', function () {
      const badItem = { name: '' };
      return chai.request(app)
        .post('/api/tags')
        .send(badItem)
        .then(function (res) {
          expect(res).to.be.json;
          expect(res).to.have.status(400);
          expect(res.body).to.be.an('object');
          expect(res.body.message).to.equal('Missing `name` in request body');
        });
    });

    it('should return 400 error and message if tag already exists', function () {

      return Tag.findOne()
        .then(res => {
          const duplicateTag = { 'name': res.name };
          return chai.request(app)
            .post('/api/tags/')
            .send(duplicateTag);
        })
        .then(function (res) {
          expect(res).be.json;
          expect(res).to.have.status(400);
          expect(res.body).to.be.an('object');
          expect(res.body.message).to.equal('That tag already exists');
        });
    });
  });


  // ====*****====  Test for PUT Tag by Id ====*****====  \\
  describe('PUT tag', function () {
    it('should update tag with new data', function () {

      const updateTag = {
        name: 'Felines',

      };
      let res;

      return Tag.findOne()
        .then(function (tag) {
          updateTag.id = tag.id;
          updateTag.createdAt = tag.createdAt;
          updateTag.updatedAt = tag.updatedAt;

          return chai.request(app)
            .put(`/api/tags/${updateTag.id}`)
            .send(updateTag);
        })
        .then(function (_res) {
          res = _res;
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.an('object');
          expect(res.body).to.include.keys('id', 'name', 'createdAt', 'updatedAt');
          expect(res.body.id).to.equal(updateTag.id);
          expect(res.body.name).to.equal(updateTag.name);
          expect(new Date(res.body.createdAt)).to.eql(updateTag.createdAt);
          expect(new Date(res.body.updatedAt)).to.greaterThan(updateTag.updatedAt);
        });
    });

    it('should return error if no name given', function () {
      const badItem = { name: '' };
      return Tag.findOne()
        .then(function (update) {

          return chai.request(app)
            .put(`/api/tags/${update.id}`)
            .send(badItem);
        })
        .then(function (res) {
          expect(res).to.be.json;
          expect(res).to.have.status(400);
          expect(res.body).to.be.an('object');
          expect(res.body.message).to.equal('Missing `name` in request body');
        });
    });

    it('should return 400 error and message if tag already exists', function () {

      let note1, note2;
      return Tag.find().sort({ normalized: 1 })
        .then(res => {
          note1 = res[0];
          note2 = res[1];
          note2.name = note1.name;

          return chai.request(app)
            .put(`/api/tags/${note2.id}`)
            .send(note2);
        })
        .then(function (res) {
          expect(res).be.json;
          expect(res).to.have.status(400);
          expect(res.body).to.be.an('object');
          expect(res.body.message).to.equal('That tag already exists');
        });
    });

    it('should return 400 error on invalid Id', function () {
      let badItem = { id: '99', name: 'kaka' };
      return chai.request(app)
        .put(`/api/tags/${badItem.id}`)
        .send(badItem)
        .then(function (res) {
          expect(res).be.json;
          expect(res).to.have.status(400);
          expect(res.body).to.be.an('object');
          expect(res.body.message).to.equal('The `id` is not valid');
        });
    });


  });

  // ====*****====  Test for DELETE Tag ====*****====  \\
  describe('Delete tag', function () {
    it('should delete tag by id', function () {

      let deleteTagId;
      return Tag
        .findOne()
        .then(function (tag) {
          deleteTagId = tag.id;
          return chai.request(app)
            .delete(`/api/tags/${deleteTagId}`);
        })
        .then(function (res) {
          expect(res).to.have.status(204);
          return Tag.findById(deleteTagId);
        })
        .then(tag => {
          expect(tag).to.be.null;
        });
    });

    it('should remove tag from all notes', function () {

      let deleteTagId;
      return Promise.all([
        Tag.findOne().then(function (tag) {
          deleteTagId = tag.id;
          return chai.request(app).delete(`/api/tags/${deleteTagId}`);
        }),
        Note.createIndexes(),
        chai.request(app).get('/api/notes'),
        Note.find().sort({ updatedAt: 'desc' })
      ])
        .then(([res1, res2, res3, data]) => {
          expect(res3).to.have.status(200);
          expect(res3).to.be.json;
          expect(res3.body).to.be.an('array');
          expect(res3.body).to.have.lengthOf(data.length);

          res3.body.forEach(function (note, i) {
            expect(note).to.be.an('object');
            expect(note).to.include.keys('id', 'title', 'content', 'createdAt', 'updatedAt', 'folderId', 'tags');
            expect(data[i].id).to.equal(note.id);
            expect(data[i].title).to.equal(note.title);
            expect(data[i].content).to.equal(note.content);
            expect(data[i].folderId.toString()).to.equal(note.folderId.toString());
            expect(data[i].createdAt).to.deep.eql(new Date(note.createdAt));
            expect(data[i].updatedAt).to.deep.eql(new Date(note.updatedAt));
            if(note.tags != []) {
              data[i].tags.forEach((tag, j) => {
                expect(tag.toString()).to.eql(note.tags[j].id);
                expect(tag).to.not.equal(deleteTagId);
              });
            } else {
              expect(note.tags).to.equal([]);
            }
          });
        });
    });

    it('should return 400 error on invalid Id', function () {
      let badId = '99';
      return chai.request(app)
        .get(`/api/tags/${badId}`)
        .then(function (res) {
          expect(res).be.json;
          expect(res).to.have.status(400);
          expect(res.body).to.be.an('object');
          expect(res.body.message).to.equal('The `id` is not valid');
        });
    });
  });
});