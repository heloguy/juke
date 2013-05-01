UPDATE_INTERVAL = 100; // in milliseconds

// Wrapper for async AJAX POST request
// dest: destination URL.
// object: A JSON object.
function ajaxQuery(dest, object, callback) {
    $.post(
        dest,

        object,

        function(data){
            callback(data);
			// Add this entry to the GUI dynamically.
        },

        "json"
        );
}

// Updates now playing with metadata for artist, track, and uri.
function updateNowPlaying(artist, track, uri) {
    $("#now_playing_dialog").html("<table class='even'><tr style='margin: 50px;'><td>"+track+"</td><td>"+artist+"</td></tr></table>");
}

// Send an ajax request that will search spotify for some input and return it.
function search() {
    var jsonObj = {
        "query": $("#search").val().replace(/ /g, "_"),
        "type":  $("#search_type").val()
    };

    ajaxQuery(AJAX_PHP_URL, {
        func: "search", 
        params: jsonObj
    }, 
	
    function(data) {
        $("#results").html("");
        var populate_string = "<table><tr class='header_row'><td></td><td>Track</td><td>Artist</td><td>Album</td><td>Popularity</td></tr>";
        var i = 0;
        var even_or_odd = "even";
            
        if(!data.reason) {
            $("#results").html("Nothing found.");
            return;
        }
            
        $.each(data.reason.tracks, function(track_i, track) {
            var album = track.album.name;
            var href = track.href;
            var track_name = track.name;
            var artists = [];
            var popularity = track.popularity;
                
            $.each(track.artists, function (artist_i, artist) {
                artists.push(artist.name);
            });
                
            even_or_odd = "odd"; // Class for css
                
            artists = artists.join(", ");
			
            if(i % 2 == 0) {
                even_or_odd = "even";
            }
                
            i++;
                
			// Popularity meter
            var pop_width = Math.round(popularity * 100);
                
            var div = "<tr class='music_content'><td><input class='add_button' track_name=\""+track_name+"\" artists=\""+artists+"\" spot_link=\""+href+"\" type='button' value='+'/></td>"+
            "<td>"+track_name+
            "</td><td class='track_info'>"+artists+ 
            "</td><td class='track_info'>"+album+
            "<td><div style='color: cornflowerblue; background-color: cornflowerblue; width:"+pop_width+"%'>&nbsp</div>"+
            "</td></td>"+
            "<tr/>";
            populate_string += div;
        });
            
        $("#results").css("display", "");
        $("#results").html(populate_string+"</table>");
    });
}
    
// Check for updates to song playing so we can adjust the UI.
function checkForUpdates() {
	var jsonObj = {
		"default": 1
	};
	
	setTimeout(function() {
		ajaxQuery(AJAX_PHP_URL, {
			func: "get_playlist",
			params: jsonObj
		}, 
		function(data) {
			$("#now_playing").attr("value", "Refresh Now Playing");
			$("#dialog").html(data.reason.html);
			
			var now_playing = data.reason.now_playing;
			
			updateNowPlaying(now_playing.artist, now_playing.track, now_playing.uri);
			checkForUpdates();
		});

	}, UPDATE_INTERVAL);
}

// Initialize callbacks for UI interaction.
function initUI() {
    $("#search_button").click(function() {
        search();
    });
    
    $("#prev").click(function() {
        var jsonObj = {
            "command": "prev"
        };

        ajaxQuery(AJAX_PHP_URL, {
            func: "add_command", 
            params: jsonObj
        }, 
        function(data)
        {

        });
    });

    $("#play").click(function() {
        var jsonObj = {
            "command": "play"
        };

        ajaxQuery(AJAX_PHP_URL, {
            func: "add_command", 
            params: jsonObj
        }, 
        function(data)
        {

        });
    });

    $("#next").click(function() {
        var jsonObj = {
            "command": "next"
        };

        ajaxQuery(AJAX_PHP_URL, {
            func: "add_command", 
            params: jsonObj
        }, 
        function(data)
        {

        });
    });
    
	// Unsupported in the API: Deprecated.
    $("#volume_down").click(function() {
        var jsonObj = {
            "command": "volume_down"
        };

        // Send an AJAX request to add this song to the database.
        ajaxQuery(AJAX_PHP_URL, {
            func: "add_command", 
            params: jsonObj
        }, 
        function(data)
        {

        });
    });
    // Unsupported in the API: Deprecated.
    $("#volume_up").click(function() {
        var jsonObj = {
            "command": "volume_up"
        };

        // Send an AJAX request to add this song to the database.
        ajaxQuery(AJAX_PHP_URL, {
            func: "add_command", 
            params: jsonObj
        }, 
        function(data)
        {

        });
    });

    $(".add_button").live("click", function() {
        var jsonObj = {
            "uri": $(this).attr("spot_link"),
            "track": $(this).attr("track_name"),
            "artist": $(this).attr("artists")
        };

        // Send an AJAX request to add this song to the database.
        ajaxQuery(AJAX_PHP_URL, {
            func: "add_song", 
            params: jsonObj
        }, 
        function(data)
        {
            
        });
    });
	
	var jsonObj = {
		"default": 1
	};

    ajaxQuery(AJAX_PHP_URL, {
        func: "get_playlist",
        params: jsonObj
    }, 
		function(data) {
			$("#now_playing").attr("value", "Refresh Now Playing");
			$("#dialog").html(data.reason.html);
			$( "#dialog" ).dialog({
				width: 700, 
				title: "Last 10 Songs Added (Old to New)", 
				resizable: false,
				closable: false,
				position: {
					my: "bottom", 
					at: "bottom", 
					of: window
				}
			});
			
			var now_playing = data.reason.now_playing;
					
			updateNowPlaying(now_playing.artist, now_playing.track, now_playing.uri);
		}
	);

    $("#now_playing").live("click", function() {
        var jsonObj = {
            "default": 1
        };

        // Send an AJAX request to add this song to the database.
        ajaxQuery(AJAX_PHP_URL, {
            func: "get_playlist",
            params: jsonObj
        }, 
        function(data) {
            $("#now_playing").attr("value", "Refresh Now Playing");

            $("#dialog").html(data.reason.html);
            $( "#dialog" ).dialog({
                width: 700, 
                title: "Last 10 Songs Added (Old to New)", 
                resizable: false, 
                position: {
                    my: "right bottom", 
                    at: "right bottom", 
                    of: window
                }
            });
            
            var now_playing = data.reason.now_playing;
                
            updateNowPlaying(now_playing.artist, now_playing.track, now_playing.uri);
        });
    });
}

$(document).ready(function() {   
	initUI();
    checkForUpdates();
});