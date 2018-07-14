/**
 * Common database helper functions.
 */

// Declare restaurant and review promises
const restaurantPromise = idb.open('restaurant_IDB' , 1  , function(upgradeDb) {
    upgradeDb.createObjectStore('restaurants' ,{keyPath: 'id'})});

const reviewPromise = idb.open('review_IDB' , 1  , function(upgradeDb) {
    upgradeDb.createObjectStore('reviews', {keyPath: 'id'})});

// Declare offline promise
const offlinePromise = idb.open('offline_IDB' , 1  , function(upgradeDb) {
    upgradeDb.createObjectStore('offline')});

// Declare favourite restaurant promise
const favouritePromise = idb.open('favourite_IDB' , 1  , function(upgradeDb) {
    upgradeDb.createObjectStore('favourite')});



    class DBHelper {

        /**
         * Database URL.
         * Change this to restaurants.json file location on your server.
         */
        static get DATABASE_URL() {
            // Set database URL as root to differ between '/restaurants' and '/reviews'
            return `http://localhost:1337`;

        }



        static async offlineRequests() {
            console.log("Started offline requests");

            const offlineIDB = await offlinePromise;
            const offlineTx = offlineIDB.transaction("offline","readwrite");
            const offlineStore = offlineTx.objectStore("offline");
            // get all offline reviews
            const offlineReviews = await offlineStore.getAll();



            //get favourite restaurant
            const favouriteIDB = await favouritePromise;
            const favouriteTx = favouriteIDB.transaction("favourite","readwrite");
            const favouriteStore = favouriteTx.objectStore("favourite");
            // get all favourites

            const favouriteRestaurants = await favouriteStore.getAll();


            //ZERO Check
            if(offlineReviews <= 0 && favouriteRestaurants <= 0)
                return;
            // if(offlineReviews <= 0)
            //     return;


            return Promise.all(
                offlineReviews.map(review => {
                    return this.requestReview(review).then(async data =>{
                        const offlineReviewsTx = offlineIDB.transaction("offline","readwrite");
                        const offlineReviewsStore = offlineReviewsTx.objectStore("offline");
                        await offlineReviewsStore.clear();

                        const json = await data.json();
                        const reviewsIDB  = await reviewPromise;
                        const reviewsTX = reviewsIDB.transaction("reviews", "readwrite");

                        const reviewsStore = reviewsTX.objectStore("reviews");
                        //store json data in reviews store
                        reviewsStore.put(json);
                        return;

                    });
                }),


            // map for key-value pairs
            favouriteRestaurants.map(async url =>{
                const result = await fetch(url,{
                    method:"PUT",
                    headers: {
                        accept: "application/json"
                    }
                });

                const json = await result.json();
                const favouriteTx = favouriteIDB.transaction("favourite","readwrite");
                const favouriteStore = favouriteTx.objectStore("favourite");
                // clear favourite store after
                await favouriteStore.clear();

                // Update local IDB
                const restaurantIDB =  await restaurantPromise;
                const restaurantTX = restaurantIDB.transaction("restaurants","readwrite");
                const restaurantStore = restaurantTX.objectStore("restaurants");
                //store json data in restaurant store
                restaurantStore.put(json);
                return;
            })
            );
        }

        // static fetchRestaurants(callback) {
        //     DBHelper.getCachedRestaurants().then(function (data) {
        //         // check if data is non-zero
        //         if (data.length > 0) return callback(null, data);
        //
        //         // Update cache with restaurants
        //         fetch(DBHelper.DATABASE_URL, {credentials: 'same-origin'})
        //             .then(result => {
        //                 console.log('Received fetch result: ', result);
        //                 return result.json()
        //             })
        //             .then(data => {
        //                 restaurantPromise.then(function (db) {
        //                     // check if db exists
        //                     if (!db) return;
        //                     console.log('Received fetch data:', data);
        //
        //                     var tx = db.transaction('restaurants', 'readwrite');
        //                     var keyValStore = tx.objectStore('restaurants');
        //
        //                     // Loop through and put each restaurant object
        //                     data.forEach(restaurant => keyValStore.put(restaurant));
        //
        //                 }).catch(error => {
        //                     return callback(error, null);
        //                 })
        //             });
        //
        //     });
        // }

        // incorporate cache into fetchRestaurants
        static fetchRestaurants(callback) {
            restaurantPromise.then(db => {
                const index = db.transaction("restaurants").objectStore("restaurants");
                let served = false;
                index.getAll().then(restaurants => {
                    if (restaurants) {
                        callback(null, restaurants);
                        served = true;
                    }
                    fetch(`${DBHelper.DATABASE_URL}/restaurants`)
                        .then(json => json.json())
                        .then(async restaurantsCache => {
                            if (!db) return;

                            const tx = db.transaction("restaurants", "readwrite");
                            var store = tx.objectStore("restaurants");
                            restaurantsCache.forEach(restaurant => store.put(restaurant));
                            if (!served || restaurants.length < restaurantsCache.length)
                                callback(null, restaurantsCache);
                        })
                        .catch(err => {
                            if (!served) callback(err, null);
                        });
                });
            });
        }


        // change fetchRestaurant By Id to loop up for new user reviews

        static fetchRestaurantById(id, callback) {
            restaurantPromise.then(restaurantsIDB => {
                reviewPromise.then(reviewsIDB => {
                    // fetch restaurant reviews
                    const reviewsStore = reviewsIDB.transaction("reviews").objectStore("reviews");
                    // declare review flags
                    let availableReviews = false;
                    let restaurantReviews = null;

                    reviewsStore.getAll().then(reviews => {
                        // if there are reviews
                        if (reviews) {
                            // get restaurant id
                            restaurantReviews = reviews.filter(r => r["restaurant_id"] == id);
                            // if there are reviews then set available flag
                            if (restaurantReviews.length > 0) {
                                availableReviews = true;
                            }
                        }

                        // fetch restaurant data
                        const restaurantStore = restaurantsIDB.transaction("restaurants").objectStore("restaurants");
                        // declare restaurant flags
                        let served = false;
                        let availableRestaurant = false;
                        let restaurant = null;

                        // check for cached restaurant -> remove getCachedRestaurants()
                        restaurantStore.getAll().then(restaurants => {
                            if (restaurants) {
                                restaurant = restaurants.find(r => r.id == id);
                                if (restaurant) {
                                    availableRestaurant = true;
                                }
                                if (availableRestaurant && availableReviews) {
                                    restaurant.reviews = restaurantReviews;
                                    callback(null, restaurant);
                                    // Restaurant has been served to client
                                    served = true;
                                }
                            }

                            // declare fetched reviews array
                            let fetchedReviews = [];
                            let fetchedRestaurant = null;

                            // fetch new user reviews for each restaurant
                            fetch(`${DBHelper.DATABASE_URL}/reviews/?restaurant_id=${id}`)
                                .then(json => json.json())
                                .then(async reviews => {

                                    await this.offlineRequests();


                                    // if restaurant has not been served and is ready get reviews
                                    if (!served && availableRestaurant) {
                                        restaurant.reviews = reviews;
                                        served = true;
                                        callback(null, restaurant);
                                    }

                                    // If reviewsIDB exists then cache
                                    if (reviewsIDB) {
                                        const reviewsTx = reviewsIDB.transaction("reviews", "readwrite");
                                        const cachedReviewsStore = reviewsTx.objectStore("reviews");
                                        reviews.forEach(review => cachedReviewsStore.put(review));
                                    }

                                    fetch(`${DBHelper.DATABASE_URL}/restaurants/${id}`)
                                        .then(json => json.json())
                                        .then(fetchedRestaurant => {
                                            fetchedRestaurant.reviews = fetchedReviews;

                                            // if not already done then callback
                                            if (!served) {
                                                callback(null, fetchedRestaurant);
                                            }


                                            console.log("Got just before");
                                            // update restaurants cache
                                            // if empty return
                                            if (!restaurantsIDB) return;

                                            const restaurantTX = restaurantsIDB.transaction("restaurants", "readwrite");
                                            // declare restaurant store for cache
                                            const cachedRestaurantStore = restaurantTX.objectStore("restaurants");

                                            cachedRestaurantStore.put(fetchedRestaurant);
                                            //console.log("Got after");
                                        }).catch(() => {
                                        if (!served) callback("This restaurant does not exist in the DB", null);
                                    });

                                });


                        });

                    });
                });
            });
        }

        /**
         * Fetch restaurants by a cuisine type with proper error handling.
         */
        static fetchRestaurantByCuisine(cuisine, callback) {
            // Fetch all restaurants  with proper error handling
            DBHelper.fetchRestaurants((error, restaurants) => {
                if (error) {
                    callback(error, null);
                } else {
                    // Filter restaurants to have only given cuisine type
                    const results = restaurants.filter(r => r.cuisine_type == cuisine);
                    callback(null, results);
                }
            });
        }

        /**
         * Fetch restaurants by a neighborhood with proper error handling.
         */
        static fetchRestaurantByNeighborhood(neighborhood, callback) {
            // Fetch all restaurants
            DBHelper.fetchRestaurants((error, restaurants) => {
                if (error) {
                    callback(error, null);
                } else {
                    // Filter restaurants to have only given neighborhood
                    const results = restaurants.filter(r => r.neighborhood == neighborhood);
                    callback(null, results);
                }
            });
        }

        /**
         * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
         */
        static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
            // Fetch all restaurants
            DBHelper.fetchRestaurants((error, restaurants) => {
                if (error) {
                    callback(error, null);
                } else {
                    let results = restaurants;
                    if (cuisine != 'all') { // filter by cuisine
                        results = results.filter(r => r.cuisine_type == cuisine);
                    }
                    if (neighborhood != 'all') { // filter by neighborhood
                        results = results.filter(r => r.neighborhood == neighborhood);
                    }
                    callback(null, results);
                }
            });
        }

        /**
         * Fetch all neighborhoods with proper error handling.
         */
        static fetchNeighborhoods(callback) {
            // Fetch all restaurants

            DBHelper.fetchRestaurants((error, restaurants) => {
                if (error) {
                    callback(error, null);
                } else {
                    // Get all neighborhoods from all restaurants
                    const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood);
                    // Remove duplicates from neighborhoods
                    const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i);
                    callback(null, uniqueNeighborhoods);
                }
            });
        }

        /**
         * Fetch all cuisines with proper error handling.
         */
        static fetchCuisines(callback) {
            // Fetch all restaurants
            DBHelper.fetchRestaurants((error, restaurants) => {
                if (error) {
                    callback(error, null);
                } else {
                    // Get all cuisines from all restaurants
                    const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type);
                    // Remove duplicates from cuisines
                    const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i);
                    callback(null, uniqueCuisines);
                }
            });
        }

        /**
         * Restaurant page URL.
         */
        static urlForRestaurant(restaurant) {
            return (`./restaurant.html?id=${restaurant.id}`);
        }

        /**
         * Restaurant image URL.
         */
        static imageUrlForRestaurant(restaurant) {
            // Needed to add .jpg to string for server
            return (`/img/${restaurant.photograph}.jpg`);
        }

        /**
         * Map marker for a restaurant.
         */
        static mapMarkerForRestaurant(restaurant, map) {
            const marker = new google.maps.Marker({
                    position: restaurant.latlng,
                    title: restaurant.name,
                    url: DBHelper.urlForRestaurant(restaurant),
                    map: map,
                    animation: google.maps.Animation.DROP
                }
            );
            return marker;
        }


        static SyncEvent() {
            // google dev background sync
            if ("serviceWorker" in navigator && "SyncManager" in window) {
                navigator.serviceWorker.ready
                    .then(function(reg) {
                        return reg.sync.register("offline-requests");
                    })
                    .catch(() => {
                        this.offlineRequests();
                    });
            } else {
                // if service worker not supported
                this.offlineRequests();
            }
        }

        static requestReview({ restaurantId, rating, comments, name }) {
            return fetch(`${this.DATABASE_URL}/reviews/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json"
                },
                body: JSON.stringify({
                    restaurant_id: restaurantId,
                    rating: rating,
                    comments,
                    name
                })

            });
        }



        // Asynchronous post review
        static async postReview(restaurantReview){
            // try catch for receiving json data
            try {
                //console.log("We are trying");
                const data = await this.requestReview(restaurantReview);
                console.log("Async postReview: " + data);

                this.SyncEvent();
                const json = await data.json();
                const reviewsIDB = await reviewPromise;
                const reviewsTx = reviewsIDB.transaction("reviews", "readwrite");
                const reviewsStore = reviewsTx.objectStore("reviews");
                reviewsStore.put(json);

                const fullReviews = await reviewsStore.getAll();
                // filter received review data by restaurant id
                const reviews = fullReviews.filter(r => r["restaurant_id"] == restaurantReview.restaurantId);

                return reviews;
            }

            catch(e){
                const offlineIDB = await offlinePromise;
                const offlineTx = offlineIDB.transaction("offline", "readwrite");
                const offlineStore = offlineTx.objectStore("offline");

                console.log(`${restaurantReview.restaurantId}, ${restaurantReview.rating}`);

                offlineStore.put(restaurantReview,`${restaurantReview.restaurantId}${restaurantReview.rating}`);
                //offlineStore.put(restaurantReview,restaurantReview.restaurantId);


                const reviewsIDB = await reviewPromise;
                const reviewsTx = reviewsIDB.transaction("reviews", "readwrite");
                const reviewsStore = reviewsTx.objectStore("reviews");
                const fullReviews = await reviewsStore.getAll();
                const reviews = fullReviews.filter(r => r["restaurant_id"] == restaurantReview.restaurantId);


                reviews.push(restaurantReview);
                return reviews;


            }
        }



           static async favouriteRestaurant(id, newState) {
            console.log("hit the fav");
            const url = `${
                this.DATABASE_URL
                }/restaurants/${id}/?is_favourite=${newState}`;
            try {
                const result = await fetch(url, {
                    method: "PUT",
                    headers: {
                        accept: "application/json"
                    }
                });

                const json = await result.json();

                // update local db
                //this.offlineRequests();
                console.log("didn't get here1");
                const restaurantsIDB = await restaurantPromise;
                const restaurantsTx = restaurantsIDB.transaction("restaurants", "readwrite");
                const restaurantsStore = restaurantsTx.objectStore("restaurants");
                restaurantsStore.put(json);
                console.log("JSON IS: " +json.toString());
                return json;
            } catch (e) {
                // failed request, update local db for later request
                const restaurantsIDB = await restaurantPromise;
                const restaurantTx = restaurantsIDB.transaction(
                    "restaurants",
                    "readwrite"
                );
                const restaurantStore = restaurantTx.objectStore("restaurants");
                const restaurants = await restaurantStore.getAll();
                // look for restaurant
                const restaurant = restaurants.find(r => r.id == id);
                restaurant["is_favourite"] = newState;
                restaurantStore.put(restaurant);
                // schedule request for later
                const favouriteIDB = await favouritePromise;
                const favouriteTx = favouriteIDB.transaction(
                    "favourite",
                    "readwrite"
                );
                const favouriteStore = favouriteTx.objectStore(
                    "favourite"
                );
                favouriteStore.put(url, id);
                return restaurant;
            }
        }



    }


