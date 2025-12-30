const SplunkData = require('../models/splunkData.schema');

// Function to save data to the database
async function saveSplunkData(data) {
    try {
        const splunkData = new SplunkData(data);
        await splunkData.save();
        console.log("Data saved successfully");
    } catch (err) {
        console.error("Error saving data:", err);
    }
}

// Function to save multiple data records to the database
async function saveMultipleSplunkData(dataArray) {
    try {
        await SplunkData.insertMany(dataArray);
        console.log("All data saved successfully");
    } catch (err) {
        console.error("Error saving multiple data:", err);
    }
}

module.exports = {
    saveSplunkData,
    saveMultipleSplunkData
};
