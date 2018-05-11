// This example requires the Places library. Include the libraries=places
// parameter when you first load the API. For example:
// <script src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=places">
// jshint esversion:6
var map;
var infowindow;
var markers = [];
var OFFSET = 0;

var currentRestaurantId;
var currentUser = api.getCurrentUser();

function success(pos) {
    var currentLocation;
    infowindow = new google.maps.InfoWindow();

    //if user doesn't allow to use their geolocation, set by default to toronto
    if (pos == 0) {
        currentLocation = { lat: 43.6532, lng: -79.3832 };
    } else {
        currentLocation = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
        };
    }


    map = new google.maps.Map(document.getElementById('map'), {
        center: currentLocation,
        zoom: 14,
        gestureHandling: 'cooperative'
    });

    var userImage = 'media/GoogleMapsMarkers/blue_MarkerU.png';
    var name;
    if (currentUser) {
        name = currentUser;
    } else {
        name = "You";
    }
    var userMarker = new google.maps.Marker({
        map: map,
        title: "User",
        position: currentLocation,
        icon: userImage
    });

    //window will popup if user clicks on a marker
    var userContent = {
        name: name,
    };
    google.maps.event.addListener(userMarker, 'click', function() {
        infowindow.setContent(JSON.stringify(userContent.name));
        infowindow.open(map, this);
    });

    var input = (document.getElementById('pac-input'));
    var searchBox = new google.maps.places.SearchBox((input));

    map.addListener('bounds_changed', function() {
        searchBox.setBounds(map.getBounds());
    });

    document.getElementById("search").addEventListener('click', function() {
        if (input == null || searchBox.getPlaces() == null) {
            return;
        } else {
            deleteMarkers();
            var places = searchBox.getPlaces();
            var userSearch = searchBox.gm_accessors_.places.jd.formattedPrediction;
            var lookUp;
            for (var i = 0; i < userSearch.length; i++) {
                if (userSearch[i] == " ")
                    lookUp += userSearch[i].replace(/\s+/g, "+");
                else
                    lookUp += userSearch[i];
            }
            var parent = document.getElementById("grid");
            parent.innerHTML = '';
            callback(places);
        }
    });

}

function getImages(userSearch) {
    var key = "Ocp-Apim-Subscription-Key";
    var value = "a98be3ff5d114f848c2bf5dbaa044ef6";
    var xhr = new XMLHttpRequest();
    var limit = 0;
    var listOfImages = [];
    xhr.onload = function() {
        if (xhr.status !== 200) console.log("[" + xhr.status + "]" + xhr.responseText, null);
        else JSON.parse(xhr.responseText).value.forEach(function(val) {
            if (limit < 8)
                listOfImages.push(val.thumbnailUrl);
            limit++;
        });
        postImages(listOfImages);
    };
    xhr.open('GET', "https://api.cognitive.microsoft.com/bing/v7.0/images/search?q=" + userSearch + "+food&mkt=en-us HTTP/1.1", true);
    xhr.setRequestHeader(key, value);
    xhr.send();
}

function postImages(listOfImages) {
    var parent = document.getElementById("grid");
    parent.innerHTML = '';

    var elmt = document.createElement('div');
    elmt.className = "row";
    elmt.innerHTML = `
        <div class="column">
            <div class="pic"> <img src=${listOfImages[0]}> </div>
            <div class="pic"> <img src=${listOfImages[1]}> </div>
            <div class="pic"> <img src=${listOfImages[2]}> </div>
            <div class="pic"> <img src=${listOfImages[3]}> </div>
        </div>
        <div class="column">
            <div class="pic"> <img src=${listOfImages[4]}> </div>
            <div class="pic"> <img src=${listOfImages[5]}> </div>
            <div class="pic"> <img src=${listOfImages[6]}> </div>
            <div class="pic"> <img src=${listOfImages[7]}> </div>
        </div>
    `;
    document.getElementById('grid').prepend(elmt);
}

//delete markers
function deleteMarkers() {
    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(null);
    }
    markers = [];
}

function error() {
    var defaultCoords = { lat: 43.6532, lng: -79.3832 };
    success(0);
}

function initMap() {
    navigator.geolocation.getCurrentPosition(success, error);
}


function callback(results) {
    bounds = new google.maps.LatLngBounds();
    for (var i = 0; i < results.length; i++) {
        //create marker on each location found through nearbySearch
        createMarker(results[i], results[i].id);
        bounds.extend(results[i].geometry.location);
    }
    map.fitBounds(bounds);

}

function createMarker(place, restaurantId) {
    document.querySelector('#restaurant_name').innerHTML = "Reviews";
    document.querySelector('#header').classList.add('hidden');
    document.querySelector('#addReview').classList.add('hidden');
    var placeLoc = place.geometry.location;
    var marker;

    OFFSET = 0;
    api.getFriendReviews(restaurantId, OFFSET, function(err, reviews) {
        if (err) {
            marker = new google.maps.Marker({
                map: map,
                position: place.geometry.location
            });
            markers.push(marker);
        } else if (reviews.length > 0 && currentUser != null) {
            marker = new google.maps.Marker({
                map: map,
                position: place.geometry.location,
                icon: 'media/GoogleMapsMarkers/green_MarkerF.png'
            });
            markers.push(marker);
        } else {
            marker = new google.maps.Marker({
                map: map,
                position: place.geometry.location
            });
            markers.push(marker);
        }

        var content = {
            name: place.name,
        };

        //open up infowindow when marker is clicked
        google.maps.event.addListener(marker, 'click', function(event) {
            var geocoder = new google.maps.Geocoder();
            var address;

            geocoder.geocode({
                'latLng': event.latLng
            }, function(results, status) {
                if (status == google.maps.GeocoderStatus.OK) {
                    if (results[0]) {
                        address = results[0].formatted_address;
                        var res = address.split(",");
                        var street = res[0];
                        var zip = res[1] + res[2];
                        var country = res[3];
                        var lat = marker.position.lat();
                        var lng = marker.position.lng();
                        var contentString = `
                        <div id="content">
                            <h6>${place.name}</h6>
                            <div> ${street}</div>
                            <div>${zip}</div>
                            <div>${country}</div>
                            <div> <a href="https://maps.google.com/maps?q=${lat},${lng}" target="_blank"> View on Google Maps </a> </div>
                        </div>
                    `;
                        infowindow.setContent(contentString);
                        infowindow.open(map, marker, contentString);
                    }
                }
            });

            if (currentUser != "") {
                document.querySelector('#restaurant_name').classList.remove('hidden');
                document.querySelector('#pics').classList.remove('hidden');
            }

            // Change name header to current clicked on marker
            document.querySelector('#restaurant_name').innerHTML = content.name;
            currentRestaurantId = place.id;
            // Allow add review and show prev and next btns when click on marker
            if (currentUser) {
                document.querySelector('#addReview').classList.remove('hidden');
                document.querySelector('#header').classList.remove('hidden');
                //get images of what marker user clicks
                getImages(content.name);
            } else {
                document.querySelector('#addReview').classList.add('hidden');
                document.querySelector('#header').classList.add('hidden');
            }
            // Get the reviews for that marker
            api.getReviews(place.id, 0, function(err, reviews) {
                if (err) console.log(err);
                if (reviews) {
                    document.getElementById("allReviews").innerHTML = "";
                    reviews.forEach(insertReview);
                }

                document.querySelector('#next').addEventListener('click', function(e) {
                    e.preventDefault();
                    document.querySelector('#allReviews').innerHTML = "";
                    OFFSET = OFFSET + 5;
                    api.getReviews(currentRestaurantId, OFFSET, function(err, reviews) {
                        if (err) console.log(err);
                        if (reviews.length) {
                            reviews.forEach(insertReview);
                        } else {
                            OFFSET = 0;
                            api.getReviews(currentRestaurantId, OFFSET, function(err, reviews) {
                                if (err) console.log(err);
                                reviews.forEach(insertReview);
                            });
                        }
                    });
                });

                document.querySelector('#previous').addEventListener('click', function(e) {
                    e.preventDefault();
                    document.querySelector('#allReviews').innerHTML = "";
                    OFFSET = OFFSET - 5;
                    api.getReviews(currentRestaurantId, OFFSET, function(err, reviews) {
                        if (err) console.log(err);
                        if (reviews.length) {
                            reviews.forEach(insertReview);
                        } else {
                            OFFSET = 0;
                            api.getReviews(currentRestaurantId, OFFSET, function(err, reviews) {
                                if (err) console.log(err);
                                reviews.forEach(insertReview);
                            });
                        }
                    });
                });
            });
        });

    });
}

function refresh() {
    document.getElementById("allReviews").innerHTML = "";
    api.getReviews(currentRestaurantId, OFFSET, function(err, reviews) {
        if (err) return console.log(err);
        reviews.forEach(insertReview);
    });
}

function insertReview(review) {
    OFFSET = 0;
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
          <img id="likeReview" src="media/like.png" class="icon"/>
          `;
    document.getElementById('allReviews').prepend(elmt);
    elmt.querySelector('#reviewDelete').addEventListener('click', function() {
        api.deleteReview(review._id, function(err, del) {
            if (err) console.log(err);
        });
        //refresh();
        if (review.author == currentUser) {
            elmt.parentNode.removeChild(elmt);
        }
    });

    elmt.querySelector('#likeReview').addEventListener('click', function(e) {
        //like-stat
        api.likeReview(review._id, function(err, likedReview) {
            if (err) console.log(err);
            document.getElementById('numLikes').innerHTML = likedReview;
        });
    });
}



window.addEventListener("load", function() {
    initMap();

    document.querySelector('#review_form').addEventListener('submit', function(e) {
        e.preventDefault();
        var review = document.querySelector("#content").value;
        api.addReview(currentRestaurantId, currentUser, review, function(err, reviews) {
            if (err) console.log(err);
            api.getReviews(currentRestaurantId, 0, function(err, reviews) {
                if (err) console.log(err);
                document.getElementById("allReviews").innerHTML = "";
                reviews.forEach(insertReview);
                document.getElementById('addReviewModal').style.display = "none";
            });
        });
    });
});