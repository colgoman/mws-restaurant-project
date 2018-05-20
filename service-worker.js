importScripts('/cache-polyfill.js');

// Declare caches
var informationCache = 'restaurants_info_cache';
var imageCache = "restaurants_imgs-cache";

var allCaches = [
    informationCache,
    imageCache
];


self.addEventListener('install', function(e) {
    e.waitUntil(
        caches.open('restaurant-cache').then(function(cache) {
            return cache.addAll([
                '/',
                '/css/styles.css',
                '/js/dbhelper.js',
                '/js/main.js',
                '/js/restaurant_info.js',
                '/img/fireworks-icon192x192.png',
                '/img/512-512_icon.jpg'
            ]);
        })
    );
});

/* activate event */
self.addEventListener('activate', function(event) {

    console.log(event.request.url);

    event.waitUntil(
        // get cache keys
        caches.keys().then(function(cacheKeys){
            return Promise.all(
                // filter through cacheKeys
                cacheKeys.filter(function (cacheKeys) {
                    return cacheKeys.startsWith('restaurants-') && !allCaches.includes(cacheKeys);
                }).map(function(cacheKeys){
                    return caches.delete(cacheKeys);
                })
            );
        })


    );

});


/* fetch Images function */
function fetchImage(request){
    return caches.openIDB(imageCache).then(function(cache){
        return cache.match(request).then(function (response) {
            // check response exists
            if (response) return response;
            
            return fetch(request).then (function (networkResponse) {
                // puth network response into cache
                cache.put(request,networkResponse.clone());
                return networkResponse;
            });
        
        
        });
    });
}



/* fetch event */
self.addEventListener('fetch', function(event) {
    var requestedUrl = new URL(event.request.url);
    //console.log(event.request.url);


    // Fetch restaurant info
    if(requestedUrl.pathname.startsWith('/restaurants/')){
        return;
    }


    // Fetch restaurant images
    if(requestedUrl.pathname.startsWith('/img/')){
        // respond with fetchImage function
        event.respondWith(fetchImage(event.request));
        return;

    }


    event.respondWith(
        caches.open(informationCache).then(function(cache) {
            return cache.match(event.request).then(function (response) {
                return response || fetch(event.request).then(function(response) {
                    cache.put(event.request, response.clone());
                    return response;
                });
            });
        })
    );
});
