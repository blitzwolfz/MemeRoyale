import { getProfile } from './dist/db.js';

$(document).ready(async function() {
    // Function to handle the user search
    async function searchUser() {
        // Get the input value from the search bar
        let searchTerm = $('#search-input').val();
    
        // Assuming you have a function called getUserData that returns user data as JSON
        let userData = await getProfile(searchTerm);
    
        // Update the profile information with the retrieved data
        $('.profile-image img').attr('src', userData.profileImage);
        $('.stat-value').eq(0).text(userData.wins);
        $('.stat-value').eq(1).text(userData.losses);
        $('.stat-value').eq(2).text((userData.wins + userData.losses));
        $('.stat-value').eq(3).text((userData.wins / (userData.wins + userData.losses)));
    
        // Toggle the "Sign Up" button based on a boolean value
        let isSignUpEnabled = userData.isSignUpEnabled;
        toggleSignUpButton(isSignUpEnabled);
    }    

    // Function to enable or disable the "Sign Up" button
    function toggleSignUpButton(enabled) {
        if (enabled) {
            $('#signup-button').removeAttr('disabled');
        } else {
            $('#signup-button').attr('disabled', 'disabled');
        }
    }

    // Bind the searchUser function to the click event of the search button
    $('#search-button').click(async function() {
        await searchUser();
    });

    // You can also trigger the search when the user presses Enter in the input field
    $('#search-input').keypress(async function(event) {
        if (event.which === 13) { // Enter key pressed
            await searchUser();
        }
    });

    // Event handler for the "Sign Up" button click
    $('#signup-button').click(function() {
        if ($('#signup-button').prop('disabled')) {
            // Button is disabled, do nothing
            return;
        }

        // Perform signup action here (e.g., send notification)
        alert('Sign up successful!');
    });

    // ...
});
