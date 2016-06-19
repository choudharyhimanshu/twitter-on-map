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
        navigator.geolocation.getCurrentPosition(onGeoSuccess, onGeoError);
    }
};

var onGeoSuccess = function(position) {
    curr_location = new plugin.google.maps.LatLng(position.coords.latitude,position.coords.longitude);
    initMap();
};

// onError Callback receives a PositionError object
//
function onGeoError(error) {
    curr_location = new plugin.google.maps.LatLng(28.613812,77.232712);
    initMap();
}

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
    map.setZoom(15);
    map.setMapTypeId(plugin.google.maps.MapTypeId.ROADMAP);
    map.setMyLocationEnabled(true);

    $('#searchBtn').click(function(){
        var handle = $("#handle").val();
        var type = $("#fetch_type").val();
        if(typeof handle != undefined && handle != "" && handle.length>0){
            if(type == "tweets"){
                map.clear();
                var options = { dimBackground: true };
                SpinnerPlugin.activityStart("Loading...", options);
                $.getJSON(API_BASE_TWEETS+handle,function(response){
                    if(response.success == true){
                        if(response.data.length>0){
                            var count=0;
                            for(var i=0; i<response.data.length; i++){
                                if(response.data[i].geo){
                                    map.addMarker({
                                        'position': new plugin.google.maps.LatLng(response.data[i].geo.lat,response.data[i].geo.lng),
                                        'title': response.data[i].user.name + ' @' + response.data[i].user.handle,
                                        'snippet': response.data[i].text + '\n' + response.data[i].created_at,
                                        'icon': {
                                            'url': response.data[i].user.photo,
                                            'size': {
                                                'width': 40,
                                                'height': 40
                                            }
                                        },
                                        'animation': plugin.google.maps.Animation.DROP,
                                        'markerClick': function(marker) {
                                            marker.showInfoWindow();
                                        },
                                        'infoClick': function(marker) {
                                            // do something
                                        }
                                    });
                                    count++;
                                }
                            }
                            if(count==0){
                                alert("No location tagged tweets found.");
                            }
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
            if(type == "followers"){
                alert("Yet to be implemented.");
            }
            if(type == "following"){
                alert("Yet to be implemented.");
            }
        }
        else {
            alert("Please enter username");
        }
    });
}

app.initialize();