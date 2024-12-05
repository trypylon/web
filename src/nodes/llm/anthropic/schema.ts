import { z } from "zod";
import { MessageSquare } from "lucide-react";
import {
  BaseNode,
  NodeCategory,
  NodeData,
  NodeInitOptions,
  InputType,
  DebugLog,
  NodeRole,
  OutputType,
} from "@/types/nodes";
import { ChatAnthropic } from "@langchain/anthropic";
import { PromptTemplate } from "@langchain/core/prompts";
import { handleVectorStore } from "@/lib/llm";
import { handleJsonOutput } from "@/lib/json";
import { BaseLanguageModel } from "@langchain/core/language_models/base";
import { createDebugLog } from "@/lib/debug";

interface ExtendedNodeData extends NodeData {
  _debugLogs?: DebugLog[];
}

export const AnthropicNode: BaseNode = {
  id: "anthropic",
  type: "Anthropic",
  category: NodeCategory.LLM,
  name: "Anthropic",
  description: "Anthropic language models like Claude",
  icon: MessageSquare,
  version: "1.0.0",
  role: NodeRole.EXECUTOR,
  parameters: [
    {
      name: "model",
      label: "Model",
      type: "select",
      options: [
        { label: "Claude 3.5 Sonnet", value: "claude-3-5-sonnet-latest" },
        { label: "Claude 3 Opus", value: "claude-3-opus" },
        { label: "Claude 2.1", value: "claude-2.1" },
      ],
      default: "claude-3-5-sonnet-latest",
      description: "The Anthropic model to use",
    },
    {
      name: "temperature",
      label: "Temperature",
      type: "number",
      default: 0.7,
      optional: true,
      description: "Controls randomness (0-1)",
      validation: z.number().min(0).max(1),
    },
    {
      name: "useJsonOutput",
      label: "Format Output as JSON",
      type: "boolean",
      default: false,
      description: "Whether to format the output as a specific JSON structure",
    },
    {
      name: "jsonSchema",
      label: "JSON Schema",
      type: "json",
      description: "The JSON schema that defines the output structure",
      conditions: [
        {
          field: "useJsonOutput",
          value: true,
        },
      ],
    },
  ],
  credentials: [
    {
      name: "anthropicApiKey",
      required: true,
      description: "Your Anthropic API key",
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
    vectorstore: {
      required: false,
      description: "Retrieved documents from a vector store for RAG",
      isAdvanced: true,
    },
    memory: {
      required: false,
      description: "Chat history or memory from previous interactions",
    },
  },
  outputs: {
    [OutputType.TEXT]: {
      description: "The generated text response from the model",
      schema: z.string(),
    },
    [OutputType.JSON]: {
      description: "The structured JSON response from the model",
      schema: z.any(), // Dynamic schema based on user input
    },
  },

  async initialize(nodeData: NodeData, options: NodeInitOptions) {
    const model = nodeData.parameters.model || "claude-3-5-sonnet-latest";
    const temperature = nodeData.parameters.temperature || 0.7;

    const llm = new ChatAnthropic({
      modelName: model,
      temperature,
      anthropicApiKey:
        options.credentials?.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY,
      maxRetries: 3,
      maxConcurrency: 1,
      clientOptions: {
        defaultHeaders: {
          "anthropic-dangerous-direct-browser-access": "true",
        },
      },
    });

    return { llm };
  },

  async execute(
    instance: {
      llm: ChatAnthropic;
    },
    nodeData?: NodeData,
    inputs?: Record<InputType, string>
  ) {
    console.log("Anthropic execute called with inputs:", inputs);

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
      console.log("Processing vectorstore input");
      const vectorStoreResponse = await handleVectorStore({
        llm: instance.llm as unknown as BaseLanguageModel<any, any>,
        vectorStoreInput: inputs.vectorstore,
        userPrompt: promptText,
        debugLogs: [],
      });

      template = vectorStoreResponse.template;
      Object.assign(inputValues, vectorStoreResponse.inputValues);
      debugLogs.push(...vectorStoreResponse.debugLogs);
    }

    // Add context if available
    if (inputs?.context) {
      const contextValue =
        typeof inputs.context === "object"
          ? JSON.stringify(inputs.context, null, 2)
          : inputs.context;
      template = `Additional Context:\n{context}\n\n${template}`;
      inputValues.context = contextValue;
    }

    // Add memory if available
    if (inputs?.memory) {
      template = `Conversation History:\n{memory}\n\n${template}`;
      inputValues.memory = inputs.memory;
    }

    // Create and format the prompt
    const promptTemplate = PromptTemplate.fromTemplate(template);
    const formattedPrompt = await promptTemplate.format(inputValues);

    debugLogs.push(
      createDebugLog("intermediate", "Final Formatted Prompt", formattedPrompt)
    );

    // Get response from LLM
    let response;
    const useJsonOutput = nodeData?.parameters?.useJsonOutput || false;
    const jsonSchema = nodeData?.parameters?.jsonSchema;

    if (useJsonOutput && jsonSchema) {
      // Handle JSON output
      const jsonResponse = await handleJsonOutput({
        llm: instance.llm as unknown as BaseLanguageModel,
        jsonSchema,
        prompt: formattedPrompt,
        debugLogs,
      });
      response = jsonResponse.response;
      debugLogs.push(...jsonResponse.debugLogs);
    } else {
      // Regular text response
      response = await instance.llm.invoke(formattedPrompt);
      response = response.content;
      debugLogs.push(createDebugLog("output", "LLM Response", response));
    }

    // Update the nodeData with debug logs
    updatedNodeData._debugLogs = debugLogs;
    Object.assign(nodeData || {}, { _debugLogs: debugLogs });

    return response;
  },
};
