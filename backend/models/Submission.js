const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    user_name: {
      type: String,
      trim: true,
      maxlength: 100,
      default: null,
    },

    // Location
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true,
      maxlength: 100,
    },
    district: {
      type: String,
      required: [true, 'District is required'],
      trim: true,
      maxlength: 100,
    },

    // Land Details
    land_size: {
      type: Number,
      min: 0,
      max: 10000,
      default: null,
    },
    land_category: {
      type: String,
      enum: ['marginal', 'small', 'semi_medium', 'medium', 'large', null],
      default: null,
    },

    // Irrigation
    irrigation_src: {
      type: String,
      enum: [
        'canal', 'tube_well', 'open_well', 'tank', 'rainfed',
        'drip', 'sprinkler', 'river', 'other', null,
      ],
      default: null,
    },
    well_depth: {
      type: Number,
      min: 0,
      max: 1000,
      default: null,
    },

    // Crops
    kharif_crop: {
      type: String,
      trim: true,
      maxlength: 100,
      default: null,
    },
    rabi_crop: {
      type: String,
      trim: true,
      maxlength: 100,
      default: null,
    },
    crop_intensity: {
      type: String,
      trim: true,
      maxlength: 50,
      default: null,
    },

    // Soil
    soil_type: {
      type: String,
      trim: true,
      maxlength: 100,
      default: null,
    },

    // Extra
    notes: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: null,
    },

    // Metadata
    submitted_at: {
      type: Date,
      default: Date.now,
    },
    ip_hash: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true, // adds createdAt + updatedAt automatically
    versionKey: false,
  }
);

// Indexes for fast queries
submissionSchema.index({ state: 1, district: 1 });
submissionSchema.index({ createdAt: -1 });
submissionSchema.index({ irrigation_src: 1 });
submissionSchema.index({ land_category: 1 });

const Submission = mongoose.model('Submission', submissionSchema);

module.exports = Submission;
