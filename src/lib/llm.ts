import { PromptTemplate } from "@langchain/core/prompts";
import { createDebugLog } from "@/lib/debug";
import {
  HandleVectorStoreOptions,
  VectorStoreConfig,
  VectorStoreResponse,
} from "@/types/vectorstore";

export async function handleVectorStore({
  llm,
  vectorStoreInput,
  userPrompt,
  debugLogs,
}: HandleVectorStoreOptions): Promise<VectorStoreResponse> {
  console.log("handleVectorStore called with prompt:", userPrompt);

  try {
    const vectorStoreConfig: VectorStoreConfig = JSON.parse(vectorStoreInput);
    debugLogs.push(
      createDebugLog("intermediate", "Vector Store Config", vectorStoreConfig)
    );

    // Generate search query using the LLM
    const queryGenPrompt = PromptTemplate.fromTemplate(
      `Given the following user request, generate a concise search query that would help find relevant information.
      Focus on key terms and concepts.

      User Request: {input}

      Search Query:`
    );

    const searchQuery = await llm.invoke(
      await queryGenPrompt.format({ input: userPrompt })
    );

    debugLogs.push(
      createDebugLog(
        "intermediate",
        "Generated Search Query",
        searchQuery.content
      )
    );

    // Get the appropriate vector store handler
    const vectorStore = await getVectorStore(vectorStoreConfig);

    // Search vector store
    const searchResult = await vectorStore.search(
      searchQuery.content as string,
      vectorStoreConfig.topK || 3
    );

    debugLogs.push(
      createDebugLog(
        "intermediate",
        "Retrieved Documents",
        searchResult.docs.map((doc: { pageContent: any; metadata: any }) => ({
          content: doc.pageContent,
          metadata: doc.metadata,
        }))
      )
    );

    if (!searchResult.docs || searchResult.docs.length === 0) {
      return {
        template: `You are a helpful assistant. The user asked: {input}

Unfortunately, I couldn't find any relevant information in the database. Please provide a general response or suggest alternatives.`,
        inputValues: { input: userPrompt },
        debugLogs,
      };
    }

    return {
      template: `You are a helpful assistant with access to a knowledge base. 
Use the following retrieved information to help answer the user's request.
If the retrieved information isn't relevant or sufficient, you can provide a general response based on the user's intent.

Retrieved Information:
{docs}

User Request: {input}

Please provide a friendly, helpful response that directly addresses the user's request.`,
      inputValues: {
        input: userPrompt,
        docs: formatDocs(searchResult.docs, vectorStoreConfig.type),
      },
      debugLogs,
    };
  } catch (error) {
    if (error instanceof Error) {
      debugLogs.push(
        createDebugLog("intermediate", "Vector Store Error", error.message)
      );
    }
    throw error;
  }
}

// Add a cache for vector store instances
const vectorStoreCache = new Map<string, any>();

// Helper function to get the appropriate vector store instance
async function getVectorStore(config: VectorStoreConfig) {
  const cacheKey = `${config.type}-${config.indexName}-${config.namespace}`;

  if (vectorStoreCache.has(cacheKey)) {
    console.log("Returning cached vector store instance");
    return vectorStoreCache.get(cacheKey);
  }

  try {
    const vectorStoreModule = await import(
      `@/nodes/vectorstore/${config.type}/implementation`
    ).catch((e) => {
      console.error(
        `Failed to import vector store implementation: ${e.message}`
      );
      throw new Error(`Vector store type '${config.type}' is not supported`);
    });

    const instance = await vectorStoreModule.default.initialize(config);
    vectorStoreCache.set(cacheKey, instance);
    return instance;
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error initializing vector store:", error.message);
      throw new Error(`Failed to initialize vector store: ${error.message}`);
    } else {
      console.error("Error initializing vector store:", error);
      throw new Error("Failed to initialize vector store: Unknown error");
    }
  }
}

// Helper function to format documents based on vector store type
function formatDocs(docs: any[], storeType: string) {
  switch (storeType) {
    case "pinecone":
      return docs
        .map((doc) => {
          const metadata = doc.metadata;
          return `Title: ${metadata.title} (${metadata.year})
Box Office: $${metadata["box-office"].toLocaleString()}
Genre: ${metadata.genre}
Summary: ${metadata.summary}`;
        })
        .join("\n\n");
    case "qdrant":
      return docs
        .map((doc) => {
          const metadata = doc.metadata;
          return `Title: ${metadata.title || "Untitled"}
${metadata.description || doc.pageContent}
${Object.entries(metadata)
  .filter(([key]) => !["title", "description"].includes(key))
  .map(([key, value]) => `${key}: ${value}`)
  .join("\n")}`;
        })
        .join("\n\n");
    default:
      return docs
        .map(
          (doc) => `Content: ${doc.pageContent}
Metadata: ${JSON.stringify(doc.metadata)}`
        )
        .join("\n\n");
  }
}
