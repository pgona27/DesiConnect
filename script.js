const loadGoogleMaps = () => {
 const key = window.CONFIG?.GOOGLE_MAPS_API_KEY;
 if (!key) {
   alert("API key not found in config.js");
   return;
 }
 const script = document.createElement("script");
 script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places,geometry&callback=onMapsReady`;
 script.defer = true;
 document.head.appendChild(script);
};
let map, service, markers = [], selectedType = 'restaurant';
let currentLat = null, currentLng = null;
function onMapsReady() {
 window.onload = () => {
   navigator.geolocation.getCurrentPosition(pos => {
     initMap(pos.coords.latitude, pos.coords.longitude);
     searchPlaces();
   }, () => {
     initMap(39.0438, -77.4874); // Ashburn default
     searchPlaces();
   });
 };
 document.getElementById("radiusInput").addEventListener("input", function () {
   document.getElementById("radiusLabel").innerText = `${this.value} miles`;
 });
 document.getElementById("sortSelect").addEventListener("change", searchPlaces);
 document.getElementById("categoryList").addEventListener("click", function (e) {
   if (e.target.closest(".category")) {
     document.querySelectorAll(".category").forEach(cat => cat.classList.remove("active"));
     const selected = e.target.closest(".category");
     selected.classList.add("active");
     selectedType = selected.dataset.type;
     searchPlaces();
   }
 });
}
function initMap(lat, lng) {
 currentLat = lat;
 currentLng = lng;
 const location = new google.maps.LatLng(lat, lng);
 map = new google.maps.Map(document.getElementById("map"), { center: location, zoom: 12 });
 service = new google.maps.places.PlacesService(map);
}
function searchPlaces(customType = null) {
 const locationInput = document.getElementById("locationInput").value;
 const radius = parseInt(document.getElementById("radiusInput").value) * 1609.34;
 const placeType = customType || selectedType;
 const performSearch = (lat, lng) => {
   currentLat = lat;
   currentLng = lng;
   initMap(lat, lng);
   clearMarkers();
   const request = {
     location: new google.maps.LatLng(lat, lng),
     radius: radius,
     type: placeType
   };
   const resultsContainer = document.getElementById("results");
   resultsContainer.innerHTML = "<p>Loading...</p>";
   service.nearbySearch(request, (places, status) => {
     resultsContainer.innerHTML = "<h3>Search Results</h3>";
     if (status === google.maps.places.PlacesServiceStatus.OK && places.length > 0) {
       places.forEach(place => {
         const loc = place.geometry.location;
         loc.distanceFrom = google.maps.geometry.spherical.computeDistanceBetween(
           new google.maps.LatLng(currentLat, currentLng), loc
         );
       });
       const sortOption = document.getElementById("sortSelect").value;
       places.sort((a, b) => {
         if (sortOption === "rating") return (b.rating || 0) - (a.rating || 0);
         return (a.geometry.location.distanceFrom || 0) - (b.geometry.location.distanceFrom || 0);
       });
       places.forEach(place => {
         const card = document.createElement("div");
         card.className = "result-card";
         card.innerHTML = `
<img src="${place.photos ? place.photos[0].getUrl({ maxWidth: 80 }) : 'https://via.placeholder.com/80'}">
<div><strong>${place.name}</strong><br>${place.vicinity}<br>⭐ ${place.rating || 'N/A'}</div>`;
         resultsContainer.appendChild(card);
         const marker = new google.maps.Marker({
           map,
           position: place.geometry.location,
           icon: {
             url: "https://maps.google.com/mapfiles/ms/icons/orange-dot.png",
             scaledSize: new google.maps.Size(40, 40)
           },
           title: place.name
         });
         markers.push(marker);
       });
     } else {
       resultsContainer.innerHTML += "<p>No results found.</p>";
     }
   });
 };
 if (locationInput.trim()) {
   const geocoder = new google.maps.Geocoder();
   geocoder.geocode({ address: locationInput }, (results, status) => {
     if (status === 'OK') {
       const loc = results[0].geometry.location;
       performSearch(loc.lat(), loc.lng());
     } else {
       alert('Location not found');
     }
   });
 } else if (currentLat && currentLng) {
   performSearch(currentLat, currentLng);
 } else {
   navigator.geolocation.getCurrentPosition(pos => {
     performSearch(pos.coords.latitude, pos.coords.longitude);
   }, () => {
     alert("Enable GPS or enter ZIP/City.");
   });
 }
}
function clearMarkers() {
 markers.forEach(marker => marker.setMap(null));
 markers = [];
}
loadGoogleMaps();