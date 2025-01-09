export const schema = {
    airline: { type: "string" },
    arrivalDate: { type: "string" },
    arrivalTime: { type: "string" },
    flightLength: { type: "number" },
    flightNumber: { type: "string" },
    id: { required: true, type: "string" },
    origin: { type: "string" },
    processed: { defaultValue: false, type: "boolean" }
};