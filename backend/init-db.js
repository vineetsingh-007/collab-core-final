const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Define a minimal schema just to trigger database creation
const DummySchema = new mongoose.Schema({ name: String });
const Dummy = mongoose.model('Dummy', DummySchema);

const initDb = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Successfully connected to MongoDB.');

    // Insert a dummy document to force creation of the database
    await Dummy.create({ name: 'Initializing database' });
    console.log('Database and dummy collection created!');

    // Clean up connections
    await mongoose.connection.close();
    console.log('Disconnected from MongoDB.');
    process.exit(0);
  } catch (error) {
    console.error('Error connecting to database:', error);
    process.exit(1);
  }
};

initDb();
