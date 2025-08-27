const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

async function setupAdmin() {
  try {
    const mongoUri = 'mongodb+srv://mdtuhinhelal0_db_user:84LW4mUTY6rD0CVU@cluster0.zhazzet.mongodb.net/visa-system?retryWrites=true&w=majority';
    
    console.log('Attempting MongoDB connection for admin setup...');
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('MongoDB connected successfully for admin setup');
    
    // Check if admin already exists
    const adminExists = await User.findOne({ role: 'admin' });
    if (adminExists) {
      console.log('Admin user already exists');
      await mongoose.connection.close();
      process.exit(0);
    }
    
    // Hash password before saving
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash('Tuhin@332832', saltRounds);
    
    // Create admin user
    const adminUser = new User({
      username: 'admin',
      password: hashedPassword,
      role: 'admin'
    });
    
    await adminUser.save();
    console.log('Admin user created successfully');
    console.log('Username: admin');
    console.log('Password: Tuhin@332832');
    
    // Close connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed after admin setup');
    process.exit(0);
  } catch (error) {
    console.error('Error setting up admin:', error);
    
    // Try to close connection if it was opened
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
    
    process.exit(1);
  }
}

// Handle application termination
process.on('SIGINT', async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('MongoDB connection closed through app termination');
    }
    process.exit(0);
  } catch (err) {
    console.error('Error closing MongoDB connection:', err);
    process.exit(1);
  }
});

setupAdmin();