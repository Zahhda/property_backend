// Import routes
const userRoutes = require('./routes/users');
const roleRoutes = require('./routes/roles');
const propertyRoutes = require('./routes/properties');
const authRoutes = require('./routes/auth'); // Add auth routes

// ... existing middleware setup ...

// Use routes
app.use('/api/users', userRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/auth', authRoutes); // Add auth routes endpoint

// ... rest of the file ... 