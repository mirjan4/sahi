const mongoose = require('mongoose');

const PosterTemplateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a template name'],
      trim: true,
    },
    backgroundImage: {
      type: String,
      required: [true, 'Please add a background image URL or path'],
    },
    logoImage: {
      type: String,
    },
    config: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: () => ({
        eventName: { type: 'text', x: 50, y: 30, fontSize: 24, color: '#000000', align: 'center', fontWeight: 'bold', zIndex: 1 },
        categoryName: { type: 'text', x: 50, y: 22, fontSize: 20, color: '#374151', align: 'center', zIndex: 1 },
        resultNumber: { type: 'text', x: 80, y: 12, fontSize: 16, color: '#4b5563', align: 'right', zIndex: 1 },
        firstWinner: { type: 'text', x: 50, y: 45, fontSize: 28, color: '#d97706', align: 'center', fontWeight: 'bold', zIndex: 2 },
        secondWinner: { type: 'text', x: 50, y: 60, fontSize: 24, color: '#4b5563', align: 'center', zIndex: 2 },
        thirdWinner: { type: 'text', x: 50, y: 75, fontSize: 24, color: '#b45309', align: 'center', zIndex: 2 },
        
        firstWinnerSymbol: { type: 'symbol', x: 38, y: 45, size: 40, opacity: 1, zIndex: 3, librarySymbol: 'medal_gold' },
        secondWinnerSymbol: { type: 'symbol', x: 40, y: 60, size: 36, opacity: 1, zIndex: 3, librarySymbol: 'medal_silver' },
        thirdWinnerSymbol: { type: 'symbol', x: 40, y: 75, size: 36, opacity: 1, zIndex: 3, librarySymbol: 'medal_bronze' },
      }),
    },
    symbols: {
      type: Map,
      of: String,
      default: {},
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    minimize: false,
  }
);

module.exports = mongoose.model('PosterTemplate', PosterTemplateSchema);
