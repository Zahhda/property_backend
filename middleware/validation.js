const Joi = require('joi');

/**
 * Middleware for validating request data
 * @param {Object} schema - Joi validation schema
 * @param {string} property - Request property to validate (body, params, query)
 * @returns {Function} Express middleware function
 */
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
      allowUnknown: false
    });

    if (!error) {
      next();
    } else {
      const errorMessages = error.details.map(details => ({
        field: details.path.join('.'),
        message: details.message
      }));

      res.status(400).json({
        status: 'error',
        message: 'Validation error',
        errors: errorMessages
      });
    }
  };
};

// User validation schemas
const userSchema = Joi.object({
  firstName: Joi.string().min(2).max(50).required()
    .messages({
      'string.min': 'First name must be at least 2 characters',
      'string.max': 'First name must be less than 50 characters',
      'any.required': 'First name is required'
    }),
  lastName: Joi.string().min(2).max(50).required()
    .messages({
      'string.min': 'Last name must be at least 2 characters',
      'string.max': 'Last name must be less than 50 characters',
      'any.required': 'Last name is required'
    }),
  email: Joi.string().email().required()
    .messages({
      'string.email': 'Please enter a valid email address',
      'any.required': 'Email is required'
    }),
  mobileNumber: Joi.string().pattern(/^\d{10}$/).required()
    .messages({
      'string.pattern.base': 'Mobile number must be 10 digits',
      'any.required': 'Mobile number is required'
    }),
  roleId: Joi.string().guid({ version: 'uuidv4' }).required()
    .messages({
      'string.guid': 'Invalid role ID',
      'any.required': 'Role is required'
    }),
  status: Joi.string().valid('active', 'inactive', 'suspended').default('active')
    .messages({
      'any.only': 'Status must be active, inactive, or suspended'
    })
});

const createUserSchema = userSchema.keys({
  password: Joi.string()
    .min(8)
    .max(100)
    .pattern(/[A-Z]/)
    .pattern(/[a-z]/)
    .pattern(/[0-9]/)
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters',
      'string.max': 'Password must be less than 100 characters',
      'string.pattern.base': 'Password must contain uppercase, lowercase, and number',
      'any.required': 'Password is required'
    })
});

const updateUserSchema = userSchema.keys({
  password: Joi.string()
    .min(8)
    .max(100)
    .pattern(/[A-Z]/)
    .pattern(/[a-z]/)
    .pattern(/[0-9]/)
    .optional()
    .messages({
      'string.min': 'Password must be at least 8 characters',
      'string.max': 'Password must be less than 100 characters',
      'string.pattern.base': 'Password must contain uppercase, lowercase, and number'
    })
});

const resetPasswordSchema = Joi.object({
  password: Joi.string()
    .min(8)
    .max(100)
    .pattern(/[A-Z]/)
    .pattern(/[a-z]/)
    .pattern(/[0-9]/)
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters',
      'string.max': 'Password must be less than 100 characters',
      'string.pattern.base': 'Password must contain uppercase, lowercase, and number',
      'any.required': 'Password is required'
    })
});

// Role validation schemas
const roleSchema = Joi.object({
  name: Joi.string().min(2).max(50).required()
    .messages({
      'string.min': 'Role name must be at least 2 characters',
      'string.max': 'Role name must be less than 50 characters',
      'any.required': 'Role name is required'
    }),
  description: Joi.string().min(10).max(500).required()
    .messages({
      'string.min': 'Description must be at least 10 characters',
      'string.max': 'Description must be less than 500 characters',
      'any.required': 'Description is required'
    }),
  status: Joi.string().valid('active', 'inactive').default('active')
    .messages({
      'any.only': 'Status must be active or inactive'
    })
});

const rolePermissionsSchema = Joi.object({
  permissions: Joi.array().items(Joi.string().guid({ version: 'uuidv4' })).min(1).required()
    .messages({
      'array.min': 'At least one permission must be selected',
      'any.required': 'Permissions are required'
    })
});

// Property validation schemas
const basePropertySchema = Joi.object({
  title: Joi.string().min(5).max(100).required()
    .messages({
      'string.min': 'Title must be at least 5 characters',
      'string.max': 'Title must be less than 100 characters',
      'any.required': 'Title is required'
    }),
  description: Joi.string().min(20).max(2000).required()
    .messages({
      'string.min': 'Description must be at least 20 characters',
      'string.max': 'Description must be less than 2000 characters',
      'any.required': 'Description is required'
    }),
  price: Joi.number().min(0).required()
    .messages({
      'number.base': 'Price must be a number',
      'number.min': 'Price must be a non-negative number',
      'any.required': 'Price is required'
    }),
  propertyType: Joi.string().valid('flat', 'house', 'villa', 'pg', 'flatmate').required()
    .messages({
      'any.only': 'Property type must be flat, house, villa, pg, or flatmate',
      'any.required': 'Property type is required'
    }),
  address: Joi.string().min(5).max(200).required()
    .messages({
      'string.min': 'Address must be at least 5 characters',
      'string.max': 'Address must be less than 200 characters',
      'any.required': 'Address is required'
    }),
  city: Joi.string().min(2).required()
    .messages({
      'string.min': 'City is required',
      'any.required': 'City is required'
    }),
  state: Joi.string().min(2).required()
    .messages({
      'string.min': 'State is required',
      'any.required': 'State is required'
    }),
  pincode: Joi.string().pattern(/^\d{6}$/).optional()
    .messages({
      'string.pattern.base': 'Pincode must be 6 digits'
    }),
  availabilityStatus: Joi.string().valid('available', 'rented', 'sold', 'pending').default('available')
    .messages({
      'any.only': 'Availability status must be available, rented, sold, or pending'
    }),
  amenities: Joi.array().items(Joi.string()).default([]),
  purpose: Joi.string().valid('residential', 'commercial').default('residential'),
  furnishing: Joi.string().valid('unfurnished', 'semi-furnished', 'fully-furnished').default('unfurnished'),
  leaseTerms: Joi.string().allow('').optional(),
  petFriendly: Joi.boolean().default(false),
  latitude: Joi.string().allow('').optional(),
  longitude: Joi.string().allow('').optional(),
  moveInDate: Joi.date().iso().optional()
});

// Property type specific validation
const flatPropertySchema = basePropertySchema.keys({
  flatType: Joi.string().valid('1bhk', '2bhk', '3bhk', '4bhk').optional(),
  bedrooms: Joi.number().integer().positive().optional(),
  bathrooms: Joi.number().integer().positive().optional()
});

const housePropertySchema = basePropertySchema.keys({
  numRooms: Joi.number().integer().positive().optional(),
  numBathrooms: Joi.number().integer().positive().optional()
});

const villaPropertySchema = basePropertySchema.keys({
  numRooms: Joi.number().integer().positive().optional(),
  numBathrooms: Joi.number().integer().positive().optional()
});

const pgPropertySchema = basePropertySchema.keys({
  pgRoomType: Joi.string().valid('single', 'double', 'triple', 'sharing').optional()
});

const propertySchema = Joi.alternatives().conditional('propertyType', {
  switch: [
    { is: 'flat', then: flatPropertySchema },
    { is: 'house', then: housePropertySchema },
    { is: 'villa', then: villaPropertySchema },
    { is: 'pg', then: pgPropertySchema },
    { is: 'flatmate', then: basePropertySchema }
  ]
});

// Login validation schema
const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required()
});

// Registration validation schema
const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  name: Joi.string().required()
});

// Update property validation schema - all fields optional
const updatePropertySchema = Joi.object({
  title: Joi.string(),
  description: Joi.string(),
  price: Joi.number().positive(),
  type: Joi.string().valid('apartment', 'house', 'villa', 'land', 'commercial'),
  status: Joi.string().valid('available', 'sold', 'pending'),
  location: Joi.object({
    address: Joi.string(),
    city: Joi.string(),
    state: Joi.string(),
    country: Joi.string(),
    zipCode: Joi.string(),
    coordinates: Joi.object({
      latitude: Joi.number(),
      longitude: Joi.number()
    })
  }),
  features: Joi.array().items(Joi.string()),
  images: Joi.array().items(Joi.string().uri()),
  bedrooms: Joi.number().integer().min(0),
  bathrooms: Joi.number().integer().min(0),
  area: Joi.number().positive(),
  yearBuilt: Joi.number().integer().min(1800).max(new Date().getFullYear())
});

// Visit validation schema
const visitSchema = Joi.object({
  propertyId: Joi.string().uuid().required(),
  scheduledDate: Joi.date().iso().min('now').required(),
  notes: Joi.string().allow(''),
  preferredTimeSlot: Joi.string().valid('morning', 'afternoon', 'evening').required()
});

// Feedback validation schema
const feedbackSchema = Joi.object({
  rating: Joi.number().min(1).max(5).required(),
  comment: Joi.string().required()
});

// Export all schemas and middleware
module.exports = {
  validate,
  createUserSchema,
  updateUserSchema,
  resetPasswordSchema,
  roleSchema,
  rolePermissionsSchema,
  propertySchema,
  loginSchema,
  registerSchema,
  updatePropertySchema,
  visitSchema,
  feedbackSchema
};
