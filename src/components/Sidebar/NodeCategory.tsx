import { BaseNode } from "@/types/nodes";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface NodeCategoryProps {
  name: string;
  nodes: BaseNode[];
}

export function NodeCategory({ name, nodes }: NodeCategoryProps) {
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData("application/reactflow", nodeType);
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value={name}>
        <AccordionTrigger className="text-sm hover:no-underline">
          {name}
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-2 pt-2">
            {nodes.map((node) => (
              <div
                key={node.type}
                className="flex items-center space-x-2 px-2 py-1.5 rounded-md cursor-move hover:bg-gray-100 dark:hover:bg-gray-800"
                draggable
                onDragStart={(e) => onDragStart(e, node.type)}
              >
                <node.icon className="w-4 h-4 text-gray-500" />
                <span className="text-sm">{node.name}</span>
              </div>
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
