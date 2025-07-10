"use client";
import React, { useState } from "react";
import {
  Pencil,
  Image,
  Type,
  Save,
  Download,
  Undo,
  Redo,
  LayoutPanelTop,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const AlbumDesigner = () => {
  const [selectedTool, setSelectedTool] = useState("move");
  const [rotation, setRotation] = useState(0);

  // Simulated template data
  const templates = [
    { id: 1, name: "Wedding Album" },
    { id: 2, name: "Travel Book" },
    { id: 3, name: "Family Memories" },
  ];

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Top Toolbar */}
      <div className="bg-white border-b p-4 flex items-center justify-between">
        <div className="flex space-x-2">
          <Button
            variant={selectedTool === "move" ? "default" : "outline"}
            onClick={() => setSelectedTool("move")}
            className="p-2"
          >
            <Pencil className="w-5 h-5" />
          </Button>
          <Button
            variant={selectedTool === "image" ? "default" : "outline"}
            onClick={() => setSelectedTool("image")}
            className="p-2"
          >
            <Image className="w-5 h-5" />
          </Button>
          <Button
            variant={selectedTool === "text" ? "default" : "outline"}
            onClick={() => setSelectedTool("text")}
            className="p-2"
          >
            <Type className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex space-x-2">
          <Button variant="outline" className="p-2">
            <Undo className="w-5 h-5" />
          </Button>
          <Button variant="outline" className="p-2">
            <Redo className="w-5 h-5" />
          </Button>
          <Button variant="default" className="p-2">
            <Save className="w-5 h-5" />
          </Button>
          <Button variant="default" className="p-2">
            <Download className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex">
        {/* Side Panel */}
        <div className="w-64 bg-white border-r p-4">
          <Tabs defaultValue="templates">
            <TabsList className="w-full">
              <TabsTrigger value="templates" className="flex-1">
                <LayoutPanelTop className="w-4 h-4 mr-2" />
                Templates
              </TabsTrigger>
              <TabsTrigger value="images" className="flex-1">
                <Image className="w-4 h-4 mr-2" />
                Images
              </TabsTrigger>
            </TabsList>

            <TabsContent value="templates" className="mt-4">
              <div className="space-y-2">
                {templates.map((template) => (
                  <Card
                    key={template.id}
                    className="p-3 cursor-pointer hover:bg-gray-50"
                  >
                    <div className="text-sm font-medium">{template.name}</div>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="images" className="mt-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-500">
                  Drag and drop images here or click to upload
                </p>
              </div>

              <div className="mt-4 space-y-2">
                {/* Placeholder for uploaded images */}
                <div className="aspect-video bg-gray-200 rounded-lg"></div>
                <div className="aspect-video bg-gray-200 rounded-lg"></div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Central Workspace */}
        <div className="flex-1 p-8 flex justify-center items-center bg-gray-50">
          <div className="w-full max-w-4xl aspect-[1.4] bg-white shadow-lg rounded-lg">
            <div className="w-full h-full p-8">
              {/* Placeholder for album page content */}
              <div className="w-full h-full border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center">
                <p className="text-gray-400">
                  Drag elements here to start designing
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Properties Panel */}
        <div className="w-64 bg-white border-l p-4">
          <h3 className="font-medium mb-4">Properties</h3>

          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-600 mb-2 block">
                Rotation
              </label>
              <Slider
                value={[rotation]}
                onValueChange={([value]) => setRotation(value)}
                max={360}
                step={1}
              />
              <span className="text-sm text-gray-500 mt-1 block">
                {rotation}°
              </span>
            </div>

            {/* Additional property controls would go here */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlbumDesigner;
