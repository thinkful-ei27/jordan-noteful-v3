'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');

const app = require('../server');

const { TEST_MONGODB_URI } = require('../config');
const Folder = require('../models/folder');
const Note = require('../models/note');
const Tag = require('../models/tag');
const { folders, tags, notes } = require('../db/data');

const expect = chai.expect;
chai.use(chaiHttp);

describe('Folders API resource', function () {

  // SET UP AND TEAR DB DOWN BEFORE EVERY TEST
  // Connect to the database before all tests
  before(function () {
    return mongoose.connect(TEST_MONGODB_URI)
      .then(() => mongoose.connection.db.dropDatabase());
  });

  beforeEach(function () {
    return Promise.all([
      Folder.insertMany(folders),
      Folder.createIndexes()
    ]);
  });

  afterEach(function () {
    return mongoose.connection.db.dropDatabase();
  });

  after(function () {
    return mongoose.disconnect();
  });
  // END OF BEFORE AND AFTER TEST SETUPS

  // Test for GET all Notes
  describe('GET /folders', function () {
    it('should return all existing folders', function () {

      let res;
      return chai.request(app)
        .get('/api/folders')
        .then(function (_res) {
          res = _res;
          expect(res).to.have.status(200);
          expect(res.body).to.have.lengthOf.at.least(1);
          return Folder.count();
        })
        .then(function (count) {
          expect(res.body).to.have.lengthOf(count);
        });
    });
    it('should return folders with correct fields', function () {

      let resFolder;
      return chai.request(app)
        .get('/api/folders')
        .then(function (res) {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.an('array');
          expect(res.body).to.have.lengthOf.at.least(1);

          res.body.forEach(function (folder) {
            expect(folder).to.be.an('object');
            expect(folder).to.include.keys('id', 'name', 'createdAt', 'updatedAt');
          });
          resFolder = res.body[0];
          return Folder.findById(resFolder.id);
        })
        .then(function (folder) {
          expect(resFolder.id).to.equal(folder.id);
          expect(resFolder.name).to.equal(folder.name);
        });
    });
  });


  // ====*****====  Test for GET Folder by Id ====*****====  \\
  describe('GET folder by Id', function () {
    it('should return one folder that matches the Id in the Url', function () {

      let data;

      return Folder.findOne()
        .then(_data => {
          data = _data;
          return chai.request(app)
            .get(`/api/folders/${data.id}`)
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
        .get(`/api/folders/${badId}`)
        .then(function (res) {
          expect(res).be.json;
          expect(res).to.have.status(400);
          expect(res.body).to.be.an('object');
          expect(res.body.message).to.deep.include('The `id` is not valid');
        });
    });
  });


  // ====*****====  Test for POST a Tag ====*****====  \\
  describe('POST folder', function () {
    it('should create a new folder', function () {

      let newFolder = {
        'name': 'School',
      };
      let res;

      return chai.request(app)
        .post('/api/folders')
        .send(newFolder)
        .then(function (_res) {
          res = _res;
          expect(res).to.have.status(201);
          expect(res).to.be.json;

          expect(res.body).to.be.an('object');
          expect(res.body).to.include.keys('id', 'name', 'createdAt', 'updatedAt');

          return Folder.findById(res.body.id);
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
        .post('/api/folders')
        .send(badItem)
        .then(function (res) {
          expect(res).to.be.json;
          expect(res).to.have.status(400);
          expect(res.body).to.be.an('object');
          expect(res.body.message).to.equal('Missing `name` in request body');
        });
    });

    it('should return 400 error and message if folder already exists', function () {

      return Folder.findOne()
        .then(res => {
          const duplicateFolder = { 'name': res.name };
          return chai.request(app)
            .post('/api/folders/')
            .send(duplicateFolder);
        })
        .then(function (res) {
          expect(res).be.json;
          expect(res).to.have.status(400);
          expect(res.body).to.be.an('object');
          expect(res.body.message).to.equal('That folder already exists');
        });
    });
  });


  // ====*****====  Test for PUT Tag by Id ====*****====  \\
  describe('PUT folder', function () {
    it('should update folder with new data', function () {

      const updateFolder = {
        name: 'Felines',
      };
      let res;
      return Folder
        .findOne()
        .then(function (folder) {
          updateFolder.id = folder.id;
          updateFolder.createdAt = folder.createdAt;
          updateFolder.updatedAt = folder.updatedAt;

          return chai.request(app)
            .put(`/api/folders/${folder.id}`)
            .send(updateFolder);
        })
        .then(function (_res) {
          res = _res;
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.an('object');
          expect(res.body).to.include.keys('id', 'name', 'createdAt', 'updatedAt');
          expect(res.body.id).to.equal(updateFolder.id);
          expect(res.body.name).to.equal(updateFolder.name);
          expect(res.body.content).to.equal(updateFolder.content);
          expect(new Date(res.body.createdAt)).to.eql(updateFolder.createdAt);
          expect(new Date(res.body.updatedAt)).to.greaterThan(updateFolder.updatedAt);
        });
    });

    it('should return 400 error and message when no name is provided', function () {
      const badItem = { name: '' };
      return Folder
        .findOne()
        .then(function (folder) {
          badItem.id = folder.id;
          return chai.request(app)
            .put(`/api/folders/${badItem.id}`)
            .send(badItem);
        })
        .then(function (res) {
          expect(res).to.be.json;
          expect(res).to.have.status(400);
          expect(res.body).to.be.an('object');
          expect(res.body.message).to.equal('Missing `name` in request body');
        });
    });

    it('should return 400 error on invalid Id', function () {
      let badFolder = {id: '99', name:'anarchy'};
      return chai.request(app)
        .put(`/api/folders/${badFolder.id}`)
        .send(badFolder)
        .then(function (res) {
          expect(res).be.json;
          expect(res).to.have.status(400);
          expect(res.body).to.be.an('object');
          expect(res.body.message).to.equal('The `id` is not valid');
        });
    });

    it('should return 400 error and message if folder already exists', function () {

      let note1, note2;
      return Folder.find().sort({ normalized: 1 })
        .then(res => {
          note1 = res[0];
          note2 = res[1];
          note2.name = note1.name;

          return chai.request(app)
            .put(`/api/folders/${note2.id}`)
            .send(note2);
        })
        .then(function (res) {
          expect(res).be.json;
          expect(res).to.have.status(400);
          expect(res.body).to.be.an('object');
          expect(res.body.message).to.equal('That folder already exists');
        });
    });
  });


  // ====*****====  Test for DELETE Tag ====*****====  \\
  describe('Delete folder', function () {
    it('should delete folder by id', function () {

      let deleteFolderId;
      return Folder
        .findOne()
        .then(function (folder) {
          deleteFolderId = folder.id;

          return chai.request(app)
            .delete(`/api/folders/${deleteFolderId}`);
        })
        .then(function (res) {
          expect(res).to.have.status(204);
          return Folder.findById(deleteFolderId);
        })
        .then(folder => {
          expect(folder).to.be.null;
        });
    });

    it('should remove folder from all notes', function () {

      let deleteFolderId;
      return Promise.all([
        Folder.findOne().then(function (folder) {
          deleteFolderId = folder.id;
          return chai.request(app).delete(`/api/folders/${deleteFolderId}`)
            .then(function (res) {
              expect(res).to.have.status(204);
              return Folder.findById(deleteFolderId);
            })
            .then(folder => {
              expect(folder).to.be.null;
            });
        }),
        chai.request(app).get('/api/notes'),
        Note.find().sort({ updatedAt: 'desc' })
      ])
        .then(([res1, res2, data]) => {
          expect(res2).to.have.status(200);
          expect(res2).to.be.json;
          expect(res2.body).to.be.an('array');
          expect(res2.body).to.have.lengthOf(data.length);

          res2.body.forEach(function (note, i) {
            expect(note).to.be.an('object');
            expect(note).to.include.keys('id', 'title', 'content', 'createdAt', 'updatedAt', 'folderId', 'tags');
            expect(data[i].id).to.equal(note.id);
            expect(data[i].title).to.equal(note.title);
            expect(data[i].content).to.equal(note.content);
            expect(data[i].folderId.toString()).to.equal(note.folderId.toString());
            expect(data[i].createdAt).to.deep.eql(new Date(note.createdAt));
            expect(data[i].updatedAt).to.deep.eql(new Date(note.updatedAt));
            data[i].tags.forEach((tag, j) => {
              expect(tag.toString()).to.eql(note.tags[j].id);
            });
          });
        });
    });

    it('should return 400 error on invalid Id', function () {
      let badId = '99';
      return chai.request(app)
        .get(`/api/folders/${badId}`)
        .then(function (res) {
          expect(res).be.json;
          expect(res).to.have.status(400);
          expect(res.body).to.be.an('object');
          expect(res.body.message).to.deep.include('The `id` is not valid');
        });
    });
  });

});