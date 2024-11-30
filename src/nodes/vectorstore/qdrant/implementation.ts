import { OpenAIEmbeddings } from "@langchain/openai";
import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
import { QdrantVectorStore } from "@langchain/community/vectorstores/qdrant";

export default {
  async initialize(config: any) {
    console.log("Qdrant implementation initialize called");

    // Choose embedding model based on dimensions
    let embeddings;
    const dimensions = Number(config.dimensions);

    if (dimensions === 1024) {
      embeddings = new HuggingFaceInferenceEmbeddings({
        apiKey: process.env.HUGGINGFACE_API_KEY,
        model: "intfloat/multilingual-e5-large",
      });
    } else {
      embeddings = new OpenAIEmbeddings({
        openAIApiKey: process.env.OPENAI_API_KEY,
      });
    }

    // Create vector store with the embeddings
    const vectorStore = await QdrantVectorStore.fromExistingCollection(
      embeddings,
      {
        url: config.url,
        apiKey: process.env.QDRANT_API_KEY,
        collectionName: config.collectionName,
      }
    );

    return {
      search: async (query: string, topK: number) => {
        console.log("Qdrant search called with query:", query);
        const docs = await vectorStore.similaritySearch(query, topK);
        return { docs };
      },
    };
  },
};
