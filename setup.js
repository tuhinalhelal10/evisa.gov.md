const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://mdtuhinhelal0_db_user:84LW4mUTY6rD0CVU@cluster0.zhazzet.mongodb.net/visa-system?retryWrites=true&w=majority';

async function setupAdmin() {
    try {
        await mongoose.connect(mongoUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        // চেক করুন যদি অ্যাডমিন ইউজার ইতিমধ্যে exists
        const existingAdmin = await User.findOne({ role: 'admin' });
        if (existingAdmin) {
            console.log('Admin user already exists:');
            console.log(`Username: admin`);
            console.log('To reset password, delete the existing admin user first.');
            process.exit(0);
        }

        // নতুন অ্যাডমিন ইউজার তৈরি করুন
        const adminUser = new User({
            username: 'admin',
            password: 'Tuhin@332832', // এই পাসওয়ার্ডটি পরে পরিবর্তন করুন
            role: 'admin'
        });

        await adminUser.save();
        console.log('Admin user created successfully!');
        console.log('Username: admin');
        console.log('Password: Tuhin@332832');
        console.log('\n⚠️  Please change the default password after first login!');
    } catch (error) {
        console.error('Error setting up admin:', error);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
}

setupAdmin();