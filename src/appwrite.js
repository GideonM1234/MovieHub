// Import Appwrite modules needed to interact with the database
import { Query, Client, Databases, ID } from "appwrite";

// Get configuration values from environment variables
// These are API credentials stored in .env.local file
const PROJECT_ID = import.meta.env.VITE_APPWRITE_PROJECT_ID;
const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const COLLECTION_ID = import.meta.env.VITE_APPWRITE_COLLECTION_ID;

// Create a new Appwrite client
const client = new Client();
// Configure the client with the endpoint and project ID
client.setEndpoint("https://cloud.appwrite.io/v1").setProject(PROJECT_ID);

// Initialize the database connection using the configured client
const database = new Databases(client);

// Function to track and update search history in the database
// searchTerm: the movie name or term the user searched for
// movie: the movie object containing id, poster_path, etc.
export const updateSearchCount = async (searchTerm, movie) => {
	// Validate that all required environment variables are set
	if (!PROJECT_ID || !DATABASE_ID || !COLLECTION_ID) {
		console.error("Missing required Appwrite environment variables");
		throw new Error("Appwrite configuration is incomplete");
	}

	try {
		// Search the database for existing records with the same search term
		const result = await database.listDocuments(
			DATABASE_ID,
			COLLECTION_ID,
			[Query.equal("searchTerm", searchTerm)]
		);

		// Check if we found an existing search record
		if (result.documents.length > 0) {
			// If the search term already exists, get the first document
			const doc = result.documents[0];
			// Update the existing document by incrementing the count and updating movie info
			await database.updateDocument(DATABASE_ID, COLLECTION_ID, doc.$id, {
				count: doc.count + 1, // Increment search count by 1
				movie_id: movie.id, // Store the movie ID
				poster_url: `https://image.tmdb.org/t/p/w500${movie.poster_path}`, // Store the movie poster URL
			});
		} else {
			// If the search term doesn't exist, create a new record in the database
			await database.createDocument(
				DATABASE_ID,
				COLLECTION_ID,
				ID.unique(), // Generate a unique ID for this document
				{
					searchTerm: searchTerm, // Store the search term
					count: 1, // Initialize count to 1 (first search)
					movie_id: movie.id, // Store the movie ID
					poster_url: `https://image.tmdb.org/t/p/w500${movie.poster_path}`, // Store the movie poster URL
				}
			);
		}
	} catch (error) {
		// Log any errors that occur during database operations
		console.error("Error updating search count:", error);
		// Re-throw the error so the calling code can handle it
		throw error;
	}
};

export const TrendingMovies = async () => {
	try {
		const result = await database.listDocuments(
			DATABASE_ID,
			COLLECTION_ID,
			[Query.limit(6), Query.orderDesc("count")]
		);
		return result.documents;
	} catch (error) {
		console.error("Error updating search count:", error);
	}
};
