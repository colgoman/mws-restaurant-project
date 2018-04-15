/**
 * Common database helper functions.
 */

class DBHelper {

    /**
     * Database URL.
     * Change this to restaurants.json file location on your server.
     */
    static get DATABASE_URL() {
        const port = 1337 // Change this to your server port
        return `http://localhost:${port}/restaurants`;
    }

    /**
     *
     */
    static get dbPromise() {
        console.log('idb open');
        return idb.open('restaurant-db', 1, function (upgradeDb) {
          console.log('idb created');
            if (!upgradeDb.objectStoreNames.contains('restaurants')) {
                let restaurantOS = upgradeDb.createObjectStore('restaurants', { keyPath: 'id' });
                restaurantOS.createIndex('id', 'id', { unique: true });
                restaurantOS.createIndex('updatedAt', 'updatedAt', { unique: false });
            }
        });
    }

    /**
     * IndexedDB storage get all restaurants
     */
    static refreshLocalRestaurants(restaurants) {
        restaurants.forEach(function(restaurant,index){
            DBHelper.getLocalRestaurantByID(restaurant.id).then(function(val){
                if(typeof val == 'undefined'){
                    //not in local list -> add
                    DBHelper.addLocalRestaurant(restaurant);
                }else{
                    //in local list -> update if necessairy
                    if(restaurant.updatedAt != val.updatedAt){
                        DBHelper.putLocalRestaurant(restaurant);
                    }
                }
            });
        });
    }
    /**
     * IndexedDB storage add restaurant to local storage
     */
    static addLocalRestaurant(restaurant) {
        return DBHelper.dbPromise.then(function(db) {
            let tx = db.transaction('restaurants', 'readwrite');
            let restaurantOS = tx.objectStore('restaurants');
            restaurantOS.add(restaurant);
            return tx.complete;
        });
    }
    /**
     * IndexedDB storage add restaurant to local storage
     */
    static putLocalRestaurant(restaurant) {
        return DBHelper.dbPromise.then(function(db) {
            let tx = db.transaction('restaurants', 'readwrite');
            let restaurantOS = tx.objectStore('restaurants');
            restaurantOS.put(restaurant);
            return tx.complete;
        });
    }
    /**
     * IndexedDB storage get restaurant by id
     */
    static getLocalRestaurantByID(restaurantid) {
        return DBHelper.dbPromise.then(function(db) {
            let tx = db.transaction('restaurants', 'readonly');
            let restaurantOS = tx.objectStore('restaurants');
            return restaurantOS.get(restaurantid);
        });
    }

    /**
     * IndexedDB storage get all restaurants
     */
    static getLocalRestaurants(callback) {
        DBHelper.dbPromise.then(function(db) {
            let tx = db.transaction('restaurants', 'readonly');
            let restaurantOS = tx.objectStore('restaurants');
            return restaurantOS.getAll();
        }).then(function(restaurants) {
            if(restaurants.length != 0){
                callback(null, restaurants);
            }else{
                if(navigator.onLine) {
                    fetch(DBHelper.DATABASE_URL, {
                        method: 'get'
                    }).then(function(response) {
                        return response.json();
                    }).then(function(restaurants){
                        DBHelper.refreshLocalRestaurants(restaurants);
                        callback(null, restaurants);
                    }).catch(function(err) {
                        const error = (`Request failed. Error : ${err}`);
                        callback(error, null);
                    });
                }
            }
        }).catch(function(err) {
            const error = (`Request failed. Error : ${err}`);
            callback(error, null);
        });
    }

    /**
     * Fetch all restaurants.
     */
    static fetchRestaurants(callback) {

        /**
         * 0. Get local storage restaurants
         * 1. Check if navigator is online
         * 2. if online -> fetch -> add/update database
         * 3. if not online -> fetch from database
         */
        DBHelper.getLocalRestaurants(callback);

    }

    /**
     * Fetch a restaurant by its ID.
     */
    static fetchRestaurantById(id, callback) {
        // fetch all restaurants with proper error handling.
        DBHelper.fetchRestaurants((error, restaurants) => {
            if (error) {
                callback(error, null);
            } else {
                const restaurant = restaurants.find(r => r.id == id);
                if (restaurant) { // Got the restaurant
                    callback(null, restaurant);
                } else { // Restaurant does not exist in the database
                    callback('Restaurant does not exist', null);
                }
            }
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
                let results = restaurants
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
                const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
                // Remove duplicates from neighborhoods
                const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
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
                const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
                // Remove duplicates from cuisines
                const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
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
        if(typeof restaurant.photograph != 'undefined'){
            return (`/img/${restaurant.photograph}.jpg`);
        }else{
            return (`/img/no-image.jpg`);
        }
    }
    /**
     * Small Restaurant image URL.
     */
    static imageSmallUrlForRestaurant(restaurant) {
        if(typeof restaurant.photograph != 'undefined'){
            return (`/img/small/${restaurant.photograph}.jpg`);
        }else{
            return (`/img/small/no-image.jpg`);
        }
    }
    /**
     * Webp Restaurant image URL.
     */
    static imageWebpUrlForRestaurant(restaurant) {
        if(typeof restaurant.photograph != 'undefined'){
            let restopicture = restaurant.photograph.replace('.jpg', '.webp');
            return (`/img/webp/${restopicture}.webp`);
        }else{
            return (`/img/webp/no-image.webp`);
        }
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
            animation: google.maps.Animation.DROP}
        );
        return marker;
    }

}
