import { EnhancedFile } from "@/backend/types/image";
import { AIImageAnalyzer } from "./image.analyser";

/**
 * Organize images using the specified method
 *
 * This function can replace the organizeImages function in UploadPage
 *
 * @param files Array of EnhancedFile objects
 * @param method Organization method
 * @returns Organized array of EnhancedFile objects
 */
export const organizeImagesWithAI = (
   files: EnhancedFile[],
   method: "date" | "location" | "event"
): EnhancedFile[] => {
   const analyzer = new AIImageAnalyzer(files);
   return analyzer.sortFiles(method);
};
