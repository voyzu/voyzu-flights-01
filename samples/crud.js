// Import voyzu framework
import framework from 'voyzu-framework-01';

// Import modules from this component
import { schema as flightSchema } from '../logic/models/flight.js';
import * as crud from '../logic/crud/crud.js';

// Crud.createTestData(1);

const flight = addFlight();
console.log(`Flights after adding flight`);
getFlights();

const addedFlight = crud.getFlight(flight.id);
addedFlight.airline = "UPDATED AIRLINE!";
crud.updateFlight(addedFlight);
console.log(`Flights after updating flight`);
getFlights();

crud.deleteFlight(flight.id);
console.log(`Flights after deleting flight`);
getFlights();

function getFlights() {
  console.log(framework.cache.get('flights'));
  return framework.cache.get('flights');
}

function addFlight() {

  const flight = {
    airline: "Air New Zealand'",
    arrivalDate: '2025-12-22',
    arrivalTime: '23,06',
    flightLength: 12.5,
    flightNumber: 'ANZ123',
    id: '123abc',
    origin: 'Rockhampton, Australia',
    processed: false
  };

  crud.createFlight(flight);

  // Make sure flight confirms to the schema
  return framework.model.generateModel(flight,flightSchema);
}
