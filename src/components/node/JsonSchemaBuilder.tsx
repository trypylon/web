import React, { useState } from "react";
import { PlusCircle, Trash2, ChevronDown, GripVertical } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface JsonSchemaProperty {
  name: string;
  type: "string" | "number" | "boolean" | "array" | "object";
  description: string;
  required: boolean;
  items?: JsonSchemaProperty; // For array types
  properties?: JsonSchemaProperty[]; // For object types
}

interface JsonSchema {
  name: string;
  description: string;
  properties: JsonSchemaProperty[];
}

interface JsonSchemaBuilderProps {
  value: JsonSchema;
  onChange: (schema: JsonSchema) => void;
}

export function JsonSchemaBuilder({ value, onChange }: JsonSchemaBuilderProps) {
  const [expandedProperties, setExpandedProperties] = useState<string[]>([]);

  const toggleExpanded = (propertyName: string) => {
    setExpandedProperties((prev) =>
      prev.includes(propertyName)
        ? prev.filter((p) => p !== propertyName)
        : [...prev, propertyName]
    );
  };

  const updateProperty = (
    property: JsonSchemaProperty,
    index: number,
    parentProperties?: JsonSchemaProperty[]
  ) => {
    const properties = parentProperties || value.properties;
    const newProperties = [...properties];
    newProperties[index] = property;

    if (!parentProperties) {
      onChange({
        ...value,
        properties: newProperties,
      });
    }
    return newProperties;
  };

  const addProperty = (parentProperties?: JsonSchemaProperty[]) => {
    const newProperty: JsonSchemaProperty = {
      name: "newProperty",
      type: "string",
      description: "",
      required: true,
    };

    const properties = parentProperties || value.properties;
    const newProperties = [...properties, newProperty];

    if (!parentProperties) {
      onChange({
        ...value,
        properties: newProperties,
      });
    }
    return newProperties;
  };

  const removeProperty = (
    index: number,
    parentProperties?: JsonSchemaProperty[]
  ) => {
    const properties = parentProperties || value.properties;
    const newProperties = properties.filter((_, i) => i !== index);

    if (!parentProperties) {
      onChange({
        ...value,
        properties: newProperties,
      });
    }
    return newProperties;
  };

  const PropertyEditor = ({
    property,
    index,
    parentProperties,
    depth = 0,
  }: {
    property: JsonSchemaProperty;
    index: number;
    parentProperties?: JsonSchemaProperty[];
    depth?: number;
  }) => {
    const isExpanded = expandedProperties.includes(property.name);

    return (
      <div className={`space-y-2 ${depth > 0 ? "ml-4" : ""}`}>
        <div className="flex items-center space-x-2">
          <GripVertical className="w-4 h-4 text-gray-400" />
          <Input
            className="w-32"
            placeholder="Name"
            value={property.name}
            onChange={(e) =>
              updateProperty(
                { ...property, name: e.target.value },
                index,
                parentProperties
              )
            }
          />
          <Select
            value={property.type}
            onValueChange={(type: JsonSchemaProperty["type"]) =>
              updateProperty(
                {
                  ...property,
                  type,
                  // Reset items/properties when changing type
                  items:
                    type === "array"
                      ? {
                          name: "item",
                          type: "string",
                          description: "",
                          required: true,
                        }
                      : undefined,
                  properties: type === "object" ? [] : undefined,
                },
                index,
                parentProperties
              )
            }
          >
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="string">String</SelectItem>
              <SelectItem value="number">Number</SelectItem>
              <SelectItem value="boolean">Boolean</SelectItem>
              <SelectItem value="array">Array</SelectItem>
              <SelectItem value="object">Object</SelectItem>
            </SelectContent>
          </Select>
          <Input
            className="flex-1"
            placeholder="Description"
            value={property.description}
            onChange={(e) =>
              updateProperty(
                { ...property, description: e.target.value },
                index,
                parentProperties
              )
            }
          />
          <div className="flex items-center space-x-2">
            <Switch
              checked={property.required}
              onCheckedChange={(required) =>
                updateProperty(
                  { ...property, required },
                  index,
                  parentProperties
                )
              }
            />
            <Label>Required</Label>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => removeProperty(index, parentProperties)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
          {(property.type === "array" || property.type === "object") && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => toggleExpanded(property.name)}
            >
              <ChevronDown
                className={`w-4 h-4 transition-transform ${
                  isExpanded ? "rotate-180" : ""
                }`}
              />
            </Button>
          )}
        </div>

        {isExpanded && property.type === "array" && property.items && (
          <div className="ml-8 p-4 border-l-2 border-blue-500">
            <h4 className="text-sm font-medium mb-2">Array Item Type</h4>
            <PropertyEditor
              property={property.items}
              index={0}
              depth={depth + 1}
            />
          </div>
        )}

        {isExpanded && property.type === "object" && (
          <div className="ml-8 p-4 border-l-2 border-blue-500">
            <h4 className="text-sm font-medium mb-2">Object Properties</h4>
            {property.properties?.map((prop, i) => (
              <PropertyEditor
                key={i}
                property={prop}
                index={i}
                parentProperties={property.properties}
                depth={depth + 1}
              />
            ))}
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => addProperty(property.properties)}
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              Add Property
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Input
            placeholder="Schema Name"
            value={value.name}
            onChange={(e) =>
              onChange({
                ...value,
                name: e.target.value,
              })
            }
          />
          <Input
            placeholder="Schema Description"
            value={value.description}
            onChange={(e) =>
              onChange({
                ...value,
                description: e.target.value,
              })
            }
          />
        </div>
      </div>

      <div className="space-y-2">
        {value.properties.map((property, index) => (
          <PropertyEditor key={index} property={property} index={index} />
        ))}
      </div>

      <Button variant="outline" size="sm" onClick={() => addProperty()}>
        <PlusCircle className="w-4 h-4 mr-2" />
        Add Property
      </Button>
    </div>
  );
}
