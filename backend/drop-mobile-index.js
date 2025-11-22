require('dotenv').config();
const mongoose = require('mongoose');

/**
 * Script to drop the problematic orderId_1 index from the orders collection
 * 
 * This index was created for an old schema that used 'orderId' field,
 * but the current schema uses 'orderNumber' instead. The old index causes
 * duplicate key errors because all new orders have orderId: null.
 */

async function dropOrderIdIndex() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✅ Connected to MongoDB: ${conn.connection.host}`);
    
    // Get the orders collection
    const db = mongoose.connection.db;
    const ordersCollection = db.collection('orders');
    
    // List all indexes before dropping
    console.log('\n📋 Current indexes on orders collection:');
    const indexesBefore = await ordersCollection.indexes();
    indexesBefore.forEach(index => {
      console.log(`  - ${index.name}:`, JSON.stringify(index.key));
    });
    
    // Check if orderId_1 index exists
    const orderIdIndex = indexesBefore.find(idx => idx.name === 'orderId_1');
    
    if (!orderIdIndex) {
      console.log('\n✅ orderId_1 index not found. Nothing to drop.');
      await mongoose.connection.close();
      process.exit(0);
    }
    
    console.log('\n🗑️  Dropping orderId_1 index...');
    await ordersCollection.dropIndex('orderId_1');
    console.log('✅ Successfully dropped orderId_1 index');
    
    // List all indexes after dropping
    console.log('\n📋 Remaining indexes on orders collection:');
    const indexesAfter = await ordersCollection.indexes();
    indexesAfter.forEach(index => {
      console.log(`  - ${index.name}:`, JSON.stringify(index.key));
    });
    
    console.log('\n✅ Done! The duplicate key error should be resolved.');
    
    // Close connection
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    
    // If index doesn't exist, that's okay
    if (error.message.includes('index not found') || error.codeName === 'IndexNotFound') {
      console.log('✅ Index already removed or never existed. No action needed.');
      await mongoose.connection.close();
      process.exit(0);
    }
    
    console.error('Stack:', error.stack);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run the script
dropOrderIdIndex();
