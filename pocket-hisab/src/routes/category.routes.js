// ============================================================================
// src/routes/category.routes.js — /api/v1/categories
// ============================================================================

const express = require('express');
const categoryController = require('../controllers/category.controller');
const asyncHandler = require('../middleware/asyncHandler');
const validate = require('../middleware/validate');
const { createCategorySchema, updateCategorySchema } = require('../validators/categoryValidators');

const router = express.Router();

router.get('/', asyncHandler(categoryController.list));
router.post('/', validate(createCategorySchema, 'body'), asyncHandler(categoryController.create));
router.patch('/:id', validate(updateCategorySchema, 'body'), asyncHandler(categoryController.update));
router.delete('/:id', asyncHandler(categoryController.remove));

module.exports = router;
