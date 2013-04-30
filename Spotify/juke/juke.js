AJAX_PHP_URL = "http://10.0.0.4/juke/ajax_anon.php";

// Asynchronous ajax query function using post.
function ajaxQuery(dest, object, callback)
{
    $.post(
        dest,

        object,

        function(data)
        {
            callback(data);
        // Add this entry to the GUI dynamically.
        },

        "json"
    );
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

$(document).ready(function() 
{    
    function checkForUpdates()
    {
        setTimeout(function()
        {
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
                success: function(data)
                {
                    var tracks = data.reason.songs;
                    var commands = data.reason.commands;

					//console.log(tracks);
					//console.log(commands);
					
                    // If there are new songs.
                    if(tracks.length > 0)
                    {
                        // Add new songs to the playlist.
                        for(var i = 0; i < tracks.length; i++)
                        {
                            playlist.add(tracks[i].uri);
                        }
                        
                        if(player.track == null)
                        {
                            player.play(playlist.get(playlist.data.all().length-1), playlist.data.uri);
                        }
                    }
               
                    // For each command.
                    $.each(commands, function(index, item)
                    {
						//console.log(item);
						console.log(player.track);
						
                        console.log(playlist.data.all());
                        if(playlist.data.all().length <= 0)
                        {
                            return;
                        }
						
						console.log(item);
                        
                        switch(item)
                        {
                            // play / pause
                            case "play":
								console.log("playswitch");
                                if(player.track == null)
                                {
                                    player.play(playlist.get(playlist.data.all().length-1), playlist.data.uri);
                                }
                                else
                                {
									console.log("not null");
                                    player.playing = !player.playing;
                                }
								
								player.playing=true;
                                
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
                                console.log("volume_down");
                                console.log(player.volume);
                                
                                if(player.volume-.05 >= 0)
                                {
                                    player.volume = player.volume - .05;
                                }
                                else
                                {
                                    player.volume = 0;
                                }
                                break;
                                
                            case "volume_up":
                                    
                                if(player.volume+.05 <= .99)
                                {
                                    player.volume = player.volume + .05;
                                }
                                else
                                {
                                    player.volume = .99;
                                }
                                
                                break;
                        }
                    });
                },
                dataType: "json", 
                complete: checkForUpdates
            });
        }, 100);
    }
    
    checkForUpdates();

    // When the track changes
    player.observe(models.EVENT.CHANGE, function (event) {
        
        // Song has ended or user has pressed prev/next...tell the sql database which song is playing now.
        if(event.data.playstate && event.data.curtrack)
        {
//            console.log(player.track);
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
                success: function(data)
                {
//                    console.log(data);
                }
            });
            
            return;
        }
        // User has toggled play or pause...tell sql database what the current player state is.
        else if (event.data.playstate)
        {
            
        }
        // User has adjusted the volume...tell sql database what the new volume is.
        else if (event.data.volume)
        {
            console.log(player.volume);
        }
    }); 
});
