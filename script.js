$(document).ready(function() {
    function loadDefaultUser() {
      // Load the JSON data from the default-profile.json file
      $.ajax({
        url: './default.json', // Adjust the path to your default profile JSON file
        dataType: 'json',
        success: function(defaultUserData) {
          // Update the profile information with the default data
          console.log(defaultUserData);
          $('.profile-image img').attr('src', defaultUserData.img.replace('webp', 'jpg'));
          $('.stat-value').eq(0).text(defaultUserData.wins);
          $('.stat-value').eq(1).text(defaultUserData.loss);
          $('.stat-value').eq(2).text(defaultUserData.wins + defaultUserData.loss);
          $('.stat-value').eq(3).text(((defaultUserData.wins / (defaultUserData.wins + defaultUserData.loss)) * 100).toFixed(2) + '%');
        },
        error: function(xhr, status, error) {
          console.error('Error loading default JSON:', status, error);
        }
      });
    }
  
    function searchUser() {
      let searchTerm = $('#search-input').val();
  
      $.ajax({
        url: './profiles.json',
        dataType: 'json',
        success: function(data) {
          let userData = data.find(profile => profile._id === searchTerm);
  
          if (userData) {
            console.log(userData);
            $('.profile-image img').attr('src', userData.img.replace('webp', 'jpg'));
            $('.stat-value').eq(0).text(userData.wins);
            $('.stat-value').eq(1).text(userData.loss);
            $('.stat-value').eq(2).text((userData.wins + userData.loss));
            $('.stat-value').eq(3).text(((userData.wins / (userData.wins + userData.loss)) * 100).toFixed(2) + '%');
          } else {
            alert('Profile not found.');
          }
        },
        error: function(xhr, status, error) {
          console.error('Error loading JSON:', status, error);
        }
      });
    }
  
    // Load the default user when the page loads
    loadDefaultUser();
  
    $('#search-button').click(function() {
      searchUser();
    });
  
    $('#search-input').keypress(function(event) {
      if (event.which === 13) {
        searchUser();
      }
    });
  
    $('#signup-button').click(function() {
      if ($('#signup-button').prop('disabled')) {
        return;
      }
      alert('Sign up successful!');
    });
  });
  