// jshint esversion:6
(function() {
    "use strict";
    window.addEventListener('load', function() {
        if (api.getCurrentUser()) {
            document.querySelector('#grid').classList.remove('hidden');
            document.querySelector('#signin').classList.add('hidden');
            document.querySelector('#signout').classList.remove('hidden');
            document.querySelector('#addReviewModal').classList.remove('hidden');
            document.querySelector('#friendsTab').classList.remove('hidden');
        }
    });

}());