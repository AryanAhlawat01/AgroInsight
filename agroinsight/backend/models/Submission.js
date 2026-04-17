// models/Submission.js
const mongoose = require('mongoose');

const SubmissionSchema = new mongoose.Schema(
  {
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true,
    },
    district: {
      type: String,
      required: [true, 'District is required'],
      trim: true,
    },
    land_size: {
      type: Number,
      min: [0, 'Land size cannot be negative'],
      default: null,
    },
    land_category: {
      type: String,
      enum: ['marginal', 'small', 'semi_medium', 'medium', 'large', null],
      default: null,
    },
    irrigation_src: {
      type: String,
      enum: [
        'canal', 'tube_well', 'open_well', 'tank',
        'river', 'rainfed', 'drip', 'sprinkler', 'other', null,
      ],
      default: null,
    },
    well_depth: {
      type: Number,
      min: [0, 'Well depth cannot be negative'],
      default: null,
    },
    kharif_crop: { type: String, trim: true, default: null },
    rabi_crop:   { type: String, trim: true, default: null },
    crop_intensity: {
      type: String,
      enum: ['single', 'double', 'triple', null],
      default: null,
    },
    soil_type: {
      type: String,
      enum: ['alluvial', 'black', 'red', 'laterite', 'desert', 'mountainous', 'other', null],
      default: null,
    },
    notes: { type: String, trim: true, default: null },
    submitted_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    region: {
      type: String,
      enum: ['north', 'south', 'east', 'west', 'central', 'northeast', null],
      default: null,
    },
  },
  {
    timestamps: true, // adds createdAt + updatedAt automatically
    toJSON: { virtuals: true },
  }
);

// ─── Indexes for fast queries ──────────────────────────────────────────────────
SubmissionSchema.index({ state: 1 });
SubmissionSchema.index({ district: 1 });
SubmissionSchema.index({ region: 1 });
SubmissionSchema.index({ createdAt: -1 });
SubmissionSchema.index({ irrigation_src: 1 });
SubmissionSchema.index({ land_category: 1 });

// ─── Pre-save: auto-derive region from state ───────────────────────────────────
const STATE_REGION_MAP = {
  'Punjab': 'north', 'Haryana': 'north', 'Himachal Pradesh': 'north',
  'Jammu & Kashmir': 'north', 'Uttarakhand': 'north', 'Delhi': 'north',
  'Rajasthan': 'west', 'Gujarat': 'west', 'Maharashtra': 'west', 'Goa': 'west',
  'Karnataka': 'south', 'Kerala': 'south', 'Tamil Nadu': 'south',
  'Andhra Pradesh': 'south', 'Telangana': 'south',
  'West Bengal': 'east', 'Odisha': 'east', 'Bihar': 'east',
  'Jharkhand': 'east',
  'Uttar Pradesh': 'central', 'Madhya Pradesh': 'central',
  'Chhattisgarh': 'central',
  'Assam': 'northeast', 'Meghalaya': 'northeast', 'Manipur': 'northeast',
  'Nagaland': 'northeast', 'Mizoram': 'northeast', 'Tripura': 'northeast',
  'Arunachal Pradesh': 'northeast', 'Sikkim': 'northeast',
  'Northeast States': 'northeast',
};

SubmissionSchema.pre('save', function (next) {
  if (this.state && STATE_REGION_MAP[this.state]) {
    this.region = STATE_REGION_MAP[this.state];
  }
  next();
});

module.exports = mongoose.model('Submission', SubmissionSchema);
