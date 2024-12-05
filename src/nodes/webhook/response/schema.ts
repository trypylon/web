import { z } from "zod";
import { WebhookIcon } from "lucide-react";
import {
  BaseNode,
  NodeCategory,
  NodeData,
  NodeInitOptions,
  InputType,
  NodeRole,
  OutputType,
} from "@/types/nodes";

export const WebhookResponseNode: BaseNode = {
  id: "api-output",
  type: "APIOutput",
  category: NodeCategory.TOOLS,
  name: "API Output",
  description:
    "Exit point for API responses. Data sent to this node will be returned to the API caller.",
  icon: WebhookIcon,
  version: "1.0.0",
  role: NodeRole.EXECUTOR,
  parameters: [],
  inputs: {
    [InputType.CONTEXT]: {
      required: true,
      description: "The data that should be returned to the API caller",
      label: "Response Data",
    },
  },
  outputs: {
    [OutputType.TEXT]: {
      description: "The API response that will be sent back to the caller",
      schema: z.any(),
    },
  },

  async initialize(nodeData: NodeData) {
    return {};
  },

  async execute(
    instance: {},
    nodeData?: NodeData,
    inputs?: Record<InputType, string>
  ) {
    const inputData = inputs?.context;
    if (!inputData) {
      throw new Error("API Output requires input data to return to the caller");
    }

    // Parse input as JSON if it's a string
    try {
      const data =
        typeof inputData === "string" ? JSON.parse(inputData) : inputData;
      return JSON.stringify(data, null, 2);
    } catch (error) {
      // If parsing fails, return the raw input
      return JSON.stringify({ data: inputData }, null, 2);
    }
  },
};
