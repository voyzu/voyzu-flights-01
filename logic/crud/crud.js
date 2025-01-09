// Third party libraries
import { randFlightDetails } from '@ngneat/falso';
import { format } from 'date-fns';

// Voyzu framework
import framework from 'voyzu-framework-01';

// Modules from this component
import { schema as flightSchema } from '../models/flight.js';

// Module constants
const invalidParametersError = framework.errors.InvalidParametersError;

// Primitive constants (settings)
const DEFAULT_TEST_DATA_LENGTH = 20;
const ID_LENGTH = 6;

/**
 * Create a new flight.
 * @param {object} flight The flight to create.
 * @returns {object} The created flight.
 */
export function createFlight(flight) {

    if (!flight.id) {
        flight.id = framework.helpers.cryptoHelper.generateRandomString(ID_LENGTH);
    }

    // Make sure the flight parameter matches our schema
    let newFlight = framework.model.generateModel(flight, flightSchema);
    newFlight = structuredClone(newFlight); // Break any byRef link

    let flights = framework.cache.get('flights');

    if (!flights) {
        flights = [];
    }

    flights.push(newFlight);
    framework.cache.set('flights', flights);

    return flight;
}

/**
 * Update a flight.
 * @param {object} flight The flight to update.
 * @returns {object} The updated flight.
 */
export function updateFlight(flight) {

    // Make sure the flight parameter matches our schema
    let newFlight = framework.model.generateModel(flight, flightSchema);
    newFlight = structuredClone(newFlight); // Break any byRef link

    // Get flights array
    const flights = framework.cache.get('flights');

    // Find the index of the flight with the matching id
    const flightIndex = flights.findIndex(flight => flight.id === newFlight.id);

    // Replace the matching flight with the new flight object if found
    if (flightIndex === -1) {
        throw new invalidParametersError(`flight id ${flight.id} was not found to update`);
    } else {
        flights[flightIndex] = newFlight;  // Replace the found flight
    }

    // Save array back to cache
    framework.cache.set('flights', flights);

    return newFlight;
}

/**
 * Delete a flight.
 * @param {string} id The id of the flight to delete.
 */
export function deleteFlight(id) {

    // Get flights array
    const flights = framework.cache.get('flights');

    // Find the index of the flight with the matching id
    const flightIndex = flights.findIndex(flight => flight.id === id);

    // Replace the matching flight with the new flight object if found
    if (flightIndex !== -1) {
        flights.splice(flightIndex, 1);  // Remove the flight at the found index
    }

    // Save array back to cache
    framework.cache.set('flights', flights);
}

/**
 * Retrieve a flight.
 * @param {string} id The id of the flight to retrieve.
 * @returns {object} The retrieved flight.
 */
export function getFlight(id) {

    // Get flights array
    const flights = framework.cache.get('flights');

    // Find the index of the flight with the matching id
    const flightIndex = flights.findIndex(flight => flight.id === id);

    // Replace the matching flight with the new flight object if found
    if (flightIndex !== -1) {
        return structuredClone(flights[flightIndex]); // Break any byRef link
    } 
    
}

/**
 * Create random test data (flights).
 * @param {number} numberRecordsToCreate Number of test records to create.
 * @returns {object} The created flights.
 */
export function createTestData(numberRecordsToCreate = DEFAULT_TEST_DATA_LENGTH) {

    const flightsToReturn = [];

    const flights = randFlightDetails({ length: numberRecordsToCreate });

    for (const flight of flights) {
        const newFlight = {};
        newFlight.id = framework.helpers.cryptoHelper.generateRandomString(ID_LENGTH);
        newFlight.airline = flight.airline;
        newFlight.flightNumber = flight.flightNumber;
        newFlight.flightLength = flight.flightLength;
        newFlight.origin = `${flight.origin.city  }, ${  flight.origin.country}`;
        newFlight.arrivalDate = format(flight.date, 'yyyy-MM-dd').toString();
        newFlight.arrivalTime = format(flight.date, 'HH:mm').toString();

        flightsToReturn.push(framework.model.generateModel(newFlight, flightSchema));
    }

    framework.cache.set('flights', flightsToReturn);

    return flightsToReturn;
}