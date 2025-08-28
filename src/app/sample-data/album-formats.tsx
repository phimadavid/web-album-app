import { Square, RectangleHorizontal, Maximize2, Monitor } from "lucide-react";

export const albumFormats = [
   {
      name: "Square",
      icon: <Square className="w-6 h-6 text-blue-600" />,
      price: "$24.99",
      dimensions: ["20x20 cm", "30x30 cm"],
      description: "Perfect for Instagram-style photos and modern layouts",
      features: [
         "Ideal for social media photos",
         "Modern square aesthetic",
         "Perfect binding",
         "Premium paper quality",
         "20-100 pages available",
      ],
      hoverInfo: {
         title: "Square Format Details",
         details: [
            "Most popular format for modern photo albums",
            "Perfect for Instagram and square photos",
            "Available in 20x20cm and 30x30cm sizes",
            "Lay-flat binding for seamless spreads",
            "Premium matte or glossy paper options",
         ],
      },
   },
   {
      name: "Rectangular",
      icon: <RectangleHorizontal className="w-6 h-6 text-blue-600" />,
      price: "$29.99",
      dimensions: ["20x30 cm", "25x35 cm"],
      description: "Classic format ideal for traditional photography",
      features: [
         "Traditional photo album format",
         "Landscape orientation",
         "Professional binding",
         "Archival quality paper",
         "20-120 pages available",
      ],
      hoverInfo: {
         title: "Rectangular Format Details",
         details: [
            "Classic landscape format for traditional photos",
            "Perfect for wedding and family albums",
            "Available in 20x30cm and 25x35cm sizes",
            "Professional hardcover binding",
            "Museum-quality archival paper",
         ],
      },
   },
   {
      name: "Panoramic",
      icon: <Maximize2 className="w-6 h-6 text-blue-600" />,
      price: "$34.99",
      dimensions: ["20x40 cm", "30x60 cm"],
      description: "Wide format perfect for landscape and group photos",
      features: [
         "Extra wide format",
         "Perfect for landscapes",
         "Unique presentation style",
         "Premium construction",
         "15-80 pages available",
      ],
      hoverInfo: {
         title: "Panoramic Format Details",
         details: [
            "Ultra-wide format for stunning landscapes",
            "Perfect for group photos and scenic views",
            "Available in 20x40cm and 30x60cm sizes",
            "Specialty binding for wide format",
            "Limited edition paper options",
         ],
      },
   },
   {
      name: "Vertical",
      icon: <Monitor className="w-6 h-6 text-blue-600 rotate-90" />,
      price: "$27.99",
      dimensions: ["30x20 cm", "35x25 cm"],
      description: "Portrait orientation for vertical compositions",
      features: [
         "Portrait orientation",
         "Great for vertical photos",
         "Elegant presentation",
         "Quality binding",
         "20-100 pages available",
      ],
      hoverInfo: {
         title: "Vertical Format Details",
         details: [
            "Portrait orientation for vertical compositions",
            "Ideal for fashion and portrait photography",
            "Available in 30x20cm and 35x25cm sizes",
            "Elegant spine design",
            "Premium portrait paper finish",
         ],
      },
   },
];
