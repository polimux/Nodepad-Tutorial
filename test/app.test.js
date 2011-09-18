
// Run $ expresso

// Force test environment
process.env.NODE_ENV = 'test';

var app = require('../app'),
    assert = require('assert'),
    mongoose = require('mongoose'),
    db = mongoose.connect('mongodb://localhost/nodepad'),
    Document = require('../models.js').Document(db);

function createDocument(title, after) {
  var d = new app.Document({ title: title });
  d.save(function() {
    var lastID = d._id.toHexString();
    after(lastID);
  });
}

module.exports = {
  'POST /documents.json': function(beforeExit) {
    assert.response(app, {
        url: '/documents.json',
        method: 'POST',
        data: JSON.stringify({ d: { title: 'Test' } }),
        headers: { 'Content-Type': 'application/json' }
      }, {
        status: 200,
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
      },

      function(res) {
        var d = JSON.parse(res.body);
        assert.equal('Test', d.title);
      }
    );
  },

  'HTML POST /documents': function(beforeExit) {
    assert.response(app, {
        url: '/documents',
        method: 'POST',
        data: 'd[title]=test',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }, {
        status: 302,
        headers: { 'Content-Type': 'text/html' }
      });
  },

  'GET /documents/id.json': function(beforeExit) {
  },

  'GET /documents.json and delete them all': function(beforeExit) {
    assert.response(app,
      { url: '/documents.json' },
      { status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8' }},
      function(res) {
        var documents = JSON.parse(res.body);
        assert.type(documents, 'object');
        documents.forEach(function(d) {
          Document.findOne({ _id : d._id }, function(err, d) {
            d.remove();
          });
        });
      });
  },

  'GET /': function(beforeExit) {
    assert.response(app,
      { url: '/documents' },
      { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' }},
      function(res) {
        assert.includes(res.body, '<title>Nodepad</title>');
        process.exit();
      });
  }
};
