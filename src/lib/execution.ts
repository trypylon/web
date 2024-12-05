import { Node, Edge } from "reactflow";
import { getNodeByType } from "@/nodes";
import { InputType, ExecutionContext } from "@/types/nodes";

interface ExecutionResult {
  success: boolean;
  output?: any;
  error?: string;
}

interface ExecuteFlowOptions {
  source: "ui" | "api" | "webhook";
  webhookData?: any;
}

export async function executeFlowApi(
  nodes: Node[],
  edges: Edge[],
  credentials: Record<string, string>,
  options: ExecuteFlowOptions = { source: "ui" }
): Promise<ExecutionResult> {
  try {
    // Set credentials
    Object.entries(credentials).forEach(([key, value]) => {
      process.env[key] = value;
    });

    // Build execution graph
    const { executionLevels, nodeMap } = buildExecutionGraph(nodes, edges);
    const results = new Map<string, string>();

    // Create execution context
    const context: ExecutionContext = {
      source: options.source,
      webhookData: options.webhookData,
    };

    // Execute nodes level by level
    const levels = Array.from(executionLevels.keys()).sort();
    for (const level of levels) {
      const nodesInLevel = executionLevels.get(level) || [];

      await Promise.all(
        nodesInLevel.map(async (nodeId) => {
          const node = nodeMap.get(nodeId);
          if (!node) return;
          const schemaNode = getNodeByType(node.data.type);
          if (!schemaNode || schemaNode.role !== "executor") return;

          // Get inputs from incoming edges
          const inputs = getNodeInputs(nodeId, edges, results);

          // Initialize and execute node
          const instance = await schemaNode.initialize(node.data, {
            credentials,
          });
          const result = await schemaNode.execute(
            instance,
            node.data,
            inputs,
            context
          );
          results.set(nodeId, result);
        })
      );
    }

    // Find end nodes (nodes with no outgoing edges)
    const endNodes = nodes.filter(
      (node) => !edges.some((edge) => edge.source === node.id)
    );

    // Get the results of end nodes
    const outputs = endNodes
      .map((node) => results.get(node.id))
      .filter(Boolean);

    // If this is a webhook call, try to parse the last output as JSON
    if (options.source === "webhook" && outputs.length > 0) {
      try {
        const lastOutput = outputs[outputs.length - 1];
        if (!lastOutput) {
          return { success: true, output: {} };
        }
        return {
          success: true,
          output: JSON.parse(lastOutput),
        };
      } catch (error) {
        // If parsing fails, return the raw output
        return {
          success: true,
          output: outputs[outputs.length - 1],
        };
      }
    }

    // For UI/API calls, join outputs with newlines
    return {
      success: true,
      output: outputs.join("\n"),
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

// Helper function to build execution graph
function buildExecutionGraph(nodes: Node[], edges: Edge[]) {
  const nodeMap = new Map(nodes.map((node) => [node.id, node]));
  const inDegree = new Map<string, number>();
  const levels = new Map<string, number>();

  nodes.forEach((node) => {
    inDegree.set(node.id, 0);
    levels.set(node.id, 0);
  });

  edges.forEach((edge) => {
    inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
  });

  const queue = nodes
    .filter((node) => (inDegree.get(node.id) || 0) === 0)
    .map((node) => node.id);

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    const currentLevel = levels.get(currentId) || 0;

    edges
      .filter((edge) => edge.source === currentId)
      .forEach((edge) => {
        levels.set(
          edge.target,
          Math.max(levels.get(edge.target) || 0, currentLevel + 1)
        );
        inDegree.set(edge.target, (inDegree.get(edge.target) || 0) - 1);
        if (inDegree.get(edge.target) === 0) {
          queue.push(edge.target);
        }
      });
  }

  const executionLevels = new Map<number, string[]>();
  nodes.forEach((node) => {
    const level = levels.get(node.id) || 0;
    if (!executionLevels.has(level)) {
      executionLevels.set(level, []);
    }
    executionLevels.get(level)?.push(node.id);
  });

  return { executionLevels, nodeMap };
}

// Helper function to get node inputs
function getNodeInputs(
  nodeId: string,
  edges: Edge[],
  results: Map<string, string>
): Record<InputType, string> {
  const inputs: Partial<Record<InputType, string[]>> = {};

  // First collect all inputs for each handle
  edges
    .filter((edge) => edge.target === nodeId)
    .forEach((edge) => {
      const sourceResult = results.get(edge.source);
      if (sourceResult && edge.targetHandle) {
        const handle = edge.targetHandle as InputType;
        if (!inputs[handle]) {
          inputs[handle] = [];
        }
        inputs[handle]!.push(sourceResult);
      }
    });

  // Then combine them into a single value for each handle
  const combinedInputs: Record<InputType, string> = {} as Record<
    InputType,
    string
  >;
  Object.entries(inputs).forEach(([handle, values]) => {
    if (handle === InputType.CONTEXT) {
      // For context inputs, combine into a JSON array
      combinedInputs[handle as InputType] = JSON.stringify(values);
    } else {
      // For other inputs, use the last value
      combinedInputs[handle as InputType] = values![values!.length - 1];
    }
  });

  return combinedInputs;
}
