export interface Position {
  x: number;
  y: number;
}

export interface LocationData {
  latitude: number;
  longitude: number;
  locationName?: string;
}

export interface TextAnnotation {
  textContent: string;
  position: Position;
  style: {
    fontSize: string;
    color: string;
    fontFamily: string;
    fontWeight: string;
  };
}

export interface FaceAnnotation {
  boundingBox?: Position[];
  confidence: number;
  joy?: number;
  sorrow?: number;
  anger?: number;
  surprise?: number;
  landmarks?: {
    type: string;
    position: Position;
  }[];
}

export interface LabelAnnotation {
  description: string;
  score: number;
  topicality?: number;
  mid?: string; // Google Knowledge Graph ID
}

export interface DetectedColor {
  rgb: [number, number, number]; // RGB values
  score: number; // Prominence of the color in the image
  pixelFraction?: number; // Percentage of pixels with this color
}

export interface SafeSearchAnnotation {
  adult: string;
  spoof: string;
  medical: string;
  violence: string;
  racy: string;
}

export interface WebDetection {
  webEntities: {
    entityId: string;
    description: string;
    score: number;
  }[];
  bestGuessLabels?: string[];
  pagesWithMatchingImages?: string[];
}

export interface VisionMetadata {
  bestGuessLabels: any;
  faces?: FaceAnnotation[];
  faceCount?: number;
  labels?: LabelAnnotation[];
  contentTags?: string[]; // Simplified list of detected content labels
  dominantColors?: DetectedColor[];
  webEntities?: string[]; // Simplified list of web entities
  detectedEventType?: string; // Identified event (wedding, graduation, etc.)
  detectedLocationName?: string; // Location identified from image content
  safeSearchAnnotation?: SafeSearchAnnotation;
  isPortrait?: boolean; // Whether the image appears to be a portrait
  isLandscape?: boolean; // Whether the image appears to be a landscape
  containsText?: boolean; // Whether the image contains text
  detectedText?: string; // Text detected in the image
  personCount?: number; // Number of people detected in image
  confidence?: number; // Overall confidence in the analysis
  emotionScores?: {
    joy?: number;
    sorrow?: number;
    anger?: number;
    surprise?: number;
  };
  quality?: {
    overall: number; // 0-1 score for image quality
    sharpness?: number;
    brightness?: number;
    colorfulness?: number;
  };
}

// Enhanced ImageMetadata with Vision API data
export interface ImageMetadata {
  captureDate?: Date;
  gpsLocation?: LocationData;
  eventGroup?: string;
  eventGroupTags?: string[];
  isCover?: boolean;
  textAnnotation?: TextAnnotation;
  rotation?: number;
  zoom?: number;
  zoomPosition?: Position;
  preview?: string;
  vision?: VisionMetadata;
  aiTags?: string[];
  peopleIds?: number[];
  scenery?: string;
  importance?: number;
  aiSuggestion?: {
    crop?: Position[];
    filter?: string;
    enhancement?: string;
  };
  similarImages?: string[];
  lastAnalyzed?: Date;
  qualityAssessment?: string | null;
  catalogTheme?: string;
  labels?: Array<{ description: string }>;
  objects?: Array<{ name: string; score: number; boundingBox: any }>;
  description?: string;
  dominantColors?: Array<{
    color: { red: number; green: number; blue: number };
    score: number;
    pixelFraction: number;
  }>;
  faces?: {
    count: number;
    emotions: string[];
  };
  safeSearch?: Record<string, string>;
  tags?: string[];
  text?: string;
  caption?: string;
  location?: {
    name: string;
    confidence: number;
    coordinates?: {
      latitude: number;
      longitude: number;
    } | null;
    source?: string; // Added the 'source' field
  };
  inferredLocation?: {
    timeZone: string;
    region: string;
    coordinates: { latitude: number; longitude: number };
    accuracy: number;
  };
}

export interface EnhancedFile extends File {
  id?: string;
  originalFile: File;
  filename?: string;
  preview?: string;
  dataUrl?: string;
  metadata?: ImageMetadata;
  imageUrl?: string;
  height: number;
  width: number;
}

export interface ApiImage {
  id: string;
  filename: string;
  mimeType: string;
  dataUrl: string;
  metadata: ImageMetadata;
}

// Function to convert API images to EnhancedFile format
export function apiImageToEnhancedFile(apiImage: ApiImage): EnhancedFile {
  // Create an object that matches the EnhancedFile interface
  const enhancedFile = {
    id: apiImage.id,
    filename: apiImage.filename,
    preview: apiImage.dataUrl,
    dataUrl: apiImage.dataUrl,
    metadata: apiImage.metadata,
    // These are required by the File interface but won't be used for rendering
    name: apiImage.filename,
    lastModified: Date.now(),
    size: 0,
    type: apiImage.mimeType,
    text: () => Promise.resolve(''),
    stream: () => new ReadableStream(),
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    slice: () => new Blob(),
  } as EnhancedFile;

  return enhancedFile;
}

// Progress callback type
export type ProgressCallback = (progress: number) => void;
