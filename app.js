
/**
 * Module dependencies.
 */

var express = require('express');

var app = module.exports = express.createServer(),
    less = require('less'),
    mongoose = require('mongoose'),
    mongoStore = require('connect-mongodb'),
    db,
    Document,
    User,
    Settings = { development: {}, test: {}, production: {} };



app.configure('development', function() {
  app.set('db-uri', 'mongodb://localhost/nodepad-development');
});

app.configure('test', function() {
  app.set('db-uri', 'mongodb://localhost/nodepad-test');
});

app.configure('production', function() {
  app.set('db-uri', 'mongodb://localhost/nodepad-production');
});

db = mongoose.connect(app.set('db-uri'));

app.configure(function() {
  app.set('views', __dirname + '/views');
  app.use(express.favicon());
  app.use(express.bodyParser());
  app.use(express.cookieParser());
  app.use(express.session({ store: mongoStore(app.set('db-uri')), secret: 'topsecret' }));
  app.use(express.logger({ format: '\x1b[1m:method\x1b[0m \x1b[33m:url\x1b[0m :response-time ms' }));
  app.use(express.methodOverride());
  app.use(express.compiler({ src: __dirname + '/public', enable: ['less'] }));
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.Document = Document = require('./models.js').Document(db);
app.User = User = require('./models.js').User(db);

function loadUser(req, res, next) {
  
  //console.info('req.session.user_id',req.session);
  if (req.session.user_id) {
    User.findById(req.session.user_id, function(err, user) {
      if (user) {
        req.currentUser = user;
        next();
      } else {
        res.redirect('/sessions/new');
      }
    });
  } else {
    res.redirect('/sessions/new');
  }
}

// Routes

app.get('/', loadUser, function(req, res) {
 res.redirect('/documents');
});



// :format can be json or html
app.get('/documents.:format?', loadUser, function(req, res) {
  // Some kind of Mongo query/update
    Document.find({ }, [], { sort: ['title', 'descending'] }, function(err, documents) {
     switch (req.params.format) {
      // When json, generate suitable data
      case 'json':
        
        res.send(documents.map(function(d) {
          return d.toObject();
        }));
      break;

      // Else render a database template (this isn't ready yet)
      default:
      
       res.render('documents/index.jade', {
          locals: { documents: documents, currentUser: req.currentUser }
        });
      }
  });
});

app.post('/documents.:format?', loadUser, function(req, res) {
  var d = new Document(req.body.d);
  d.save(function() {
    switch (req.params.format) {
      case 'json':
        res.send(d.toObject());
       break;

       default:
        res.redirect('/documents');
    }
  });
});

app.get('/documents/:id.:format?/edit', loadUser, function(req, res) {
   Document.findOne({ _id: req.params.id }, function(err, d) {
    //if (!d) return next(new NotFound('Document not found'));
    res.render('documents/edit.jade', {
      locals: { d: d, currentUser: req.currentUser }
    });
  });
});

app.get('/documents/new', loadUser, function(req, res) {
  res.render('documents/new.jade', {
    locals: { d: new Document() , currentUser: req.currentUser }
  });
});

// Read document
app.get('/documents/:id.:format?', function(req, res) {

  Document.findOne({ _id: req.params.id }, function(err, d) {
  switch (req.params.format) {
      // When json, generate suitable data
      case 'json':
        
        res.send(d.__doc);
      break;

      // Else render a database template (this isn't ready yet)
      default:
      
       res.render('documents/show.jade', {
         locals: { d: d , currentUser: req.currentUser }
        });
      }
    });
});

// Update document
app.put('/documents/:id.:format?', function(req, res) {
  Document.findOne({ _id: req.params.id }, function(err, d) {
    // Do something with it
    d.title = req.body.d.title;
    d.data = req.body.d.data;

    // Persist the changes
    d.save(function() {
      // Respond according to the request format
      switch (req.params.format) {
        case 'json':
          res.send(d.__doc);
         break;

         default:
          res.redirect('/documents');
      }
    });
  });
});

// Delete document
app.del('/documents/:id.:format?', function(req, res) {
  // Load the document
  Document.findOne({ _id: req.params.id }, function(err, d) {
    // Persist the changes
    d.remove(function() {
      // Respond according to the request format
      switch (req.params.format) {
        case 'json':
          res.send(d.__doc);
         break;

         default:
          res.redirect('/documents');
      }
    });
  });
});

// Users
app.get('/users/new', function(req, res) {
  res.render('users/new.jade', {
    locals: { user: new User() }
  });
});

app.post('/users.:format?', function(req, res) {
  var user = new User(req.body.user);


  function userSaved() {
    switch (req.params.format) {
      case 'json':
        res.send(user.__doc);
      break;

      default:
        req.session.user_id = user.id;
        res.redirect('/documents');
    }
  }

  function userSaveFailed() {
    // TODO: Show error messages
    res.render('users/new.jade', {
      locals: { user: user }
    });
  }

  user.save(userSaved, userSaveFailed);
});

// Sessions
app.get('/sessions/new', function(req, res) {
  res.render('sessions/new.jade', {
    locals: { user: new User() }
  });
});

app.post('/sessions', function(req, res) {
  User.findOne({ email: req.body.user.email }, function(err, user) {
    if (user && user.authenticate(req.body.user.password)) {
      req.session.user_id = user.id;
      res.redirect('/documents');
    } else {
      // TODO: Show error
      res.redirect('/sessions/new');
    }
  }); 
});

app.del('/sessions', loadUser, function(req, res) {
  if (req.session) {
    req.session.destroy(function() {});
  }
  res.redirect('/sessions/new');
});

if (!module.parent) {
  app.listen(3000);
  console.log("Express server listening on port %d, environment: %s", app.address().port, app.settings.env)
}