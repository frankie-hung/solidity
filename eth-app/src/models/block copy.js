const mongoose = require('mongoose')
const AppContext = mongoose.model('AppContext', {
    height: {
        type: Number,
        required: true
    },
    txns: {
        type: [String]
    },
    gasUsed: {
        type: Number,
        required: true
    },
    timestamp: {
        type: Date,
        required: true
    },
    importDate: {
        type: Date,
        default: Date.now
    }
})

module.exports = Block