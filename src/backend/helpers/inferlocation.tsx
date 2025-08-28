/**
 * Infer location from image capture time and time zone data
 * @param captureDate Date object with timezone information
 * @returns Estimated location based on time zone
 */
export function inferLocationFromTimeZone(captureDate: Date): {
   timeZone: string;
   region: string;
   coordinates: { latitude: number; longitude: number };
   accuracy: number;
} {
   try {
      // Extract time zone name from the date
      // This uses the browser's time zone - for actual image metadata you'll need to extract this differently
      const timeZoneName = Intl.DateTimeFormat().resolvedOptions().timeZone;

      // Get time zone offset in minutes
      const offsetMinutes = captureDate.getTimezoneOffset();

      // Convert to hours for easier matching
      const offsetHours = -offsetMinutes / 60; // Note: getTimezoneOffset returns inverted value

      // Map of time zones to geographic information
      const timeZoneMap: Record<
         string,
         {
            region: string;
            coordinates: { latitude: number; longitude: number };
            offsetHours: number;
         }
      > = {
         // North America
         "America/New_York": {
            region: "Eastern United States",
            coordinates: { latitude: 40.71, longitude: -74.01 },
            offsetHours: -5,
         },
         "America/Chicago": {
            region: "Central United States",
            coordinates: { latitude: 41.85, longitude: -87.65 },
            offsetHours: -6,
         },
         "America/Denver": {
            region: "Mountain United States",
            coordinates: { latitude: 39.74, longitude: -104.99 },
            offsetHours: -7,
         },
         "America/Los_Angeles": {
            region: "Western United States",
            coordinates: { latitude: 34.05, longitude: -118.24 },
            offsetHours: -8,
         },
         "America/Toronto": {
            region: "Eastern Canada",
            coordinates: { latitude: 43.65, longitude: -79.38 },
            offsetHours: -5,
         },
         "America/Vancouver": {
            region: "Western Canada",
            coordinates: { latitude: 49.28, longitude: -123.12 },
            offsetHours: -8,
         },
         "America/Mexico_City": {
            region: "Central Mexico",
            coordinates: { latitude: 19.43, longitude: -99.13 },
            offsetHours: -6,
         },

         // Europe
         "Europe/London": {
            region: "United Kingdom",
            coordinates: { latitude: 51.51, longitude: -0.13 },
            offsetHours: 0,
         },
         "Europe/Paris": {
            region: "France",
            coordinates: { latitude: 48.85, longitude: 2.35 },
            offsetHours: 1,
         },
         "Europe/Berlin": {
            region: "Germany",
            coordinates: { latitude: 52.52, longitude: 13.4 },
            offsetHours: 1,
         },
         "Europe/Madrid": {
            region: "Spain",
            coordinates: { latitude: 40.42, longitude: -3.7 },
            offsetHours: 1,
         },
         "Europe/Rome": {
            region: "Italy",
            coordinates: { latitude: 41.9, longitude: 12.5 },
            offsetHours: 1,
         },
         "Europe/Moscow": {
            region: "Western Russia",
            coordinates: { latitude: 55.75, longitude: 37.62 },
            offsetHours: 3,
         },

         // Asia
         "Asia/Tokyo": {
            region: "Japan",
            coordinates: { latitude: 35.69, longitude: 139.69 },
            offsetHours: 9,
         },
         "Asia/Seoul": {
            region: "South Korea",
            coordinates: { latitude: 37.57, longitude: 126.98 },
            offsetHours: 9,
         },
         "Asia/Shanghai": {
            region: "Eastern China",
            coordinates: { latitude: 31.23, longitude: 121.47 },
            offsetHours: 8,
         },
         "Asia/Singapore": {
            region: "Singapore",
            coordinates: { latitude: 1.35, longitude: 103.82 },
            offsetHours: 8,
         },
         "Asia/Dubai": {
            region: "United Arab Emirates",
            coordinates: { latitude: 25.27, longitude: 55.3 },
            offsetHours: 4,
         },
         "Asia/Kolkata": {
            region: "India",
            coordinates: { latitude: 28.61, longitude: 77.21 },
            offsetHours: 5.5,
         },
         "Asia/Manila": {
            region: "Philippines",
            coordinates: { latitude: 14.58, longitude: 120.98 },
            offsetHours: 8,
         },

         // Australia & Pacific
         "Australia/Sydney": {
            region: "Eastern Australia",
            coordinates: { latitude: -33.87, longitude: 151.21 },
            offsetHours: 10,
         },
         "Australia/Perth": {
            region: "Western Australia",
            coordinates: { latitude: -31.95, longitude: 115.86 },
            offsetHours: 8,
         },
         "Pacific/Auckland": {
            region: "New Zealand",
            coordinates: { latitude: -36.85, longitude: 174.76 },
            offsetHours: 12,
         },

         // South America
         "America/Sao_Paulo": {
            region: "Eastern Brazil",
            coordinates: { latitude: -23.55, longitude: -46.63 },
            offsetHours: -3,
         },
         "America/Buenos_Aires": {
            region: "Argentina",
            coordinates: { latitude: -34.61, longitude: -58.38 },
            offsetHours: -3,
         },

         // Africa
         "Africa/Cairo": {
            region: "Egypt",
            coordinates: { latitude: 30.04, longitude: 31.24 },
            offsetHours: 2,
         },
         "Africa/Johannesburg": {
            region: "South Africa",
            coordinates: { latitude: -26.2, longitude: 28.05 },
            offsetHours: 2,
         },

         // Default fallback by offset only
         "UTC+0": {
            region: "Greenwich Mean Time Zone",
            coordinates: { latitude: 51.48, longitude: 0 },
            offsetHours: 0,
         },
         "UTC+8": {
            region: "Philippines/China/Malaysia Time Zone",
            coordinates: { latitude: 14.58, longitude: 120.98 },
            offsetHours: 8,
         },
      };

      let locationData;

      // First try to match by exact time zone name
      if (timeZoneName && timeZoneMap[timeZoneName]) {
         locationData = timeZoneMap[timeZoneName];
         // High accuracy for exact time zone name match
         return {
            timeZone: timeZoneName,
            region: locationData.region,
            coordinates: locationData.coordinates,
            accuracy: 0.9, // 90% accuracy for exact time zone match
         };
      }

      // If no exact match, find by closest offset
      // Find all time zones with this offset
      const matchingOffsetZones = Object.entries(timeZoneMap)
         .filter(([_, data]) => Math.abs(data.offsetHours - offsetHours) < 0.25) // Match within 15 minutes
         .map(([zone, data]) => ({ zone, data }));

      if (matchingOffsetZones.length > 0) {
         // Just pick the first matching zone
         // In a real implementation, you could refine this with additional data
         const firstMatch = matchingOffsetZones[0];
         return {
            timeZone: firstMatch.zone,
            region: firstMatch.data.region,
            coordinates: firstMatch.data.coordinates,
            accuracy: 0.6, // 60% accuracy for offset-based match
         };
      }

      // Fallback: return generic coordinates based on offset
      // This is the least accurate method
      const genericCoordinates = {
         latitude: 0,
         // Rough approximation: each hour of offset is ~15 degrees longitude
         longitude: offsetHours * 15,
      };

      return {
         timeZone: `UTC${offsetHours >= 0 ? "+" : ""}${offsetHours}`,
         region: `${offsetHours >= 0 ? "Eastern" : "Western"} Hemisphere`,
         coordinates: genericCoordinates,
         accuracy: 0.3, // 30% accuracy for generic offset-based coordinates
      };
   } catch (error) {
      console.error("Error inferring location from time zone:", error);

      // Return default values on error
      return {
         timeZone: "Unknown",
         region: "Unknown Region",
         coordinates: { latitude: 0, longitude: 0 },
         accuracy: 0, // 0% accuracy if we encounter an error
      };
   }
}
