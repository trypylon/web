import { z } from "zod";
import { Bot } from "lucide-react";
import {
  BaseNode,
  NodeCategory,
  NodeData,
  NodeInitOptions,
  InputType,
  DebugLog,
  NodeRole,
} from "@/types/nodes";
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { PineconeStore } from "@langchain/pinecone";
import { Pinecone } from "@pinecone-database/pinecone";
import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
import { OpenAIEmbeddings } from "@langchain/openai";
import { createDebugLog } from "@/lib/debug";

interface ExtendedNodeData extends NodeData {
  _debugLogs?: DebugLog[];
}

export const OpenAINode: BaseNode = {
  id: "openai",
  type: "OpenAI",
  category: NodeCategory.LLM,
  name: "OpenAI",
  description: "OpenAI language models like GPT-4 and GPT-3.5",
  icon: Bot,
  version: "1.0.0",
  role: NodeRole.EXECUTOR,
  parameters: [
    {
      name: "model",
      label: "Model",
      type: "select",
      options: [
        { label: "GPT-4o-Mini", value: "gpt-4o-mini" },
        { label: "GPT-4", value: "gpt-4" },
        { label: "GPT-4 Turbo", value: "gpt-4-turbo" },
        { label: "GPT-3.5 Turbo", value: "gpt-3.5-turbo" },
      ],
      default: "gpt-4o-mini",
      description: "The OpenAI model to use",
    },
    {
      name: "temperature",
      label: "Temperature",
      type: "number",
      default: 0.7,
      optional: true,
      description: "Controls randomness (0-2)",
      validation: z.number().min(0).max(2),
    },
    {
      name: "prompt",
      label: "System Prompt",
      type: "string",
      description: "The system prompt that guides the model behavior",
      validation: z.string().min(1),
    },
  ],
  credentials: [
    {
      name: "openaiApiKey",
      required: true,
      description: "Your OpenAI API key",
    },
    {
      name: "huggingfaceApiKey",
      required: false,
      description:
        "Your HuggingFace API key (required for e5-large embeddings)",
    },
  ],
  inputs: {
    prompt: {
      required: false,
      description: "Dynamic prompt to override the default prompt",
    },
    context: {
      required: false,
      description: "Additional context to be injected into the prompt",
    },
    memory: {
      required: false,
      description: "Chat history or memory from previous interactions",
    },
    vectorstore: {
      required: false,
      description: "Retrieved documents from a vector store for RAG",
    },
  },
  outputs: [
    {
      type: "text",
      schema: z.string(),
    },
  ],

  async initialize(nodeData: NodeData, options: NodeInitOptions) {
    const model = nodeData.parameters.model || "gpt-4";
    const temperature = nodeData.parameters.temperature || 0.7;

    const llm = new ChatOpenAI({
      modelName: model,
      temperature,
      openAIApiKey: process.env.OPENAI_API_KEY,
      maxRetries: 3,
      maxConcurrency: 1,
    });

    return { llm };
  },

  async execute(
    instance: { llm: ChatOpenAI },
    nodeData?: NodeData,
    inputs?: Record<InputType, string>
  ) {
    const updatedNodeData = { ...nodeData } as ExtendedNodeData;
    const debugLogs: DebugLog[] = [];
    const promptText = inputs?.prompt || nodeData?.parameters?.prompt || "";

    debugLogs.push(createDebugLog("input", "Initial Prompt", promptText));

    // Build template and variables based on available inputs
    let template = "{input}";
    const inputValues: Record<string, string> = {
      input: promptText,
    };

    if (inputs?.vectorstore) {
      try {
        const vectorStoreConfig = JSON.parse(inputs.vectorstore);
        debugLogs.push(
          createDebugLog(
            "intermediate",
            "Vector Store Config",
            vectorStoreConfig
          )
        );

        // Choose embedding model based on dimensions
        let embeddings;
        console.log(
          "Vector dimensions:",
          vectorStoreConfig.dimensions,
          typeof vectorStoreConfig.dimensions
        );

        // Fix the comparison - ensure we're comparing numbers
        const dimensions = Number(vectorStoreConfig.dimensions);
        if (dimensions === 1024) {
          console.log("Using Microsoft e5-large embeddings");
          embeddings = new HuggingFaceInferenceEmbeddings({
            apiKey: process.env.HUGGINGFACE_API_KEY,
            model: "intfloat/multilingual-e5-large",
          });
        } else {
          console.log("Using OpenAI embeddings");
          embeddings = new OpenAIEmbeddings({
            openAIApiKey: process.env.OPENAI_API_KEY,
          });
        }

        // Initialize Pinecone
        const pinecone = new Pinecone({
          apiKey: process.env.PINECONE_API_KEY!,
        });

        const index = pinecone.Index(vectorStoreConfig.indexName);

        // Create vector store with the embeddings
        const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
          pineconeIndex: index,
          namespace: vectorStoreConfig.namespace,
        });

        // Generate search query
        const queryGenPrompt = PromptTemplate.fromTemplate(
          `Given the following user request, generate a concise search query that would help find relevant information in a database of movies.
          Focus on key terms and concepts that would match movie descriptions.

          User Request: {input}

          Search Query:`
        );
        const searchQuery = await instance.llm.invoke(
          await queryGenPrompt.format({ input: promptText })
        );

        debugLogs.push(
          createDebugLog(
            "intermediate",
            "Generated Search Query",
            searchQuery.content
          )
        );

        // Search vector store
        const docs = await vectorStore.similaritySearch(
          searchQuery.content as string,
          vectorStoreConfig.topK || 3
        );

        debugLogs.push(
          createDebugLog(
            "intermediate",
            "Retrieved Documents",
            docs.map((doc) => ({
              content: doc.pageContent,
              metadata: doc.metadata,
            }))
          )
        );

        if (!docs || docs.length === 0) {
          console.log("No documents found in vector store");
          template = `You are a helpful assistant. The user asked: {input}

Unfortunately, I couldn't find any relevant information in the database. Please provide a general response or suggest alternatives.`;
        } else {
          // Now format a response using the retrieved documents
          template = `You are a helpful assistant with access to a movie database. 
Use the following retrieved movie information to help answer the user's request.
If the retrieved movies aren't relevant or sufficient, you can suggest similar movies based on the user's intent.

Retrieved Movie Information:
{docs}

User Request: {input}

Please provide a friendly, helpful response that directly addresses the user's request.`;

          // Format the documents to include metadata
          inputValues.docs = docs
            .map((doc) => {
              const metadata = doc.metadata;
              return `Title: ${metadata.title} (${metadata.year})
Box Office: $${metadata["box-office"].toLocaleString()}
Genre: ${metadata.genre}
Summary: ${metadata.summary}`;
            })
            .join("\n\n");

          console.log("Formatted docs:", inputValues.docs);
        }
      } catch (error) {
        if (error instanceof Error) {
          debugLogs.push(
            createDebugLog("intermediate", "Vector Store Error", error.message)
          );
        } else {
          debugLogs.push(
            createDebugLog(
              "intermediate",
              "Vector Store Error",
              "Unknown error"
            )
          );
        }
        throw error;
      }
    }

    // Add context if available
    if (inputs?.context) {
      template = `Additional Context:\n{context}\n\n${template}`;
      inputValues.context = inputs.context;
    }

    // Add memory if available
    if (inputs?.memory) {
      template = `Conversation History:\n{memory}\n\n${template}`;
      inputValues.memory = inputs.memory;
    }

    // Create and format the prompt
    console.log("Final template:", template);
    console.log("Final input values:", inputValues);

    const promptTemplate = PromptTemplate.fromTemplate(template);
    const formattedPrompt = await promptTemplate.format(inputValues);

    debugLogs.push(
      createDebugLog("intermediate", "Final Formatted Prompt", formattedPrompt)
    );

    // Get response from LLM
    const response = await instance.llm.invoke(formattedPrompt);

    debugLogs.push(createDebugLog("output", "LLM Response", response.content));

    // Update the nodeData with debug logs
    updatedNodeData._debugLogs = debugLogs;
    Object.assign(nodeData || {}, { _debugLogs: debugLogs });

    return response.content as string;
  },
};
