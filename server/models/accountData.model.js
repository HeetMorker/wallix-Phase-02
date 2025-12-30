const mongoose = require('mongoose');

const accountDataSchema = new mongoose.Schema({
    onboard_status: { type: String, required: true }, 
    ipAddress: { type: String, required: true }, 
}, { timestamps: true }); 

const AccountData = mongoose.model('AccountData', accountDataSchema);

module.exports = AccountData;

