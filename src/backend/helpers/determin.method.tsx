import { EnhancedFile } from "../types/image";

// Helper function to determine the best organization method based on available metadata
export const determineBestOrganizationMethod = (
   images: EnhancedFile[]
): string => {
   // Count images with different types of metadata
   const withExactDate = images.filter(
      img => !!img.metadata?.captureDate
   ).length;

   // Count images with location data (either GPS or derived from timezone)
   const withLocation = images.filter(img => {
      if (img.metadata?.gpsLocation) return true;

      // Check for timezone data in capture date
      const captureDate = img.metadata?.captureDate;
      if (captureDate) {
         const dateStr = new Date(captureDate).toString();
         if (dateStr.match(/GMT([+-]\d{4})/)) return true;
      }

      return false;
   }).length;

   // Count images with AI tags
   const withAiTags = images.filter(
      img => img.metadata?.aiTags && img.metadata.aiTags.length > 0
   ).length;

   // Calculate percentages
   const datePercentage = (withExactDate / images.length) * 100;
   const locationPercentage = (withLocation / images.length) * 100;
   const aiTagsPercentage = (withAiTags / images.length) * 100;

   // Determine best organization method
   if (datePercentage >= 70 && locationPercentage >= 50) {
      return "event";
   } else if (aiTagsPercentage >= 70) {
      return "content";
   } else if (datePercentage >= 70) {
      return "date";
   } else if (locationPercentage >= 50) {
      return "location";
   } else if (datePercentage >= 30) {
      return "date";
   }

   return "date"; // Default fallback
};
