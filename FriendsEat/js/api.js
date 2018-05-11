// jshint esversion: 6

var api = (function(){
    var module = {};

    function sendFiles(method, url, data, callback){
        var formdata = new FormData();
        Object.keys(data).forEach(function(key){
            var value = data[key];
            formdata.append(key, value);
        });
        var xhr = new XMLHttpRequest();
        xhr.onload = function() {
            if (xhr.status !== 200) callback("[" + xhr.status + "]" + xhr.responseText, null);
            else callback(null, JSON.parse(xhr.responseText));
        };
        xhr.open(method, url, true);
        xhr.send(formdata);
    }

    function send(method, url, data, callback){
        var xhr = new XMLHttpRequest();
        xhr.onload = function() {
            if (xhr.status !== 200) callback("[" + xhr.status + "]" + xhr.responseText, null);
            else callback(null, JSON.parse(xhr.responseText));
        };
        xhr.open(method, url, true);
        if (!data) xhr.send();
        else{
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.send(JSON.stringify(data));
        }
    }

    module.getCurrentUser = function(){
        var l = document.cookie.split("username=");
        if (l.length > 1) return l[1];
        return null;
    };

    // CREATE

    module.signin = function (username, password, callback){
        send("POST", "/signin/", {username: username, password: password}, callback);
    };

    module.signup = function (username, password, email, city, bio, picture, callback){
        sendFiles("POST", "/signup/", {username: username, password: password, email: email, city: city, bio: bio, picture: picture}, callback);
    };

    module.addReview = function (restaurant_id, author, content, callback){
        send("POST", "/api/reviews/", {author: author, content: content, restaurant_id: restaurant_id}, callback);
    };

    // GET

    module.getReviews = function (restaurant_id, offset, callback){
        send("GET", "/api/reviews/restaurant/" + restaurant_id + "/?offset=" + offset, null, callback);
    };

    module.getUserReviews = function (username, offset, callback){
        send("GET", "/api/reviews/users/" + username + "/?offset=" + offset, null, callback);
    };

    module.getFriendReviews = function (restaurant_id, offset, callback){
        send("GET", "/api/reviews/friends/restaurant/" + restaurant_id + "/?offset=" + offset, null, callback);
    };

    module.getUser = function(username, callback){
        send("GET", "/api/users/" + username + "/", null, callback);
    };

    module.getImage = function(username, callback){
        send("GET", "/api/users/picture/" + username + "/", null, callback);
    };

    module.getFriends = function(username, offset, callback){
        send("GET", "/api/users/friends/" + username + "/?offset=" + offset, null, callback);
    };

    module.getRequests = function(username, offset, callback){
        send("GET", "/api/users/requests/" + username + "/?offset=" + offset, null, callback);
    };

    // UPDATE

    module.likeReview = function(reviewId, callback){
        send("PATCH", "/api/reviews/like/" + reviewId + "/", null, callback);
    };

    module.addFriend = function(username, callback){
        send("PATCH", "/api/users/addFriend/" + username + "/", null, callback);
    };

    module.acceptFriend = function(username, callback){
        send("PATCH", "/api/users/acceptFriend/" + username + "/", null, callback);
    };

    module.rejectFriend = function(username, callback){
        send("PATCH", "/api/users/rejectFriend/" + username + "/", null, callback);
    };

    module.removeFriend = function(username, callback){
        send("PATCH", "/api/users/removeFriend/" + username + "/", null, callback);
    };

    // DELETE

    module.deleteReview = function(reviewId, callback){
        send("DELETE", "/api/reviews/" + reviewId + "/", null, callback);
    };

    module.deleteUser = function(username, callback){
        send("DELETE", "/api/users/delete/" + username + "/", null, callback);
    };



    return module;
})();
