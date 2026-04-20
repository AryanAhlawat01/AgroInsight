const Joi = require('joi');

const submissionSchema = Joi.object({
  state: Joi.string().trim().max(100).required(),
  district: Joi.string().trim().max(100).required(),
  land_size: Joi.number().min(0).max(10000).allow(null, '').optional(),
  land_category: Joi.string()
    .valid('marginal', 'small', 'semi_medium', 'medium', 'large')
    .allow(null, '')
    .optional(),
  irrigation_src: Joi.string()
    .valid('canal', 'tube_well', 'open_well', 'tank', 'rainfed', 'drip', 'sprinkler', 'river', 'other')
    .allow(null, '')
    .optional(),
  well_depth: Joi.number().min(0).max(1000).allow(null, '').optional(),
  kharif_crop: Joi.string().trim().max(100).allow(null, '').optional(),
  rabi_crop: Joi.string().trim().max(100).allow(null, '').optional(),
  crop_intensity: Joi.string().trim().max(50).allow(null, '').optional(),
  soil_type: Joi.string().trim().max(100).allow(null, '').optional(),
  notes: Joi.string().trim().max(1000).allow(null, '').optional(),
});

const validateSubmission = (req, res, next) => {
  const { error, value } = submissionSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
    convert: true,
  });

  if (error) {
    const messages = error.details.map((d) => d.message).join(', ');
    return res.status(400).json({ success: false, error: messages });
  }

  // Replace empty strings with null for optional fields
  Object.keys(value).forEach((k) => {
    if (value[k] === '') value[k] = null;
  });

  req.body = value;
  next();
};

module.exports = { validateSubmission };
