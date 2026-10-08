const { MongoClient } = require('mongodb');

const LOCAL_URI = 'mongodb://127.0.0.1:27017/sportverse';
const ATLAS_URI = 'mongodb+srv://tomshibu49_db_user:Tom1234@cluster0.lhxoqjl.mongodb.net/sportverse?appName=Cluster0';

async function migrateData() {
    console.log('Connecting to local MongoDB...');
    const localClient = new MongoClient(LOCAL_URI);
    await localClient.connect();
    const localDb = localClient.db();
    console.log('Connected to local DB:', localDb.databaseName);

    console.log('Connecting to Atlas MongoDB...');
    const atlasClient = new MongoClient(ATLAS_URI);
    await atlasClient.connect();
    const atlasDb = atlasClient.db();
    console.log('Connected to Atlas DB:', atlasDb.databaseName);

    try {
        // Get all collections from the local database
        const collections = await localDb.listCollections().toArray();
        console.log(`Found ${collections.length} collections to migrate.`);

        for (const colInfo of collections) {
            const colName = colInfo.name;
            // Skip system collections
            if (colName.startsWith('system.')) continue;
            
            console.log(`\nMigrating collection: ${colName}`);
            const localCollection = localDb.collection(colName);
            const atlasCollection = atlasDb.collection(colName);

            // Optional: Drop the destination collection to start fresh
            try {
                await atlasCollection.drop();
                console.log(`Dropped existing collection '${colName}' on Atlas.`);
            } catch (err) {
                // Ignore drop error (likely collection doesn't exist yet)
            }

            // Fetch all documents from local collection
            const docs = await localCollection.find({}).toArray();
            console.log(`Fetched ${docs.length} documents from local '${colName}'.`);

            if (docs.length > 0) {
                // Insert into Atlas collection
                const result = await atlasCollection.insertMany(docs);
                console.log(`Inserted ${result.insertedCount} documents into Atlas '${colName}'.`);
            } else {
                console.log(`No documents to insert for '${colName}'.`);
            }
        }
        
        console.log('\nMigration completed successfully!');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await localClient.close();
        await atlasClient.close();
        console.log('Database connections closed.');
    }
}

migrateData();
