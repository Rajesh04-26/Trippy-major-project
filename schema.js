const Joi = require("joi");

const stringOrArray = Joi.alternatives().try(
  Joi.array().items(Joi.string().trim()),
  Joi.string().trim()
);

module.exports.listingSchema = Joi.object({
  listing: Joi.object({
    title: Joi.string().trim().required(),
    description: Joi.string().trim().required(),
    location: Joi.string().trim().required(),
    country: Joi.string().trim().required(),
    price: Joi.number().min(0).required(),

    image: Joi.any(),
    gallery: Joi.any(),

    overview: Joi.object({
      inclusions: stringOrArray.default([]),
      themes: stringOrArray.default([]),
      description: Joi.string().allow("").default("")
    }).default({}),

    itinerary: Joi.array()
      .items(
        Joi.object({
          day: Joi.number(),
          hotel: Joi.string().allow(""),
          plan: Joi.string().allow(""),
          meal: Joi.string().valid("included", "not-included").default("not-included")
        })
      )
      .max(5)
      .default([]),

    inclusions: stringOrArray.default([]),
    exclusions: stringOrArray.default([])
  }).required()
});

module.exports.reviewSchema = Joi.object({
  review: Joi.object({
    rating: Joi.number().min(1).max(5).required(),
    comment: Joi.string().trim().required()
  }).required()
});
