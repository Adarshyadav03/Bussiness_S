const { z } = require('zod');

const validateSchema = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ');
      return res.status(400).json({
        success: false,
        message: `Validation failed: ${issues}`,
        error: 'VALIDATION_ERROR',
        details: error.issues,
      });
    }
    next(error);
  }
};

const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(1, { message: 'Password is required' }),
});

const signupSchema = z.object({
  name: z.string().min(1, { message: 'Name is required' }),
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(4, { message: 'Password must be at least 4 characters long' }),
});

const customerSchema = z.object({
  company_name: z.string().min(1, { message: 'Company name is required' }),
  contact_person: z.string().min(1, { message: 'Contact person is required' }),
  mobile: z.string().min(1, { message: 'Mobile number is required' }),
  email: z.string().email({ message: 'Invalid customer email address' }),
  city: z.string().min(1, { message: 'City is required' }),
});

const productSchema = z.object({
  product_code: z.string().min(1, { message: 'Product code is required' }),
  product_name: z.string().min(1, { message: 'Product name is required' }),
  category: z.string().min(1, { message: 'Category is required' }),
  unit: z.string().min(1, { message: 'Unit is required' }),
  base_price: z.number().min(0, { message: 'Base price must be greater than or equal to 0' }),
  physical_quantity: z.number().min(0).optional().default(0),
});

const enquiryItemSchema = z.object({
  product_id: z.number().int().positive({ message: 'Product ID must be a positive integer' }),
  quantity: z.number().int().positive({ message: 'Quantity must be greater than 0' }),
});

const enquirySchema = z.object({
  customer_id: z.number().int().positive({ message: 'Customer ID must be a positive integer' }),
  required_date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid required_date ISO string' }),
  notes: z.string().optional(),
  items: z.array(enquiryItemSchema).min(1, { message: 'At least one product item is required' }),
});

const quotationItemSchema = z.object({
  product_id: z.number().int().positive({ message: 'Product ID must be a positive integer' }),
  quantity: z.number().int().positive({ message: 'Quantity must be greater than 0' }),
  unit_price: z.number().min(0, { message: 'Unit price cannot be negative' }),
  discount_percent: z.number().min(0).max(100, { message: 'Discount must be between 0 and 100' }).default(0),
  gst_percent: z.number().min(0).max(100, { message: 'GST must be between 0 and 100' }).default(18),
});

const quotationSchema = z.object({
  enquiry_id: z.number().int().positive({ message: 'Enquiry ID must be a positive integer' }),
  valid_until: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid valid_until ISO string' }),
  items: z.array(quotationItemSchema).min(1, { message: 'At least one quotation item is required' }),
});

const quotationStatusSchema = z.object({
  status: z.enum(['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED'], { message: 'Invalid status' }),
});

const dispatchSchema = z.object({
  vehicle_number: z.string().min(1, { message: 'Vehicle number is required' }),
  driver_name: z.string().min(1, { message: 'Driver name is required' }),
});

const updateInventorySchema = z.object({
  physical_quantity: z.number().int().min(0, { message: 'Physical quantity must be >= 0' }),
});

module.exports = {
  validateSchema,
  loginSchema,
  signupSchema,
  customerSchema,
  productSchema,
  enquirySchema,
  quotationSchema,
  quotationStatusSchema,
  dispatchSchema,
  updateInventorySchema,
};
