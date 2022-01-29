const mongoose = require('mongoose')
const Block = mongoose.model('Block', {
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