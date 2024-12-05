import { z } from "zod";
import { Webhook } from "lucide-react";
import {
  BaseNode,
  NodeCategory,
  NodeData,
  NodeRole,
  OutputType,
  ExecutionContext,
} from "@/types/nodes";

const DEFAULT_MOCK_INPUT = {
  body: "i like haikus that involve samurai swords",
};

export const WebhookInputNode: BaseNode = {
  id: "api-input",
  type: "APIInput",
  category: NodeCategory.TOOLS,
  name: "API Input",
  description:
    "Entry point for API request data. In the UI, you can mock the request body that would come from an API call.",
  icon: Webhook,
  version: "1.0.0",
  role: NodeRole.EXECUTOR,
  parameters: [
    {
      name: "mockInput",
      label: "Mock Request Body",
      type: "json",
      description:
        "Test your flow by mocking what the API request body would look like",
      default: JSON.stringify(DEFAULT_MOCK_INPUT, null, 2),
    },
  ],
  inputs: {},
  outputs: {
    [OutputType.JSON]: {
      description: "The request body (from API in deployment, or mock in UI)",
      schema: z.any(),
    },
  },

  async initialize() {
    return {};
  },

  async execute(
    nodeInstance: any,
    nodeData?: NodeData,
    inputs?: Record<string, string>,
    context?: ExecutionContext
  ) {
    try {
      // If we're being called from a webhook endpoint
      if (context?.source === "webhook") {
        const webhookData = context.webhookData;

        // Handle different webhook data formats
        if (typeof webhookData === "string") {
          // If it's a string, try to parse it as JSON, otherwise wrap it in a body field
          try {
            return JSON.stringify(JSON.parse(webhookData));
          } catch {
            return JSON.stringify({ body: webhookData });
          }
        }

        // If it's an object with a body field, use it directly
        if (webhookData && typeof webhookData === "object") {
          if ("body" in webhookData) {
            return JSON.stringify(webhookData);
          }
          // If no body field, wrap the entire object in a body field
          return JSON.stringify({ body: webhookData });
        }

        // If no data or invalid type, return empty body
        return JSON.stringify({ body: "" });
      }

      // Otherwise we're in the UI or normal API execution, use mock input
      if (nodeData?.parameters?.mockInput) {
        const mockInput = JSON.parse(nodeData.parameters.mockInput);
        return JSON.stringify(mockInput);
      }

      // Fallback to default
      return JSON.stringify(DEFAULT_MOCK_INPUT);
    } catch (error) {
      console.error("Error in API Input node:", error);
      throw new Error("Invalid JSON input");
    }
  },
};
