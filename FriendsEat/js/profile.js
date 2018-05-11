// jshint esversion: 6
var currUser;
var OFFSET;
function insertReview(review){
  var elmt = document.createElement('div');
    elmt.className = "reviewElm";
    elmt.innerHTML = `
          <div class="profile" id=${review._id}>
              <img src=media/user.png class="icon" />
              <div class="name"> ${review.author} </div>
              <div id="date">03/11/2018</div>
          </div>
          <div class="text"> ${review.content} </div>
          <img src=media/del1.png class="icon" id="reviewDelete" />
          <div class="like-stat">
          <img id="miniLike" src="media/miniLike.png"/>
           <b id="numLikes"> ${review.lastLike}</b>
          </div>
          <img id="likeReview" src="media/like.png" class="icon"/>`;

    if (api.getCurrentUser() != currUser){
      elmt.querySelector('#reviewDelete').classList.add('hidden');
    }else{
      elmt.querySelector('#reviewDelete').addEventListener('click', function() {
        api.deleteReview(review._id, function(err, del) {
          if (err) console.log(err);
        });
        if (review.author == currentUser){
          elmt.parentNode.removeChild(elmt);
        }
      });
    }

    elmt.querySelector('#likeReview').addEventListener('click', function(){
      //like-stat
      api.likeReview(review._id, function(err, likedReview){
        if (err) console.log(err);
        elmt.querySelector('#numLikes').innerHTML = likedReview;
      });
    });
    document.getElementById('reviews').prepend(elmt);
}


function insertFriend(friend){
  var elmt = document.createElement('div');
  elmt.className = "friendElm";
  elmt.innerHTML = `
      <img src="media/user.png" class="profile_pic"/>
      <div class="details">
        <div class="name" id="friendName"> ${friend._id} </div>
        <div class="email"> ${friend.email} </div>
        <div class="city"> ${friend.city} </div>
      </div>
      <img src="media/addFriend.png" class="icon" id="addFriend"/>
      <img src="media/del1.png" class="icon" id="deleteFriend"/>
      `;
  document.getElementById('friends').prepend(elmt);
  if (api.getCurrentUser() != currUser){
    elmt.querySelector('#deleteFriend').classList.add("hidden");
    elmt.querySelector("#addFriend").addEventListener('click', function(e){
      var userName = elmt.querySelector('#friendName').innerHTML;
      api.addFriend(userName, function(err, user){
        if (err) console.log(err);
      });
    });
    elmt.querySelector("#addFriend").classList.add("hidden");
  }else{
    elmt.querySelector("#addFriend").classList.add("hidden");
    elmt.querySelector('#deleteFriend').addEventListener('click', function(){
      api.removeFriend(friend._id, function(err, user){
        if (err) console.log(err);
      });
      elmt.parentNode.removeChild(elmt);
    });
  }

}

function insertRequest(user){
  var elmt = document.createElement('div');
  elmt.className = "requestsElm";
  elmt.innerHTML = `
    <img src="media/user.png" class="profile_pic"/>
    <div class="details">
      <div class="name"> ${user._id} </div>
      <div class="email"> ${user.email} </div>
      <div class="city"> ${user.city} </div>
    </div>
    <div class="actions">
      <img src="media/accept.png" class="icon requestAction" id="acceptRequest"/>
      <img src="media/del1.png" class="icon requestAction" id="declineRequest"/>
    </div>
      `;
  elmt.querySelector("#acceptRequest").addEventListener('click', function(e){
    api.acceptFriend(user._id, function(err, user){
      if (err) console.log(err);
      elmt.parentNode.removeChild(elmt);
    });
  });

  elmt.querySelector("#declineRequest").addEventListener('click', function(e){
    api.rejectFriend(user._id, function(err, user){
      if (err) console.log(err);
      elmt.parentNode.removeChild(elmt);
    });
  });

  document.getElementById('friendRequests').prepend(elmt);
}


window.addEventListener('load', function(){
  if (api.getCurrentUser()) {
    document.querySelector('#signin').classList.add('hidden');
    document.querySelector('#signout').classList.remove('hidden');
    document.querySelector('#followButton').classList.add('hidden');
  }

  currUser = api.getCurrentUser();
  api.getUser(currUser, function(err, user){
    if (err) console.log(err);
    api.getUserReviews(currUser, 0, function(err, reviews){
      if (err) console.log(err);
      document.getElementById('leftside').innerHTML = `
      <div class="photo-left">
        <img class="photo" src="media/user.png"/>
      </div>
      <h4 class="profileName" id="userName">${currUser}</h4>
      <p class="info">${user.city}</p>
      <p class="info">${user.email}</p>
      <div class="stats row">
        <div class="stat col-xs-4" style="padding-right: 50px;">
          <p class="number-stat" id="friendNum">${user.friends.length}</p>
          <p class="desc-stat">Friends</p>
        </div>
        <div class="stat col-xs-4">
          <p class="number-stat" id="reviewNum">${reviews.length}</p>
          <p class="desc-stat">Reviews</p>
        </div>

      </div>
      <p class="desc">${user.bio}</p>
    `;
    });
    api.getUserReviews(currUser, 0, function(err, reviews){
      if (err) console.log(err);
      reviews.forEach(insertReview);
    });

  });
  if (api.getCurrentUser() != currUser) {
    document.querySelector("#followButton").addEventListener('click', function(e){
      var userName = document.querySelector('.profileName').innerHTML;
      api.addFriend(userName, function(err, user){
        if (err) console.log(err);
      });
      document.querySelector('#followButton').classList.add('hidden');
    });
  }

  document.querySelector('#friendsBtn').addEventListener('click', function(e){
    document.querySelector('#friends').classList.remove('hidden');
    document.querySelector('#reviews').classList.add('hidden');
    document.querySelector('#friendRequests').classList.add('hidden');
    document.getElementById('reviewsBtn').style.color = "black";
    document.getElementById('friendsBtn').style.color = "white";
    document.getElementById('requestsBtn').style.color = "black";
    document.getElementById('friends').innerHTML = "";
    api.getFriends(currUser, 0, function(err, friends){
      if (err) console.log(err);
      friends.forEach(function getFriendInfo(friend){
        api.getUser(friend, function (err, user){
          if (err) console.log(err);
          insertFriend(user);
        });
      });

    });

    OFFSET = 0;

    document.querySelector('#next').addEventListener('click', function(e) {
      e.preventDefault();
      document.querySelector('#friends').innerHTML = "";
      OFFSET = OFFSET + 8;
      api.getFriends(currUser, OFFSET, function(err, friends){
        if (err) console.log(err);
        if (friends.length){
          friends.forEach(function getFriendInfo(friend){
            api.getUser(friend, function (err, user){
              if (err) console.log(err);
              insertFriend(user);
            });
          });
        }else{
          OFFSET = 0;
          api.getFriends(currUser, 0, function(err, friends){
            if (err) console.log(err);
            friends.forEach(function getFriendInfo(friend){
              api.getUser(friend, function (err, user){
                if (err) console.log(err);
                insertFriend(user);
              });
            });
          });
        }
      });
    });

  });

  document.querySelector('#reviewsBtn').addEventListener('click', function(e){
    document.querySelector('#friends').classList.add('hidden');
    document.querySelector('#reviews').classList.remove('hidden');
    document.querySelector('#friendRequests').classList.add('hidden');
    document.getElementById('friendsBtn').style.color = "black";
    document.getElementById('reviewsBtn').style.color = "white";
    document.getElementById('requestsBtn').style.color = "black";

    document.getElementById('reviews').innerHTML = "";
    api.getUserReviews(currUser, 0, function(err, reviews){
      if (err) console.log(err);
      reviews.forEach(insertReview);
    });
    OFFSET = 0;

    document.querySelector('#next').addEventListener('click', function(e) {
      e.preventDefault();
      document.querySelector('#reviews').innerHTML = "";
      OFFSET = OFFSET + 4;
      api.getUserReviews(currUser, OFFSET, function(err, reviews) {
          if (err) console.log(err);
          if (reviews.length) {
              reviews.forEach(insertReview);
          } else {
              OFFSET = 0;
              api.getUserReviews(currUser, OFFSET, function(err, reviews) {
                  if (err) console.log(err);
                  reviews.forEach(insertReview);
              });
          }
      });
    });

    document.querySelector('#previous').addEventListener('click', function(e) {
      e.preventDefault();
      document.querySelector('#reviews').innerHTML = "";
      OFFSET = OFFSET - 4;
      api.getUserReviews(currUser, OFFSET, function(err, reviews) {
          if (err) console.log(err);
          if (reviews.length) {
              reviews.forEach(insertReview);
          } else {
              OFFSET = 0;
              api.getUserReviews(currUser, OFFSET, function(err, reviews) {
                  if (err) console.log(err);
                  reviews.forEach(insertReview);
              });
          }
      });
    });

  });

  document.querySelector('#requestsBtn').addEventListener('click', function(e){
    document.querySelector('#friendRequests').classList.remove('hidden');
    document.querySelector('#reviews').classList.add('hidden');
    document.querySelector('#friends').classList.add('hidden');
    document.getElementById('friendsBtn').style.color = "black";
    document.getElementById('reviewsBtn').style.color = "black";
    document.getElementById('requestsBtn').style.color = "white";

    document.getElementById('friendRequests').innerHTML = "";

    api.getRequests(currUser, 0, function(err, requests){
      if (err) console.log(err);
      requests.forEach(function getRequestInfo(request){
        api.getUser(request, function (err, user){
          if (err) console.log(err);
          insertRequest(user);
        });
      });
    });

    OFFSET = 0;

    document.querySelector('#next').addEventListener('click', function(e) {
      e.preventDefault();
      document.querySelector('#friendRequests').innerHTML = "";
      OFFSET = OFFSET + 8;
      api.getRequests(currUser, OFFSET, function(err, requests){
        if (err) console.log(err);
        if (requests.length){
          requests.forEach(function getRequestInfo(request){
            api.getUser(request, function (err, user){
              if (err) console.log(err);
              insertRequest(user);
            });
          });
        }else{
          OFFSET = 0;
          api.getRequests(currUser, OFFSET, function(err, requests){
            if (err) console.log(err);
            requests.forEach(function getRequestInfo(request){
              api.getUser(request, function (err, user){
                if (err) console.log(err);
                insertRequest(user);
              });
            });
          });
        }
      });
    });

    document.querySelector('#previous').addEventListener('click', function(e) {
      e.preventDefault();
      document.querySelector('#friendRequests').innerHTML = "";
      OFFSET = OFFSET - 8;
      api.getRequests(currUser, OFFSET, function(err, requests){
        if (err) console.log(err);
        if (requests.length){
          requests.forEach(function getRequestInfo(request){
            api.getUser(request, function (err, user){
              if (err) console.log(err);
              insertRequest(user);
            });
          });
        }else{
          OFFSET = 0;
          api.getRequests(currUser, OFFSET, function(err, requests){
            if (err) console.log(err);
            requests.forEach(function getRequestInfo(request){
              api.getUser(request, function (err, user){
                if (err) console.log(err);
                insertRequest(user);
              });
            });
          });
        }
      });
    });
  });


  document.querySelector('#searchUserButton').addEventListener('click', function(e){
    e.preventDefault();
    var modal = document.getElementById('searchUserModal');
    modal.style.display = "block";
    modal.style.opacity=1;
    document.querySelector('#findUserButton').addEventListener('click', function(e){
      var username = document.getElementById("searchUser_form").elements.namedItem("username").value;
      api.getUser(username, function(err, user){
        if (err) console.log(err);
        currUser = user._id;
        api.getUserReviews(currUser, 0, function(err, reviews){
          if (err) console.log(err);
          document.getElementById('leftside').innerHTML = `
          <div class="photo-left">
            <img class="photo" src="media/user.png"/>
          </div>
          <h4 class="profileName" id="userName">${user._id}</h4>
          <p class="info">${user.city}</p>
          <p class="info">${user.email}</p>
          <div class="stats row">
            <div class="stat col-xs-4" style="padding-right: 50px;">
              <p class="number-stat">${user.friends.length}</p>
              <p class="desc-stat">Friends</p>
            </div>
            <div class="stat col-xs-4">
              <p class="number-stat">${reviews.length}</p>
              <p class="desc-stat">Reviews</p>
            </div>

          </div>
          <p class="desc">${user.bio}</p>
        `;
        });
        document.querySelector('#reviews').innerHTML = "";
        api.getUserReviews(currUser, 0, function(err, reviews){
          if (err) console.log(err);
          reviews.forEach(insertReview);
        });
      });
    });
    document.querySelector('#requestsBtn').classList.add('hidden');
    document.querySelector('#followButton').classList.remove('hidden');
    document.querySelector('#followButton').addEventListener('click', function(e){
      api.addFriend(currUser, function(err, user){
        if (err) console.log(err);
      });
      document.querySelector('#followButton').classList.add('hidden');
    });

  });

});
