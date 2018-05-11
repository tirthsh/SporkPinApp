// jshint esversion: 6

const express = require('express');
var sslRedirect = require('heroku-ssl-redirect');
const app = express();

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

var multer = require('multer');
const path = require('path');
var upload = multer({ dest: path.join(__dirname, 'uploads') });

app.use(express.static('FriendsEat'));

const cookie = require('cookie');
const crypto = require('crypto');
const validator = require('validator');


const session = require('express-session');
app.use(session({
    secret: 'please change this secret',
    resave: false,
    saveUninitialized: true,
}));

app.use(sslRedirect());

app.use(function(req, res, next) {
    var cookies = cookie.parse(req.headers.cookie || '');
    req.username = (req.session.username) ? req.session.username : null;
    console.log("HTTP request", req.username, req.method, req.url, req.body);
    next();
});

var isAuthenticated = function(req, res, next) {
    console.log("USERNAME : " + req.username);
    if (!req.username) return res.status(401).end("access denied");
    next();
};

var checkUsername = function(req, res, next) {
    if (!validator.isAlphanumeric(req.body.username)) return res.status(400).end("Please Enter a valid username");
    next();
};

var sanitizeContent = function(req, res, next) {
    req.body.content = validator.escape(req.body.content);
    next();
};

var sanitizeSignUpForm = function(req, res, next) {
    req.body.email = validator.escape(req.body.email);
    req.body.city = validator.escape(req.body.city);
    req.body.bio = validator.escape(req.body.bio);
    next();
};

function generateSalt() {
    return crypto.randomBytes(16).toString('base64');
}

function generateHash(password, salt) {
    var hash = crypto.createHmac('sha512', salt);
    hash.update(password);
    return hash.digest('base64');
}

app.use(function(req, res, next) {
    console.log("HTTP request", req.method, req.url, req.body);
    next();
});

var mongo = require('mongodb');
var MongoClient = require('mongodb').MongoClient;
var url = 'mongodb://junil95:testpass1@ds123534.mlab.com:23534/mydb';


MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    var dbo = db.db("mydb");
    dbo.createCollection("users", function(err, res) {
        if (err) throw err;
        db.close();
    });
});

MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    var dbo = db.db("mydb");
    dbo.createCollection("reviews", function(err, res) {
        if (err) throw err;
        db.close();
    });
});


// Create

// curl -H "Content-Type: application/json" -X POST -d '{"username":"alice","password":"alice"}' -c cookie.txt localhost:3000/signup/
app.post('/signup/', upload.single('picture'), checkUsername, sanitizeSignUpForm, function(req, res, next) {
    var username = req.body.username;
    var password = req.body.password;
    var email = req.body.email;
    var city = req.body.city;
    var bio = req.body.bio;
    var picture = req.file;
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        var dbo = db.db("mydb");
        var query = { _id: username };
        dbo.collection("users").findOne(query, function(err, user) {
            if (err) {
                db.close();
                return res.status(500).end(err);
            }
            if (user) {
                db.close();
                return res.status(409).end(" Username: " + username + " already exists");
            }
            var salt = generateSalt();
            var hash = generateHash(password, salt);
            dbo.collection("users").update(query, { _id: username, hash: hash, salt: salt, email: email, city: city, bio: bio, picture: picture, friends: [], requests: [] }, { upsert: true }, function(err) {
                if (err) return res.status(500).end(err);
                // initialize cookie
                res.setHeader('Set-Cookie', cookie.serialize('username', username, {
                    path: '/',
                    maxAge: 60 * 60 * 24 * 7
                }));
                req.session.username = username;
                db.close();
                return res.json("user " + username + " signed up");
            });
        });
    });
});

// curl -H "Content-Type: application/json" -X POST -d '{"username":"alice","password":"alice"}' -c cookie.txt localhost:3000/signin/
app.post('/signin/', checkUsername, function(req, res, next) {
    var username = req.body.username;
    var password = req.body.password;
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        var dbo = db.db("mydb");
        // retrieve user from the database
        dbo.collection("users").findOne({ _id: username }, function(err, user) {
            if (err) {
                db.close();
                return res.status(500).end(err);
            }
            if (!user) {
                db.close();
                return res.status(401).end(" User does not exist");
            }
            if (user.hash !== generateHash(password, user.salt)) {
                db.close();
                return res.status(401).end(" Incorrect passowrd");
            }
            // initialize cookie
            req.session.username = user._id;
            res.setHeader('Set-Cookie', cookie.serialize('username', username, {
                path: '/',
                maxAge: 60 * 60 * 24 * 7
            }));
            db.close();
            return res.json("user " + username + " signed in");
        });
    });
});

// addReview
app.post('/api/reviews/', sanitizeContent, isAuthenticated, function(req, res, next) {
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        var dbo = db.db("mydb");
        var myobj = { author: req.session.username, content: req.body.content, restaurant_id: req.body.restaurant_id, lastLike: "Be the First!", like: 0 };
        dbo.collection("reviews").insertOne(myobj, function(err, obj) {
            if (err) {
                db.close();
                return res.status(500).end(err);
            }
            db.close();
            return res.json(obj);
        });
    });
});

// GET

// curl -b cookie.txt -c cookie.txt localhost:3000/signout/
app.get('/signout/', function(req, res, next) {
    res.setHeader('Set-Cookie', cookie.serialize('username', '', {
        path: '/',
        maxAge: 60 * 60 * 24 * 7 // 1 week in number of seconds
    }));
    req.session.username = null;
    res.redirect('/');
});

// getReviews
app.get('/api/reviews/restaurant/:restaurant_id/', isAuthenticated, function(req, res, next) {
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        var dbo = db.db("mydb");
        var query = { restaurant_id: req.params.restaurant_id };
        dbo.collection("reviews").find(query).sort({ "$natural": -1 }).toArray(function(err, result) {
            if (err) throw err;
            if (!result) {
                db.close();
                return res.status(404).end("Restaurant id:" + req.params.restaurant_id + " does not exist!");
            }
            db.close();
            return res.json(result.splice(req.query.offset, req.query.offset + 5).reverse());
        });
    });
});

// getFriendsReviews
app.get('/api/reviews/friends/restaurant/:restaurant_id/', isAuthenticated, function(req, res, next) {
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        var dbo = db.db("mydb");
        var query = { _id: req.session.username };
        dbo.collection("users").find(query).toArray(function(err, result){
            if (err) {
                db.close();
                return res.status(500).end(err);
            }
            if (!result){
                db.close();
                return res.status(409).end("Username: '" + req.params.username + "' does not exist");
            }
            var friends = result[0].friends;
            var query2 = { $and: [{ restaurant_id: req.params.restaurant_id }, { author: { $in: friends } }] };
            dbo.collection("reviews").find(query2).sort({ "$natural": -1 }).toArray(function(err, result) {
                if (err) throw err;
                if (!result) {
                    db.close();
                    return res.status(404).end("Restaurant id:" + req.params.restaurant_id + " does not exist!");
                }
                return res.json(result.splice(req.query.offset, req.query.offset + 5).reverse());
            });
        });

    });
});

// getUserReviews
app.get('/api/reviews/users/:username/', isAuthenticated, function(req, res, next) {
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        var dbo = db.db("mydb");
        var query = { author: req.params.username };
        dbo.collection("reviews").find(query).sort({ "$natural": -1 }).toArray(function(err, result) {
            if (err) throw err;
            if (!result) {
                db.close();
                return res.status(404).end("Username:" + req.params.username + " does not exist!");
            }
            db.close();
            return res.json(result.splice(req.query.offset, req.query.offset + 4).reverse());
        });
    });
});

// getUser
app.get('/api/users/:username/', isAuthenticated, function(req, res, next){
    MongoClient.connect(url, function(err, db){
        if (err) throw err;
        var dbo = db.db("mydb");
        //var curr_user = req.session.username;
        var username = req.params.username;
        var query = { _id: username };
        dbo.collection("users").find(query).toArray(function(err, result){
            if (err) {
                db.close();
                return res.status(500).end(err);
            }
            if (!result){
                db.close();
                return res.status(409).end("Username: '" + req.params.username + "' does not exist");
            }
            db.close();
            return res.json(result[0]);
        });
    });
});

// Used to get picture file
app.get('/api/users/picture/:username/', isAuthenticated, function(req, res, next){
    MongoClient.connect(url, function(err, db){
        if (err) throw err;
        var dbo = db.db("mydb");
        //var curr_user = req.session.username;
        var username = req.params.username;
        var query = { _id: username };
        dbo.collection("users").find(query).toArray(function(err, result){
            if (err) {
                db.close();
                return res.status(500).end(err);
            }
            if (!result){
                db.close();
                return res.status(409).end("Username: '" + req.params.username + "' does not exist");
            }
            db.close();
            var item = result[0];
            res.setHeader('Content-Type', item.picture.mimetype);
            res.sendFile(item.picture.path);
        });
    });
});

// getFriends
app.get('/api/users/friends/:username/', isAuthenticated, function(req, res, next){
    MongoClient.connect(url, function(err, db){
        if (err) throw err;
        var dbo = db.db("mydb");
        //var curr_user = req.session.username;
        var username = req.params.username;
        var query = { _id: username };
        dbo.collection("users").find(query).toArray(function(err, result){
            if (err) {
                db.close();
                return res.status(500).end(err);
            }
            if (!result){
                db.close();
                return res.status(409).end("Username: '" + req.params.username + "' does not exist");
            }
            db.close();
            return res.json(result[0].friends.splice(req.query.offset, req.query.offset + 8).reverse());
        });
    });
});

// getRequests
app.get('/api/users/requests/:username/', isAuthenticated, function(req, res, next){
    MongoClient.connect(url, function(err, db){
        if (err) throw err;
        var dbo = db.db("mydb");
        //var curr_user = req.session.username;
        var username = req.params.username;
        var query = { _id: username };
        dbo.collection("users").find(query).toArray(function(err, result){
            if (err) {
                db.close();
                return res.status(500).end(err);
            }
            if (!result){
                db.close();
                return res.status(409).end("Username: '" + req.params.username + "' does not exist");
            }
            if (result[0]._id != req.session.username){
                db.close();
                return res.status(403).end('forbidden');
            }
            db.close();
            return res.json(result[0].requests.splice(req.query.offset, req.query.offset + 8).reverse());
        });
    });
});

// PATCH

// likeReview
app.patch('/api/reviews/like/:reviewId/', isAuthenticated, function(req, res, next){
    MongoClient.connect(url, function(err, db){
        if (err) throw err;
        var dbo = db.db("mydb");
        var o_id = new mongo.ObjectID(req.params.reviewId);
        var myquery = { _id: o_id };
        dbo.collection("reviews").find(myquery).toArray(function(err, review){
            if (err) {
                db.close();
                return res.status(500).end(err);
            }
            if (!review) {
                db.close();
                return res.status(404).end("Review id: '" + req.params.reviewId + "' does not exist");
            }
            dbo.collection("reviews").update({ _id: review[0]._id }, { $inc: { like: 1 } }, function(err, updatedLike){
                if (err) {
                    db.close();
                    return res.status(500).end(err);
                }

                var updated = req.session.username + " and " + (review[0].like) + " others have liked this!";
                dbo.collection("reviews").update({ _id: review[0]._id }, { $set: {lastLike: updated} }, function(err, updatedName){
                    if (err) {
                        db.close();
                        return res.status(500).end(err);
                    }
                    db.close();
                    return res.json(updated);
                });
            });
        });
    });
});

// addFriend
app.patch('/api/users/addFriend/:username/', isAuthenticated, function(req, res, next){
    MongoClient.connect(url, function(err, db){
        if (err) throw err;
        var dbo = db.db("mydb");
        var username = req.params.username;
        dbo.collection("users").findOne({ _id: username }, function(err, user){
            if (err) {
                db.close();
                return res.status(500).end(err);
            }
            if (!user) {
                db.close();
                return res.status(404).end("Username: '" + username + "' does not exist");
            }
            requests = user.requests;
            if(requests.indexOf(req.session.username) != -1){
                db.close();
                return res.status(404).end("Request to: '" + username + "' has already been sent");
            }
            dbo.collection("users").update({ _id: user._id }, { $push: { requests: req.session.username } }, function(err, obj){
                if (err) {
                    db.close();
                    return res.status(500).end(err);
                }
                db.close();
                return res.json(obj);
            });
        });
    });
});

// acceptFriend
app.patch('/api/users/acceptFriend/:username/', isAuthenticated, function(req, res, next){
    MongoClient.connect(url, function(err, db){
        if (err) throw err;
        var dbo = db.db("mydb");
        var username = req.params.username;
        var curr_user = req.session.username;
        dbo.collection("users").update({ _id: username }, { $push: { friends: curr_user } }, function(err2, obj2){
            if (err2) {
                db.close();
                return res.status(500).end(err2);
            }
        });
        dbo.collection("users").update({ _id: curr_user }, { $push: { friends: username } }, function(err2, obj2){
            if (err2) {
                db.close();
                return res.status(500).end(err2);
            }
        });
        dbo.collection("users").update({ _id: curr_user }, { $pull: { requests: username } }, function(err2, obj2){
            if (err2) {
                db.close();
                return res.status(500).end(err2);
            }
            return res.json(obj2);
        });
        db.close();
    });
});

// rejectFriend
app.patch('/api/users/rejectFriend/:username/', isAuthenticated, function(req, res, next){
    MongoClient.connect(url, function(err, db){
        if (err) throw err;
        var dbo = db.db("mydb");
        var username = req.params.username;
        var curr_user = req.session.username;
        dbo.collection("users").update({ _id: curr_user }, { $pull: { requests: username } }, function (err, obj){
            if (err) {
                db.close();
                return res.status(500).end(err);
            }
            return res.json(obj);
        });
        db.close();
    });
});

// deleteFriend
app.patch('/api/users/removeFriend/:username/', isAuthenticated, function(req, res, next){
    MongoClient.connect(url, function(err, db){
        if (err) throw err;
        var dbo = db.db("mydb");
        var username = req.params.username;
        var curr_user = req.session.username;
        dbo.collection("users").update({ _id: username }, { $pull: { friends: curr_user } }, function(err2, obj2){
            if (err2) {
                db.close();
                return res.status(500).end(err2);
            }
        });
        dbo.collection("users").update({ _id: curr_user }, { $pull: { friends: username } }, function(err2, obj2){
            if (err2) {
                db.close();
                return res.status(500).end(err2);
            }
            return res.json(obj2);
        });
        db.close();
    });
});

// Delete

// deleteUser
app.delete('/api/users/delete/:username/', isAuthenticated,  function(req, res, next){
    MongoClient.connect(url, function(err, db) {
        if (err) return res.status(500).end(err);
        var dbo = db.db("mydb");
        var myquery = { _id: req.params.username };
        dbo.collection("users").findOne(myquery, function(err, user){
            if (err){
                db.close();
                return res.status(500).end(err);
            }
            if (user._id !== req.session.username){
                db.close();
                return res.status(403).end("forbidden");
            }
            if (!user) {
                db.close();
                return res.status(404).end("Username: '" + req.params.username + "' does not exist");
            }
            dbo.collection("users").deleteOne({ _id: req.params.username }, function(err, obj) {
                if (err) {
                    db.close();
                    return res.status(500).end(err);
                }
                // "signout"
                res.setHeader('Set-Cookie', cookie.serialize('username', '', {
                    path: '/',
                    maxAge: 60 * 60 * 24 * 7 // 1 week in number of seconds
                }));
                req.session.username = null;
                res.redirect('/');
                db.close();
            });

        })
    });
});



// deleteReview
app.delete('/api/reviews/:id/', isAuthenticated, function(req, res, next) {
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        var dbo = db.db("mydb");
        var o_id = new mongo.ObjectID(req.params.id);
        var myquery = { _id: o_id };
        dbo.collection("reviews").findOne(myquery, function(err, obj) {
            if (err) {
                db.close();
                return res.status(500).end(err);
            }
            if (obj.author !== req.session.username) {
                db.close();
                return res.status(403).end("forbidden");
            }
            if (!obj) {
                db.close();
                return res.status(404).end("Review id: '" + req.params.id + "' does not exist");
            }
            dbo.collection("reviews").deleteOne({ _id: obj._id }, function(err, obj) {
                if (err) {
                    db.close();
                    return res.status(500).end(err);
                }
                db.close();
                return res.json(obj);
            });
        });
    });
});



// const http = require('http');
// const PORT = 3000;
//
// http.createServer(app).listen(PORT, function(err) {
//     if (err) console.log(err);
//     else console.log("HTTP server on http://localhost:%s", PORT);
// });

app.listen(process.env.PORT || 3000, function(){
  console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
});
