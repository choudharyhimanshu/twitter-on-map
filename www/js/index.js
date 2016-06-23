/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

var API_BASE_PROFILE = "http://crawl-twitter.herokuapp.com/crawl/profile/";
var API_BASE_TWEETS = "http://crawl-twitter.herokuapp.com/crawl/tweets/";

var map;
var curr_location;
var curr_zoom=1;
var count_markers;

var app = {
    // Application Constructor
    initialize: function() {
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        navigator.geolocation.getCurrentPosition(onGeoSuccess, onGeoError,{ timeout: 1000 });
    }
};

function onGeoSuccess(position) {
    curr_location = new plugin.google.maps.LatLng(position.coords.latitude,position.coords.longitude);
    initMap();
};

// onError Callback receives a PositionError object
//
function onGeoError(error) {
    curr_location = new plugin.google.maps.LatLng(28.613812,77.232712);
    initMap();
};

function initMap(){
    // Define a div tag with id="map_canvas"

    var mapDiv = document.getElementById("map_canvas");

    // Initialize the map plugin
    map = plugin.google.maps.Map.getMap(mapDiv);

    // You have to wait the MAP_READY event.
    map.on(plugin.google.maps.event.MAP_READY, onMapReady);
}

function onMapReady() {
    map.setCenter(curr_location);
    map.setZoom(1);
    map.setMapTypeId(plugin.google.maps.MapTypeId.HYBRID);
    map.setMyLocationEnabled(false);
    map.setAllGesturesEnabled(true);
    map.setOptions({
        'controls': {
            'compass': true,
            'myLocationButton': true,
            'indoorPicker': false,
            'zoom': false // Only for Android
        }
    });

    curr_zoom=1;
    $('#zoomButtons').show();

    $('#searchBtn').click(function(){
        var handle = $("#handle").val();
        var type = $("#fetch_type").val();
        if(typeof handle != undefined && handle != "" && handle.length>0){
            count_markers=0;
            if(type == "tweets"){
                map.clear();
                var options = { dimBackground: true };
                SpinnerPlugin.activityStart("Loading...", options);
                $.getJSON(API_BASE_TWEETS+handle,function(response){
                    if(response.success == true){
                        if(response.data.length>0){
                            var data_array = [];
                            for(var i=0; i<response.data.length; i++){
                                if(response.data[i].geo){
                                    var data = {
                                        'title': response.data[i].user.name+' @'+response.data[i].user.handle,
                                        'snippet': response.data[i].text+'\n'+response.data[i].created_at,
                                        'icon': response.data[i].user.photo
                                    };
                                    addMarkerWithGeo(response.data[i].geo,data);
                                }
                                else if(response.data[i].place && response.data[i].place != ""){
                                    data_array.push({
                                        'title': response.data[i].user.name+' @'+response.data[i].user.handle,
                                        'snippet': response.data[i].text+'\n'+response.data[i].created_at,
                                        'icon': response.data[i].user.photo,
                                        'place': response.data[i].place
                                    });
                                }
                            }
                            addMultiMarkerWithPlaceAsync(data_array,0);
                        }
                        else {
                            alert("No tweets found");
                        }
                    }
                    else {
                        alert("Some error occurred. ERROR: "+response.message);
                    }
                    SpinnerPlugin.activityStop();
                }).error(function(response){
                    alert(JSON.stringify(response));
                    SpinnerPlugin.activityStop();
                });
            }
            else {
                map.clear();
                var options = { dimBackground: true };
                SpinnerPlugin.activityStart("Loading...", options);
                $.getJSON(API_BASE_PROFILE+handle,function(response){
                    if(response.success == true){
                        if(type == "followers"){
                            var data = response.data.followers;
                        }
                        else {
                            var data = response.data.following;
                        }
                        if(data.length>0){
                            var data_array = [];
                            for(var i=0; i<data.length; i++){
                                if(data[i].location != ""){
                                    data_array.push({
                                        'title': data[i].name+' @'+data[i].handle,
                                        'snippet': data[i].description,
                                        'icon': data[i].photo,
                                        'place': data[i].location
                                    });
                                }
                            }
                            addMultiMarkerWithPlaceAsync(data_array,0);
                        }
                        else {
                            alert("No users found");
                        }
                    }
                    else {
                        alert("Some error occurred. ERROR: "+response.message);
                    }
                    SpinnerPlugin.activityStop();
                }).error(function(response){
                    alert(JSON.stringify(response));
                    SpinnerPlugin.activityStop();
                });

            }
        }
        else {
            alert("Please enter username");
        }
    });
}

function incrementZoom(value){
    if((value<0 && curr_zoom>2) || (value>0 && curr_zoom<19)){
        curr_zoom+=value;
        map.setZoom(curr_zoom);
    }    
}

function addMarkerWithPlace(place,data){
    plugin.google.maps.Geocoder.geocode({'address': place}, function(results) {
        if (results.length) {
            var result = results[0];
            result.position.lat += (Math.random()/1000);
            result.position.lng += (Math.random()/1000);
            map.addMarker({
                'position': result.position,
                'title': data.title,
                'snippet': data.snippet,
                'icon': {
                    'url': data.icon,
                    'size': {
                        'width': 40,
                        'height': 40
                    }
                },
                'animation': plugin.google.maps.Animation.DROP,
                'markerClick': function(marker) {
                    marker.showInfoWindow();
                    map.animateCamera({
                        'target': marker.get('position'),
                        'duration': 1000,
                        'zoom': 13
                    });
                    curr_zoom=13;
                },
                'infoClick': function(marker) {
                    // do something
                }
            });
            count_markers++;
            $('#resultsCount').html(count_markers);
        }
    });
}

function addMultiMarkerWithPlaceAsync(dataArray,index){
    if(index < dataArray.length){
        plugin.google.maps.Geocoder.geocode({'address': dataArray[index].place}, function(results) {
            if (results.length) {
                var result = results[0];
                result.position.lat += (Math.random()/1000);
                result.position.lng += (Math.random()/1000);
                map.addMarker({
                    'position': result.position,
                    'title': dataArray[index].title,
                    'snippet': dataArray[index].snippet,
                    'icon': {
                        'url': dataArray[index].icon,
                        'size': {
                            'width': 40,
                            'height': 40
                        }
                    },
                    'animation': plugin.google.maps.Animation.DROP,
                    'markerClick': function(marker) {
                        marker.showInfoWindow();
                        map.animateCamera({
                            'target': marker.get('position'),
                            'duration': 1000,
                            'zoom': 13
                        });
                        curr_zoom=13;
                    },
                    'infoClick': function(marker) {
                        // do something
                    }
                });
                count_markers++;
                $('#resultsCount').html(count_markers);
            }
            addMultiMarkerWithPlaceAsync(dataArray,index+1);
        });
    }
}

function addMarkerWithGeo(geo,data){
    map.addMarker({
        'position': new plugin.google.maps.LatLng(geo.lat,geo.lng),
        'title': data.title,
        'snippet': data.snippet,
        'icon': {
            'url': data.icon,
            'size': {
                'width': 40,
                'height': 40
            }
        },
        'animation': plugin.google.maps.Animation.DROP,
        'markerClick': function(marker) {
            marker.showInfoWindow();
            map.animateCamera({
                'target': marker.get('position'),
                'duration': 1000,
                'zoom': 13
            });
            curr_zoom=13;
        },
        'infoClick': function(marker) {
            // do something
        }
    });
    count_markers++;
    $('#resultsCount').html(count_markers);
}

app.initialize();