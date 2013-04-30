<?php

include("config.const.php");

if (isset($_POST['params']) && isset($_POST['func']))
{	
    $link = connect_db();
    $_SESSION['params'] = $_POST['params'];
    $func = $_POST['func'];
    $params = $_POST['params'];

    echo($func($params));
}
else
{
    echo json_encode(array('returnVal' => "failure", 'reason' => 'Missing parameters'));
}

function connect_db()
{
	// Edit these constants in 'config.const.php' (same directory as this file)
    $link = mysql_connect(MYSQL_HOST, MYSQL_USERNAME, MYSQL_PASSWORD);
    mysql_select_db(MYSQL_DB);
	
    return $link;
}

function get_next_song()
{
    $query = "SELECT * FROM playlist WHERE is_new = 1 ORDER BY id ASC";
    $result = mysql_query($query);

    $songs = array();
    while ($row = mysql_fetch_object($result))
    {
        $song = array("track" => $row->track, "artist" => $row->artist, "uri" => $row->uri);
        array_push($songs, $song);

        $id = $row->id;

        $query = "UPDATE playlist SET is_new = 0 WHERE id = $id";
        mysql_query($query);
    }

    return $songs;
}

function get_next_command()
{
    $query = "SELECT * FROM command ORDER BY id ASC";
    $result = mysql_query($query);

    $commands = array();

    while ($row = mysql_fetch_object($result))
    {
        array_push($commands, $row->command);
        $id = $row->id;
        $query = "DELETE FROM command WHERE id = $id";
        mysql_query($query);
    }

    return $commands;
}

function get_updates($params)
{
    $songs = get_next_song();
    $commands = get_next_command();
    return json_encode(array('returnVal' => "success", "reason" => array("songs" => $songs, "commands" => $commands)));
}

function add_song($params)
{
    $track = urlencode($params['track']);
    $artist = urlencode($params['artist']);
    $uri = $params['uri'];

    $query = "INSERT INTO playlist (track, artist, uri, is_new) VALUES ('$track', '$artist', '$uri', 1)";
    mysql_query($query);

    return json_encode(array('returnVal' => "success", "reason" => ""));
}

function add_command($params)
{
    $command = $params['command'];

    $query = "INSERT INTO command (command) VALUES ('$command')";
    $test = mysql_query($query);

    return json_encode(array('returnVal' => "success", "reason" => $test));
}

function update_now_playing($params)
{
    $artist = $params['artist'];
    $track = $params['track'];
    $uri = $params['uri'];

    $query = "DELETE FROM now_playing WHERE 1";
    mysql_query($query);

    $query = "INSERT INTO now_playing (artist, track, uri) VALUES ('$artist', '$track', '$uri')";
    mysql_query($query);

    return json_encode(array('returnVal' => "success", "reason" => ""));
}

function search($params)
{
    $type = $params['type'];
    $query = $params['query'];

    $json_url = "http://ws.spotify.com/search/1/$type.json?q=$query";
    // Initializing curl
    $ch = curl_init($json_url);

    // Configuring curl options
    $options = array(
        CURLOPT_RETURNTRANSFER => true,
    );

    // Setting curl options
    curl_setopt_array($ch, $options);

    // Getting results
    $result = curl_exec($ch); // Getting jSON result string
    return json_encode(array('returnVal' => "success", "reason" => json_decode($result)));
}

function get_playlist($params)
{
    $query = "SELECT * FROM now_playing LIMIT 1";

    $result = mysql_query($query);
    $row = mysql_fetch_object($result);
    $now_playing = array("artist" => $row->artist, "track" => $row->track, "uri" => $row->uri);

    $query = "SELECT * FROM playlist ORDER BY id DESC LIMIT 10";
    $result = mysql_query($query);

    $songs = array();

    while ($row = mysql_fetch_object($result))
    {
        $this_song = array();
        $track = $row->track;
        $artist = $row->artist;

        if ($track === "")
        {
            $json_url = "http://ws.spotify.com/lookup/1/.json?uri=$row->uri";

            // Initializing curl
            $ch = curl_init($json_url);

            // Configuring curl options
            $options = array(
                CURLOPT_RETURNTRANSFER => true,
            );

            // Setting curl options
            curl_setopt_array($ch, $options);

            // Getting results
            $response = curl_exec($ch); // Getting jSON result string

            $json_obj = json_decode($response);
            $json_obj = $json_obj->track;
            $track = $json_obj->name;
            $json_obj = $json_obj->artists;

            $all_artists = array();
            foreach ($json_obj as $artist_obj)
            {
                array_push($all_artists, $artist_obj->name);
            }

            $artist = implode(", ", $all_artists);
        }

        $this_song = array("track" => $track, "artist" => $artist, "uri" => $row->uri);
        array_push($songs, $this_song);
    }

    $songs = array_reverse($songs);
    $html = "<table>";
    $i = 0;
    $playing_found = false;
    $playing_index = -1;
    
    $div_arr = array();

    foreach ($songs as $song)
    {
        $class = "odd";

        if ($i % 2 == 0)
        {
            $class = "even";
        }

        $prefix = "";

        if ($song["uri"] === $now_playing["uri"])
        {
            $playing_index = $i;
        }

        $track = $song["track"];
        $artist = $song["artist"];
        array_push($div_arr, "<tr style='width: 100%;' class='now_playing_placeholder'><td class='number_playlist'>$prefix" . ($i + 1) . "<td>".urldecode($track)."</td><td>".urldecode($artist)."</td></tr>");

        $i++;
    }
    
    $div_arr[$playing_index] = preg_replace(array("/now_playing_placeholder/"), array("playing_song"), $div_arr[$playing_index]);

    $html .= implode("", $div_arr)."</table>";

    return json_encode(array('returnVal' => "success", "reason" => array("html" => $html, "now_playing" => $now_playing)));
}

?>