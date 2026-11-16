const { z } = require('zod');
const { TASK_STATUSES, TASK_PRIORITIES } = require('../utils/constants');

const objectId = z.string().regex(/^[a-fA-F0-9]{24}$/, 'Invalid task id');

// Accepts an ISO date string, null (clear the due date) or "" (treated as null).
const dueDate = z.preprocess(
  (value) => (value === '' ? null : value),
  z.union([z.null(), z.coerce.date({ invalid_type_error: 'Invalid due date' })])
);

const taskBody = z
  .object({
    title: z
      .string({ required_error: 'Title is required' })
      .trim()
      .min(1, 'Title is required')
      .max(120, 'Title must be at most 120 characters'),
    description: z.string().trim().max(2000, 'Description must be at most 2000 characters').optional(),
    status: z.enum(TASK_STATUSES, { errorMap: () => ({ message: 'Invalid status' }) }).optional(),
    priority: z.enum(TASK_PRIORITIES, { errorMap: () => ({ message: 'Invalid priority' }) }).optional(),
    dueDate: dueDate.optional(),
  })
  .strict();

const create = { body: taskBody };

const update = {
  params: z.object({ id: objectId }),
  body: taskBody
    .partial()
    .refine((body) => Object.keys(body).length > 0, { message: 'Provide at least one field to update' }),
};

const byId = { params: z.object({ id: objectId }) };

const list = {
  query: z
    .object({
      search: z.string().trim().max(100).optional(),
      status: z.enum(TASK_STATUSES).optional(),
      priority: z.enum(TASK_PRIORITIES).optional(),
      sortBy: z.enum(['createdAt', 'dueDate']).default('createdAt'),
      order: z.enum(['asc', 'desc']).default('desc'),
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(50).default(10),
    })
    .strict(),
};

module.exports = { create, update, byId, list };
