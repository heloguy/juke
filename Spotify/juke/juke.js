UPDATE_INTERVAL = 100; // in milliseconds

// Wrapper for async AJAX POST request
// dest: destination URL.
// object: A JSON object.
function ajaxQuery(dest, object, callback) {
    $.post(
        dest,

        object,

        function(data) {
            callback(data);
        // Add this entry to the GUI dynamically.
        },

        "json"
    );
}

function checkForUpdates() {
	setTimeout(function() {
		var jsonObj = {
			"default": 1
		};

		$.ajax({
			url: AJAX_PHP_URL,
			type: "POST",
			data: {
				func: "get_updates", 
				params: jsonObj
			},
			success: function(data) {
				var tracks = data.reason.songs;
				var commands = data.reason.commands;

				// If there are new songs.
				if(tracks.length > 0) {
					for(var i = 0; i < tracks.length; i++) {
						playlist.add(tracks[i].uri);
					}
					
					if(player.track == null) {
						player.play(playlist.get(playlist.data.all().length-1), playlist.data.uri);
					}
				}
		   
				// If there are new commands.
				$.each(commands, function(index, item) {
					if(playlist.data.all().length <= 0) {
						return;
					}
					
					switch(item) {
						// play / pause
						case "play":
							if(player.track == null) {
								player.play(playlist.get(playlist.data.all().length-1), playlist.data.uri);
							}
							else {
								player.playing = !player.playing;
							}
														
							break;
						case "next":
							player.next();
							playlist_index++;
							action_pressed = "next";
							break;
						case "prev":
							// If the playlist has been populated with any tracks.
							playlist_index--;
							player.previous();
							break;
							
						case "volume_down":							
							if(player.volume-.05 >= 0) {
								player.volume = player.volume - .05;
							}
							else {
								player.volume = 0;
							}
							break;
							
						case "volume_up":	
							if(player.volume+.05 <= .99) {
								player.volume = player.volume + .05;
							}
							else {
								player.volume = .99;
							}
							
							break;
					}
				});
			},
			dataType: "json", 
			complete: checkForUpdates
		});
	}, UPDATE_INTERVAL);
}

// Initialize the Spotify objects
var sp = getSpotifyApi(1),
models = sp.require("sp://import/scripts/api/models"),
views = sp.require("sp://import/scripts/api/views"),
ui = sp.require("sp://import/scripts/ui");
player = models.player;
library = models.library;
application = models.application;
playerImage = new views.Player();
playlist = new models.Playlist();
playlist_index = 0;
action_pressed = "";

function trackChangeCallback(event) {
	// Song has ended or user has pressed prev/next...tell the sql database which song is playing now.
	if(event.data.playstate && event.data.curtrack) {
		var jsonObj = {
			"artist": player.track.data.artists[0].name,
			"track": player.track.data.name,
			"uri": player.track.data.uri
		};
		
		$.ajax({
			url: AJAX_PHP_URL,
			type: "POST",
			data: {
				func: "update_now_playing", 
				params: jsonObj
			},
			success: function(data) {
			}
		});
		
		return;
	}
	// User has toggled play or pause...tell sql database what the current player state is.
	else if (event.data.playstate) {
		// unimplemented
	}
	// User has adjusted the volume...tell sql database what the new volume is.
	else if (event.data.volume) {
		// unimplemented
	}
}

$(document).ready(function() {
	// Set up observer for track changes.
	player.observe(models.EVENT.CHANGE, function (event) {
		trackChangeCallback(event);
	}); 
	
    checkForUpdates();
});
