document.querySelector('#signin').addEventListener('click',function(e){
  // Get the modal
  var modal = document.getElementById('signinModal');
  modal.style.display = "block";
  modal.style.opacity=1;


  function signInForm(){
    if (document.querySelector("#login_form").checkValidity()){

        var username = document.getElementById("login_form").elements.namedItem("username").value;
        var password = document.getElementById("login_form").elements.namedItem("password").value;

        api.signin(username, password, function(err, res){
            if (err) document.querySelector('.alert').innerHTML = err;
            else window.location = '/';
        });

    }
}

function signUpForm(){
  if (document.querySelector("#signup_form").checkValidity()){

      var username = document.getElementById("signup_form").elements.namedItem("username").value;
      var password = document.getElementById("signup_form").elements.namedItem("password").value;
      var email = document.getElementById("signup_form").elements.namedItem("email").value;
      var city = document.getElementById("signup_form").elements.namedItem("city").value;
      var bio = document.getElementById("signup_form").elements.namedItem("bio").value;
      var picture = document.getElementById("signup_form").elements.namedItem("picture").files[0];

      api.signup(username, password, email, city, bio, picture, function(err, res){
          if (err) document.querySelector('.alert').innerHTML = err;
          else window.location = '/';
      });

  }
}



  document.querySelector('#signup-button').addEventListener('click', function(e){
    e.preventDefault();
    signUpForm();
  });

  document.querySelector('#signin-button').addEventListener('click', function(e){
    e.preventDefault();
    signInForm();
  });

});

// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
    if (event.target == document.getElementById('signinModal')) {
        document.getElementById('signinModal').style.display = "none";
    }
    if (event.target == document.getElementById('addReviewModal')) {
        document.getElementById('addReviewModal').style.display = "none";
    }
    if (event.target == document.getElementById('searchUserModal')) {
        document.getElementById('searchUserModal').style.display = "none";
    }
};

document.querySelector('#addReview').addEventListener('click',function(e){
  // Get the modal
  var modal = document.getElementById('addReviewModal');
  modal.style.display = "block";
  modal.style.opacity=1;

});

document.querySelector('#signin_toggle').addEventListener('click', function(e){
  document.querySelector('#signup_form').classList.add('hidden');
  document.querySelector('#login_form').classList.remove('hidden');
});

document.querySelector('#signup_toggle').addEventListener('click', function(e){
  document.querySelector('#signup_form').classList.remove('hidden');
  document.querySelector('#login_form').classList.add('hidden');
});
