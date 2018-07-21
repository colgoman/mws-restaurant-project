let restaurant;
let map;

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false
      });
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
    }
  });
};

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant);
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL';
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant)
    });
  }
};

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img';
  // add alt tag to image
  image.setAttribute("alt","The image of the " + restaurant.name + " restaurant");
  image.src = DBHelper.imageUrlForRestaurant(restaurant);

  // fav button
    const favouriteDiv = document.getElementById('favouriteRestaurant');

    let favButton = document.createElement('button');
    let isFavourite = restaurant["is_favorite"] === "true";
    favButton.setAttribute('id', 'fav');
    favButton.innerHTML = "♥";

    favouriteDiv.appendChild(favButton);

    favButton.className = isFavourite ? "favorite" : "";
    console.log("favButton.className before :  " + favButton.className);

  // onlick favourite button
    fav.onclick = () => favourite(isFavourite, newState => {
      isFavourite = !isFavourite;

      // set css
      changeFavouriteButton(newState);
      console.log("Onclick favourite set to " + newState);

      favButton.className = newState ? "favourite": "";
      console.log("newState :  " + newState);
    });


  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;


  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  fillReviewsHTML();

  // fill form info
  fillFormHtml();

};


/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
};

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.restaurant.reviews) => {
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h3');
  title.innerHTML = 'Reviews';
  container.appendChild(title);

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById('reviews-list');
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
};


function fillFormHtml(){

  const form = document.getElementById("ReviewsForm");
  const serverURL = "http://localhost:1337";

  // set form submit as an async function
  form.onsubmit = async function(e){
    // prevent link from opening the url
    e.preventDefault();

    // Get parameters from form
    const restaurantId = getParameterByName("id");
    const name = document.getElementById("name").value;
    const rating = document.getElementById("rating").value;
    const comments = document.getElementById("comments").value;

    // TEST - Print parameters to console
    console.log({restaurantId,name,rating, comments});

      DBHelper.postReview({restaurantId,name,rating,comments}).then(
          reviews => {
            fillReviewsHTML(reviews);
            // reset form after review submitted
            form.reset();
          }
      );
  };
  }


/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  const li = document.createElement('li');
  const name = document.createElement('p');
  name.innerHTML = review.name;
  li.appendChild(name);

  const date = document.createElement('p');
  date.innerHTML = review.date;
  li.appendChild(date);

  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating}`;
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  return li;
};

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
};

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
};

// post favourite flag on restaurant to DBHelper
function favourite(previousState, callback) {
    const id = getParameterByName("id");
    DBHelper.favouriteRestaurant(id, !previousState).then(result => {
        callback(!previousState);
    });
}


function changeFavouriteButton(isFavourite) {
  console.log("Changing fav button with: " + isFavourite);
    if (!isFavourite) {
        console.log("Setting false colour");
        fav.style.backgroundColor = "palevioletred";
        fav.style.color = "white";
    }
    else if (isFavourite){
        console.log("Setting true colour");
        fav.style.backgroundColor = "white";
        fav.style.color = "palevioletred";
    }
}
