'use strict';

////////////////////////////////////////////////////////////////////////////////
////////////////////////// Elements ////////////////////////////////////////////

// Main Containers
const homeDOM = document.getElementById('home');
const appDOM = document.getElementById('app');
const appContainerDOM = document.getElementById('appContainer');
const heroDOM = document.getElementById('hero');
const mapDOM = document.getElementById('map');

//Elements
const form = document.querySelector('.form');
const containerTrips = document.querySelector('.trips');
const bike = document.querySelector('.bicycle');
const userName = document.querySelector('.username');
const modal = document.querySelector('.modal');

// Buttons
const btnStart = document.querySelector('.btn-start');
const btnReset = document.querySelector('.btn-reset');
const btnUsername = document.querySelector('.form-user__btn');

//Inputs
const inputType = document.querySelector('.form__input--type');
const inputLocation = document.querySelector('.form__input--location');
const inputDate = document.querySelector('.form__input--date');
const inputTime = document.querySelector('.form__input--time');
const inputTrippers = document.querySelector('.form__input--trippers');
const inputNotes = document.querySelector('.form__input--notes');
const inputUsername = document.querySelector('.form-user__input');

// Errors
const errorStart = document.querySelector('.error__start');
const errorModal = document.querySelector('.error__modal');
const errorForm = document.querySelector('.error__form');

//Media Query
const portMediaQuery = window.matchMedia('(max-width: 900px)');

//Misc
const loader = document.querySelector('.loader');
const loaderCheck = document.querySelector('.loader__check');

////////////////////////////////////////////////////////////////////////////////////////
////////////////////////// MAIN FUNCTIONALITY //////////////////////////////////////////

/***************************** Classes *******************************************/
class Trip {
  // date = new Date();
  id = (Date.now() + '').slice(-10);
  clicks = 0;

  constructor(
    coords,
    planType,
    planLocation,
    planDate,
    planTime,
    planTrippers,
    planNotes
  ) {
    this.coords = coords; // [lat, lng]
    this.planType = planType;
    this.planLocation = planLocation;
    this.planDate = planDate;
    this.planTime = planTime;
    this.planTrippers = planTrippers;
    this.planNotes = planNotes;

    // Get the Date for the Description
    this._setDescription();

    // Get the Icon from the Trip Types
    this._setIcon();
  }

  _setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August',
    'September', 'October', 'November', 'December'];
    const planDateArray = this.planDate.split('-');
    const planDateMonthIndex = +planDateArray[1] - 1;
    const planDateDay = planDateArray[2];

    this.description = `${this.planType[0].toUpperCase()}${this.planType.slice(
      1
    )} on ${months[planDateMonthIndex]} ${planDateDay} `;
  }

  _setIcon() {
    if (this.planType === 'foodtrip') this.planIcon = '🍔';
    if (this.planType === 'nighttrip') this.planIcon = '🌜';
    if (this.planType === 'roadtrip') this.planIcon = '🚗';
    if (this.planType === 'beachtrip') this.planIcon = '⛱';
    if (this.planType === 'camptrip') this.planIcon = '⛺️';
  }

  click() {
    this.clicks++;
  }
}

/***************************** APPLICATION ARCHITECTURE *******************************************/

class App {
  username;
  #map;
  #mapZoomLevel = 13;
  #mapEvent;
  #trips = [];

  constructor() {
    // Get user's position
    this._getPosition();

    // Get data from local storage
    this._getLocalStorage();

    // Display username
    this._displayUsername();

    // Event handlers
    btnStart.addEventListener('click', this._userStart.bind(this));
    btnUsername.addEventListener('click', this._submitUsername.bind(this));
    btnReset.addEventListener('click', this.reset.bind(this));
    form.addEventListener('submit', this._newTrip.bind(this));
    containerTrips.addEventListener('click', this._moveToPopup.bind(this));
  }

  /***************************** Map *******************************************/
  _getPosition() {
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          this._renderError(
            'Please allow to locate your position to start!',
            errorStart,
            false
          );
        }
      );
  }

  _loadMap(position) {
    // To Load the Map with Saved Coords
    const produceCoords = position => {
      if (!position.coords && this.coords) {
        const coords = this.coords;

        return coords;
      }

      if (position.coords) {
        const { latitude } = position.coords;
        const { longitude } = position.coords;

        const coords = [latitude, longitude];

        // Update Coords
        app.coords = coords;
        this._setLocalStorageCoords();

        return coords;
      }
    };

    const coords = produceCoords(position);

    this.#map = L.map('map').setView(coords, this.#mapZoomLevel);

    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution: '&copy; Kershey',
    }).addTo(this.#map);

    // Handling clicks on map
    this.#map.on('click', this._showForm.bind(this));
    this.#trips.forEach(trip => this._renderTripMarker(trip));
  }

  /***************************** Button Event Handlers *******************************************/
  _userStart(e) {
    e.preventDefault();
    bike.classList.remove('bicycle-animation');
    btnStart.classList.remove('btn-start__animation');

    if (!this.username) {
      this._showModal();
    }

    if (this.username) {
      this._doTransition();
    }
  }

  _submitUsername(e) {
    e.preventDefault();

    //validation
    if (inputUsername.value) {
      modal.classList.remove('display-modal');
      this._setUsername();
      this._displayUsername();
      this._doTransition();
    } else {
      this._renderError('Please enter your name!', errorModal);
    }
  }

  /***************************** View *******************************************/
  _displayUsername() {
    userName.textContent = this.username;
  }

  _showModal() {
    modal.classList.add('display-modal');
  }

  _doTransition() {
    const transitionIn = () => {
      homeDOM.style.height = '100%';
      heroDOM.classList.add('hero-transition-out');
      appDOM.classList.add('app-transition-in');
      appContainerDOM.classList.add('appCon-transition-in');
    };

    const loadSpinner = () => {
      const endLoad = () => {
        loader.classList.remove('loader-active');
      };

      const addCheck = () => {
        loaderCheck.classList.add('loader-active');
      };

      loader.classList.add('loader-active');
      setTimeout(addCheck, 3000);
      setTimeout(endLoad, 4000);
    };

    loadSpinner();
    setTimeout(transitionIn, 4200);
  }

  _showForm(mapE) {
    const focus = () => {
      inputLocation.focus();
    };

    this.#mapEvent = mapE;
    this._scrollIntoPosition('form');
    form.classList.remove('hidden');

    //delay to set the focus
    setTimeout(focus, 1000);
  }

  // Clear Display
  _hideForm() {
    this._clearInput();
    form.classList.add('hidden');
  }

  _clearInput() {
    // prettier-ignore
    inputType.value = inputLocation.value = inputDate.value = inputTime.value = inputTrippers.value = inputNotes.value = '';
    return this;
  }

  _clearInputTrippers() {
    inputTrippers.value = '';
    return this;
  }

  /***************************** Production *******************************************/
  _newTrip(e) {
    //variables for validation
    const allPositive = (...inputs) => inputs.every(inp => inp > 0);

    const titleCase = words => {
      const capitalize = word => word[0].toUpperCase() + word.slice(1);

      const capitalized = words
        .toLowerCase()
        .split(' ')
        .map(word => capitalize(word))
        .join(' ');
      return capitalized;
    };

    //event default
    e.preventDefault();

    //Get data from form
    const planType = inputType.value;
    const planLocation = titleCase(inputLocation.value);
    const planDate = inputDate.value;
    const planTime = inputTime.value;
    const planTrippers = +inputTrippers.value;
    const planNotes = inputNotes.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let trip;

    // Check if data is valid
    if (!allPositive(planTrippers)) {
      this._clearInputTrippers();

      return this._renderError('Invalid Trippers count!', errorForm);
    }

    // Trip Creation
    trip = new Trip(
      [lat, lng],
      planType,
      planLocation,
      planDate,
      planTime,
      planTrippers,
      planNotes
    );
    this.#trips.push(trip);

    // Add new object to trip array
    // Render trip on map as Marker
    this._renderTripMarker(trip);

    // Render trip on list
    this._renderTrip(trip);

    // Clear input fields
    this._hideForm();

    // Set local storage to all trips
    this._setLocalStorage();
  }

  /***************************** Rendering *******************************************/
  _renderTripMarker(trip) {
    L.marker(trip.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${trip.type}-popup`,
        })
      )
      .setPopupContent(`${trip.planIcon} ${trip.description}`) // accepts only strings
      .openPopup();
  }

  _renderTrip(trip) {
    let html = `
    <li class="trip" data-id="${trip.id}">
    <details class="trip__checklist">
      <summary class="trip__summary">
        <h2 class="trip__title">${trip.description}</h2>
        <div class="trip__emoji">${trip.planIcon}</div>
        <div class="trip__details trip__location">
          <span class="trip__icon">🚴🏼‍♂️</span>
          <span class="trip__value">${trip.planLocation}</span>
        </div>
        <div class="trip__details trip__time">
          <span class="trip__icon">⏰</span>
          <span class="trip__value">${trip.planTime}</span>
        </div>
        <div class="trip__details trip__trippers">
          <span class="trip__icon">👥</span>
          <span class="trip__value">${trip.planTrippers}</span>
        </div>
      </summary>
      <div class="trip__details trip__notes">
        <span class="trip__icon">📌</span>
        <span class="trip__value"
          >${trip.planNotes}</span
        >
      </div>
    </details>
  </li>
    `;

    form.insertAdjacentHTML('afterend', html);

    this._scrollIntoPosition('map');
  }

  _renderError(errorMessage, element, remove = true) {
    const revealError = () => {
      element.textContent = errorMessage;
      element.classList.add('display-error');
    };

    const removeError = () => {
      element.classList.remove('display-error');
    };

    revealError();

    //reset
    if (remove) setTimeout(removeError, 3000);
  }

  /***************************** Animation *******************************************/
  _moveToPopup(e) {
    const tripEl = e.target.closest('.trip');

    if (!tripEl) return;

    const trip = this.#trips.find(trip => trip.id === tripEl.dataset.id);

    this.#map.setView(trip.coords, this.#mapZoomLevel, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
  }

  _scrollIntoPosition = position => {
    let coord;
    const portMediaQuery = window.matchMedia('(max-width: 900px)');

    if (position === 'map' && portMediaQuery.matches) coord = 0;
    if (position === 'form' && portMediaQuery.matches) coord = 600;

    window.scrollTo({
      top: coord,
      behavior: 'smooth',
    });
  };

  /***************************** Local Storage *******************************************/
  _setLocalStorage() {
    localStorage.setItem('trips', JSON.stringify(this.#trips));
  }

  _setLocalStorageUsername() {
    localStorage.setItem('username', JSON.stringify(this.username));
  }

  _setLocalStorageCoords() {
    localStorage.setItem('coords', JSON.stringify(this.coords));
  }

  _setUsername() {
    this.username = inputUsername.value;
    this._setLocalStorageUsername();
    return this;
  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('trips'));
    const dataUsername = JSON.parse(localStorage.getItem('username'));
    const dataCoords = JSON.parse(localStorage.getItem('coords'));

    if (data) {
      this.#trips = data;
      this.#trips.forEach(trip => this._renderTrip(trip));
    }

    if (dataUsername) this.username = dataUsername;

    if (dataCoords) this.coords = dataCoords;
  }

  reset() {
    localStorage.removeItem('trips');
    localStorage.removeItem('username');
    location.reload();
  }
}

const app = new App();

//TEST
console.log(app);
console.log('TEST');
