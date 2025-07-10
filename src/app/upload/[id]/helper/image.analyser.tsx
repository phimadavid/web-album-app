import { EnhancedFile, LocationData, ImageMetadata } from "@/backend/types/image";

/**
 * AI Image Analyzer
 * Extracts and analyzes metadata from images to enable automatic sorting
 */
export class AIImageAnalyzer {
    private files: EnhancedFile[] = [];

    /**
     * Initialize the analyzer with files
     * @param files Array of EnhancedFile objects to analyze
     */
    constructor(files: EnhancedFile[] = []) {
        this.files = files;
    }

    /**
     * Set files to analyze
     * @param files Array of EnhancedFile objects
     */
    setFiles(files: EnhancedFile[]): void {
        this.files = files;
    }

    /**
     * Add more files to the analysis set
     * @param files Additional files to analyze
     */
    addFiles(files: EnhancedFile[]): void {
        this.files = [...this.files, ...files];
    }

    /**
     * Analyze file's metadata to ensure it has all necessary fields
     * @param file The EnhancedFile to analyze
     * @returns Enhanced file with complete metadata
     */
    async analyzeFile(file: File): Promise<EnhancedFile> {
        // Create an enhanced file with default values
        const enhancedFile: EnhancedFile = {
            ...file,
            filename: file.name,
            preview: URL.createObjectURL(file),
            metadata: {}
        };

        try {
            // Extract date information
            if (file.lastModified) {
                if (!enhancedFile.metadata) {
                    enhancedFile.metadata = {};
                }
                enhancedFile.metadata.captureDate = new Date(file.lastModified);
            }

            // Extract location information
            // In a production environment, you would use EXIF extraction
            // For this example, we'll extract from lastModifiedDate
            if ('lastModifiedDate' in file && file.lastModifiedDate instanceof Date) {
                // This is a simulation - in a real app, you'd extract coordinates from EXIF
                const locationData = await this.simulateLocationExtraction(file);
                if (locationData) {
                    if (!enhancedFile.metadata) {
                        enhancedFile.metadata = {};
                    }
                    enhancedFile.metadata.gpsLocation = locationData;
                }
            }

            return enhancedFile;
        } catch (error) {
            console.error("Error analyzing file:", error);
            return enhancedFile;
        }
    }

    /**
     * Simulate location extraction from a file
     * In a real app, this would extract EXIF GPS data
     */
    private async simulateLocationExtraction(file: File): Promise<LocationData | null> {
        // This is a simplified simulation - would be replaced with actual EXIF extraction

        // Check if file has a name indicating a location
        const locationPatterns = [
            { pattern: /new\s*york/i, name: "New York", lat: 40.7128, lng: -74.0060 },
            { pattern: /london/i, name: "London", lat: 51.5074, lng: -0.1278 },
            { pattern: /paris/i, name: "Paris", lat: 48.8566, lng: 2.3522 },
            { pattern: /tokyo/i, name: "Tokyo", lat: 35.6762, lng: 139.6503 },
            { pattern: /san\s*francisco/i, name: "San Francisco", lat: 37.7749, lng: -122.4194 },
            { pattern: /chicago/i, name: "Chicago", lat: 41.8781, lng: -87.6298 },
            { pattern: /miami/i, name: "Miami", lat: 25.7617, lng: -80.1918 },
        ];

        for (const { pattern, name, lat, lng } of locationPatterns) {
            if (pattern.test(file.name)) {
                return {
                    latitude: lat,
                    longitude: lng,
                    locationName: name
                };
            }
        }

        // If not found by name, use a random approach for demonstration
        // In a real app, this would be actual GPS data from the image
        return null;
    }

    /**
     * Automatically sort files based on metadata
     * @param method Sorting method ('date', 'location', 'event')
     * @returns Sorted array of files
     */
    sortFiles(method: 'date' | 'location' | 'event' = 'date'): EnhancedFile[] {
        if (this.files.length === 0) return [];

        let sortedFiles = [...this.files];

        switch (method) {
            case 'date':
                return this.sortByDate(sortedFiles);

            case 'location':
                return this.sortByLocation(sortedFiles);

            case 'event':
                return this.sortByEvent(sortedFiles);

            default:
                return sortedFiles;
        }
    }

    /**
     * Sort files by date
     */
    private sortByDate(files: EnhancedFile[]): EnhancedFile[] {
        return files.sort((a, b) => {
            const dateA = a.metadata?.captureDate || new Date(a.lastModified);
            const dateB = b.metadata?.captureDate || new Date(b.lastModified);
            return dateA.getTime() - dateB.getTime();
        });
    }

    /**
     * Sort files by location
     */
    private sortByLocation(files: EnhancedFile[]): EnhancedFile[] {
        // First, group by location
        const locationMap = new Map<string, EnhancedFile[]>();

        files.forEach(file => {
            const locationName = file.metadata?.gpsLocation?.locationName || "Unknown Location";

            if (!locationMap.has(locationName)) {
                locationMap.set(locationName, []);
            }

            locationMap.get(locationName)?.push(file);
        });

        // Sort files within each location by date
        locationMap.forEach((locationFiles, location) => {
            locationMap.set(location, this.sortByDate(locationFiles));
        });

        // Flatten the map back to an array
        const result: EnhancedFile[] = [];

        // Sort location names alphabetically
        Array.from(locationMap.keys())
            .sort()
            .forEach(location => {
                const locationFiles = locationMap.get(location) || [];
                result.push(...locationFiles);
            });

        return result;
    }

    /**
     * Sort files by event (combines date and location analysis)
     */
    private sortByEvent(files: EnhancedFile[]): EnhancedFile[] {
        if (files.length === 0) return [];

        // First sort by date
        const sortedByDate = this.sortByDate(files);

        // Define thresholds for grouping events
        const TIME_GAP_THRESHOLD = 3 * 60 * 60 * 1000; // 3 hours in milliseconds

        let currentEventIndex = 1;
        let currentEventDate: Date | null = null;
        let currentEventLocation: string | null = null;

        // Assign event groups
        const filesWithEvents = sortedByDate.map((file, index) => {
            const fileDate = file.metadata?.captureDate || new Date(file.lastModified);
            const fileLocation = file.metadata?.gpsLocation?.locationName || null;

            // First file starts the first event
            if (index === 0) {
                currentEventDate = fileDate;
                currentEventLocation = fileLocation;

                return {
                    ...file,
                    metadata: {
                        ...file.metadata,
                        eventGroup: `Event ${currentEventIndex}: ${this.formatEventDate(fileDate)}`
                    }
                };
            }

            let newEvent = false;

            // Check time gap
            if (currentEventDate) {
                const timeDiff = fileDate.getTime() - currentEventDate.getTime();
                if (timeDiff > TIME_GAP_THRESHOLD) {
                    newEvent = true;
                }
            }

            // Check location change (if both have location data)
            if (!newEvent && currentEventLocation && fileLocation && currentEventLocation !== fileLocation) {
                newEvent = true;
            }

            if (newEvent) {
                currentEventIndex++;
                currentEventDate = fileDate;
                currentEventLocation = fileLocation;
            }

            return {
                ...file,
                metadata: {
                    ...file.metadata,
                    eventGroup: `Event ${currentEventIndex}: ${this.formatEventDate(fileDate)}`
                }
            };
        });

        // Now group files by event and sort events by date
        const eventMap = new Map<string, EnhancedFile[]>();

        filesWithEvents.forEach(file => {
            const eventName = file.metadata?.eventGroup || "Unknown Event";

            if (!eventMap.has(eventName)) {
                eventMap.set(eventName, []);
            }

            eventMap.get(eventName)?.push(file);
        });

        // Flatten the map back to an array
        const result: EnhancedFile[] = [];

        // Sort event names by their first photo's date
        Array.from(eventMap.keys())
            .sort((a, b) => {
                const filesA = eventMap.get(a) || [];
                const filesB = eventMap.get(b) || [];

                if (filesA.length === 0) return 1;
                if (filesB.length === 0) return -1;

                const dateA = filesA[0].metadata?.captureDate || new Date(0);
                const dateB = filesB[0].metadata?.captureDate || new Date(0);

                return dateA.getTime() - dateB.getTime();
            })
            .forEach(event => {
                const eventFiles = eventMap.get(event) || [];
                result.push(...eventFiles);
            });

        return result;
    }

    /**
     * Get a suggested organization method based on available metadata
     * @returns Suggested organization method
     */
    getSuggestedOrganizationMethod(): 'date' | 'location' | 'event' | 'none' {
        if (this.files.length === 0) return 'none';

        const withDate = this.files.filter(img => !!img.metadata?.captureDate).length;
        const withLocation = this.files.filter(img => !!img.metadata?.gpsLocation).length;

        const datePercentage = (withDate / this.files.length) * 100;
        const locationPercentage = (withLocation / this.files.length) * 100;

        if (datePercentage >= 70 && locationPercentage >= 50) {
            return 'event';
        } else if (datePercentage >= 70) {
            return 'date';
        } else if (locationPercentage >= 50) {
            return 'location';
        } else {
            return 'none';
        }
    }

    /**
     * Format a date for display in an event name
     */
    private formatEventDate(date: Date): string {
        try {
            return date.toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
        } catch (e) {
            return "Unknown Date";
        }
    }

    /**
     * Process a batch of files and return enhanced versions
     * @param files Array of File objects to process
     * @returns Promise resolving to an array of EnhancedFile objects
     */
    async processBatch(files: File[]): Promise<EnhancedFile[]> {
        const enhancedFiles: EnhancedFile[] = [];

        for (const file of files) {
            const enhancedFile = await this.analyzeFile(file);
            enhancedFiles.push(enhancedFile);
        }

        return enhancedFiles;
    }
}