/* global google */
/* global _ */
/**
 * scripts.js
 *
 * Computer Science 50
 * Problem Set 8
 *
 * Global JavaScript.
 */

// Google Map
var map;

// markers for map
var markers = [];

// info window
var info = new google.maps.InfoWindow();

// execute when the DOM is fully loaded
$(function() {

    // styles for map
    // https://developers.google.com/maps/documentation/javascript/styling
    var styles = [

        // hide Google's labels
        {
            featureType: "all",
            elementType: "labels",
            stylers: [
                {visibility: "off"}
            ]
        },

        // hide roads
        {
            featureType: "road",
            elementType: "geometry",
            stylers: [
                {visibility: "off"}
            ]
        }

    ];

    // options for map
    // https://developers.google.com/maps/documentation/javascript/reference#MapOptions
    var options = {
        center: {lat: 39.4236, lng: -90.9619}, // Stanford, California
        disableDefaultUI: true,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        maxZoom: 14,
        panControl: true,
        styles: styles,
        zoom: 13,
        zoomControl: true
    };

    // get DOM node in which map will be instantiated
    var canvas = $("#map-canvas").get(0);

    // instantiate map
    map = new google.maps.Map(canvas, options);

    // configure UI once Google Map is idle (i.e., loaded)
    google.maps.event.addListenerOnce(map, "idle", configure);

});

/**
 * Adds marker for place to map.
 */
function addMarker(place)
{
    
    // create marker object that will be our info box's on the map
    var marker = new MarkerWithLabel({
	icon: "http://maps.google.com/mapfiles/kml/pal2/icon31.png",	
	position: new google.maps.LatLng(place.latitude, place.longitude),
	map: map,
	labelContent: place.place_name + ", " + place.admin_name1 
		      + ", " + place.postal_code,
	labelAnchor: new google.maps.Point(20, 0),
	labelClass: "label"
    });

    // add event listener for a user's click
    google.maps.event.addListener(marker, "click", function() {
	showInfo(marker);
	$.getJSON("articles.php", {
	    geo: place.postal_code
	})
	.done(function(data, textStatus, jqXHR) 
	{
	    // if there is no news, tell user no news
	    if (data.length === 0)
	    {
		showInfo(marker, "No News is good news.");
	    }
	    // else if there is news, displays news in unordered list
	    else
	    {
		// start unordered list
		var ul = "<ul>";	

		// create template
		var template = _.template("<li><a href = '<%- link %>' target = '_blank'><%- title %></a></li>");
		
		// use template to insert content
		for (var i = 0, n = data.length; i < n; i++)
		{
		   
		    ul += template({
			link: data[i].link,
			title: data[i].title
		    }); 
		}

		// end unordered list
		ul += "</ul>";	
		
		// show news
		showInfo(marker, ul);
	    }
	});
    });

    // add marker to global variable markers
    markers.push(marker);
}

/**
 * Configures application.
 */
function configure()
{
    // update UI after map has been dragged
    google.maps.event.addListener(map, "dragend", function() {
        update();
    });

    // update UI after zoom level changes
    google.maps.event.addListener(map, "zoom_changed", function() {
        update();
    });

    // remove markers whilst dragging
    google.maps.event.addListener(map, "dragstart", function() {
        removeMarkers();
    });

    // configure typeahead The Twitter JS 
    // https://github.com/twitter/typeahead.js/blob/master/doc/jquery_typeahead.md
    $("#q").typeahead({
        autoselect: true,
        highlight: true,
        minLength: 1
    },
    {
        //the source of automatically populated search query, probably that US.txt
        source: search,
        templates: {
            empty: "no results yet",
            /*The _.template compiles js templates into funcs that can be rendered.
            Interprest JSON info. <&= ..%> can insert js. i.e 
            "var compiled = _.template("hello: <%= name %>");
            compiled({name: 'joe'});
            => "hello: joe"*
            var template = _.template("<b><%- value %></b>");
            template({value: '<script>'});
            => "<b>&lt;script&gt;</b>"
            
            You can also use print from within JavaScript code. This is sometimes more convenient than using <%= ... %>.
            
            var compiled = _.template("<% print('Hello ' + epithet); %>");
            compiled({epithet: "stooge"});
            => "Hello stooge"*/
            suggestion: _.template("<p><%- place_name %>, <%- admin_name1 %></p>")
        }
    });

    // re-center map after place is selected from drop-down
    $("#q").on("typeahead:selected", function(eventObject, suggestion, name) {

        // ensure coordinates are numbers
        var latitude = (_.isNumber(suggestion.latitude)) ? suggestion.latitude : parseFloat(suggestion.latitude);
        var longitude = (_.isNumber(suggestion.longitude)) ? suggestion.longitude : parseFloat(suggestion.longitude);

        // set map's center
        map.setCenter({lat: latitude, lng: longitude});

        // update UI
        update();
    });

    // hide info window when text box has focus
    $("#q").focus(function(eventData) {
        hideInfo();
    });

    // re-enable ctrl- and right-clicking (and thus Inspect Element) on Google Map
    // https://chrome.google.com/webstore/detail/allow-right-click/hompjdfbfmmmgflfjdlnkohcplmboaeo?hl=en
    document.addEventListener("contextmenu", function(event) {
        event.returnValue = true; 
        event.stopPropagation && event.stopPropagation(); 
        event.cancelBubble && event.cancelBubble();
    }, true);

    // update UI
    update();

    // give focus to text box
    $("#q").focus();
}

/**
 * Hides info window.
 */
function hideInfo()
{
    info.close();
}

/**
 * Removes markers from map.
 */
function removeMarkers()
{
     // remove marker from markers
    for (var i = 0, ml = markers.length; i < ml; i++)
    {
	markers[i].setMap(null);
    }

    //set length to 0
    markers.length = 0;
}

/**
 * Searches database for typeahead's suggestions.
 */
function search(query, cb)
{
    // this locates places that match query. Feeding into param's
    //our places, zip, whatever matches in geo that was queried. 
    var parameters = {
        geo: query
    };
    $.getJSON("search.php", parameters)
    //when page ready call this function
    //The jqXHR (jQuery XMLHttpRequest) replaces the browser 
    //native XMLHttpRequest object
    //jqXHR is an object with a promise interface
    //for XML/Http requests. 
    .done(function(places, textStatus, jqXHR) {

        // typeheads callback with search results. Places, zip, etc.
        cb(places);
    })
    //in case of an error
    .fail(function(jqXHR, textStatus, errorThrown) {

        // show if error.
        console.log("Error");
    });
}

/**
 * Shows info window at marker with content.
 */
function showInfo(marker, content)
{
    // start div
    var div = "<div id='info'>";
    if (typeof(content) === "undefined")
    {
        // http://www.ajaxload.info/
        div += "<img alt='loading' src='img/ajax-loader.gif'/>";
    }
    else
    {
        div += content;
    }

    // end div
    div += "</div>";

    // set info window's content
    info.setContent(div);

    // open info window (if not already open)
    info.open(map, marker);
}

/**
 * Updates UI's markers.
 */
function update() 
{
    // get map's bounds
    var bounds = map.getBounds();
    var ne = bounds.getNorthEast();
    var sw = bounds.getSouthWest();

    // get places within bounds (asynchronously)
    var parameters = {
        ne: ne.lat() + "," + ne.lng(),
        q: $("#q").val(),
        sw: sw.lat() + "," + sw.lng()
    };
    $.getJSON("update.php", parameters)
    .done(function(data, textStatus, jqXHR) {

        // remove old markers from map
        removeMarkers();

        // add new markers to map
        for (var i = 0; i < data.length; i++)
        {
            addMarker(data[i]);
        }
     })
     .fail(function(jqXHR, textStatus, errorThrown) {

         // log error to browser's console
         console.log(errorThrown.toString());
     });
}