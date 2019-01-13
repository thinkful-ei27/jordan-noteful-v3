'use strict';

const chai = require('chai');
const chaiHttp =  require('chai-http');
const mongoose = require('mongoose');

const app = require('../server');

const { TEST_MONGODB_URI } = require('../config');
const Tag = require('../models/tag');
const { tags } = require('../db/data');

const expect = chai.expect;
chai.use(chaiHttp);

describe('Tags API resource', function() {

  // SET UP AND TEAR DB DOWN BEFORE EVERY TEST
  // Connect to the database before all tests
  before(function() {
    return mongoose.connect(TEST_MONGODB_URI)
      .then(() => mongoose.connection.db.dropDatabase());
  });

  beforeEach(function () {
    return Tag.insertMany(tags);
  });

  afterEach(function () {
    return mongoose.connection.db.dropDatabase();
  });

  after(function () {
    return mongoose.disconnect();
  });
  // END OF BEFORE AND AFTER TEST SETUPS

  // Test for GET all Notes
  describe('GET /tags', function () {
    it('should return all existing tags', function() {

      let res;
      return chai.request(app)
        .get('/api/tags')
        .then(function(_res) {
          res = _res;
          expect(res).to.have.status(200);
          expect(res.body).to.have.lengthOf.at.least(1);
          return Tag.count();
        })
        .then(function(count) {
          expect(res.body).to.have.lengthOf(count);
        });
    });
    it('should return tags with correct files', function() {

      let resTag;
      return chai.request(app)
        .get('/api/tags')
        .then(function(res) {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.an('array');
          expect(res.body).to.have.lengthOf.at.least(1);

          res.body.forEach(function(tag) {
            expect(tag).to.be.an('object');
            expect(tag).to.include.keys('id', 'name', 'createdAt', 'updatedAt');
          });
          resTag = res.body[0];
          return Tag.findById(resTag.id);
        })
        .then(function(tag) {
          expect(resTag.id).to.equal(tag.id);
          expect(resTag.name).to.equal(tag.name);
        });
    });
  });

    

  describe('GET tag by Id', function () {
    it('should return one tag that matches the Id in the Url', function() {

      let data;
      return Tag.findOne()
        .then(_data => {
          data = _data;
          return chai.request(app)
            .get(`/api/tags/${data.id}`)
            .then(function(res) {
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

    it('should return 400 error on invalid Id', function() {
      let badId = '99';
      return chai.request(app)
        .get(`/api/tags/${badId}`)
        .then(function(res) {
          expect(res).be.json;
          expect(res).to.have.status(400);
          expect(res.body).to.be.an('object');
          expect(res.body.message).to.deep.include('The `id` is not valid');
        });
    });
  });

  describe('POST tag', function() {
    it('should create a new tag', function() {

      let newTag = {
        'name': 'School',
      };
      let res;

      return chai.request(app)
        .post('/api/tags')
        .send(newTag)
        .then(function(_res) {
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
    it('should return 400 error and message when no name is provided', function() {
      const badItem = {name: ''};
      return chai.request(app)
        .post('/api/tags')
        .send(badItem)
        .then(function (res) {
          expect(res).to.be.json;
          expect(res).to.have.status(400);
          expect(res.body).to.be.an('object');
          expect(res.body.message).to.deep.include('Missing `name` in request body');
        });
    });
    it('should return 400 error on invalid Id', function() {
      let badId = '99';
      return chai.request(app)
        .get(`/api/tags/${badId}`)
        .then(function(res) {
          expect(res).be.json;
          expect(res).to.have.status(400);
          expect(res.body).to.be.an('object');
          expect(res.body.message).to.deep.include('The `id` is not valid');
        });
    });
  });

  describe('PUT tag', function() {
    it('should update tag with new data', function() {

      const updateTag = {
        name: 'Felines',

      };
      let res;
      
      return Tag.findOne()
        .then(function(tag) {
          updateTag.id = tag.id;
          updateTag.createdAt = tag.createdAt;
          updateTag.updatedAt = tag.updatedAt;
        
          return chai.request(app)
            .put(`/api/tags/${updateTag.id}`)
            .send(updateTag);
        })
        .then(function(_res) {
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

    it('should return 400 error on invalid Id', function() {
      let badId = '99';
      return chai.request(app)
        .get(`/api/tags/${badId}`)
        .then(function(res) {
          expect(res).be.json;
          expect(res).to.have.status(400);
          expect(res.body).to.be.an('object');
          expect(res.body.message).to.deep.include('The `id` is not valid');
        });
    });
  });

  describe('Delete tag', function() {
    it('should delete tag by id', function() {

      let deleteTagId;
      return Tag
        .findOne()
        .then(function(tag) {
          deleteTagId = tag.id;
          return chai.request(app)
            .delete(`/api/tags/${deleteTagId}`);
        })
        .then(function(res) {
          expect(res).to.have.status(204);
          return Tag.findById(deleteTagId);
        })
        .then(tag => {
          expect(tag).to.be.null;
        });
    });

    it('should return 400 error on invalid Id', function() {
      let badId = '99';
      return chai.request(app)
        .get(`/api/tags/${badId}`)
        .then(function(res) {
          expect(res).be.json;
          expect(res).to.have.status(400);
          expect(res.body).to.be.an('object');
          expect(res.body.message).to.deep.include('The `id` is not valid');
        });
    });
  });

});