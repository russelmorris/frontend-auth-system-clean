import weaviate, { WeaviateClient, ApiKey } from 'weaviate-client';

let client: WeaviateClient | null = null;

export async function getWeaviateClient(): Promise<WeaviateClient> {
  if (!client) {
    // Use environment variables - fallbacks removed for security
    const weaviateUrl = process.env.WEAVIATE_URL;
    const weaviateKey = process.env.WEAVIATE_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;
    
    if (!weaviateUrl || !weaviateKey || !openaiKey) {
      throw new Error('Missing required Weaviate environment variables');
    }
    
    client = await weaviate.connectToWeaviateCloud(
      weaviateUrl,
      {
        authCredentials: new ApiKey(weaviateKey),
        headers: {
          'X-OpenAI-Api-Key': openaiKey,
        }
      }
    );
  }
  return client;
}