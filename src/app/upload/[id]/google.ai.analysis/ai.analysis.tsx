"use client";
import { EnhancedFile } from '@/backend/types/image';
/**
 * Example of how to group images by content using Vision API data
 * 
 * @param images Array of enhanced files with Vision API data
 * @returns Object mapping group names to arrays of files
 */
export function groupImagesByVisionContent(images: EnhancedFile[]): Record<string, EnhancedFile[]> {
    const groups: Record<string, EnhancedFile[]> = {};

    // Group by detected event type (if available)
    images.forEach(file => {
        if (file.metadata?.vision?.detectedEventType) {
            const eventType = file.metadata.vision.detectedEventType;
            if (!groups[eventType]) {
                groups[eventType] = [];
            }
            groups[eventType].push(file);
        }
    });

    // For remaining files, try to group by common tags
    const ungroupedFiles = images.filter(file =>
        !file.metadata?.vision?.detectedEventType
    );

    // Find common tags across files
    const tagGroups: Record<string, EnhancedFile[]> = {};

    ungroupedFiles.forEach(file => {
        if (file.metadata?.aiTags) {
            // Use the most relevant tag (first one)
            const primaryTag = file.metadata.aiTags[0];
            if (primaryTag) {
                if (!tagGroups[primaryTag]) {
                    tagGroups[primaryTag] = [];
                }
                tagGroups[primaryTag].push(file);
            }
        }
    });

    // Only create groups with at least 3 images
    Object.entries(tagGroups).forEach(([tag, files]) => {
        if (files.length >= 3) {
            groups[tag] = files;
        } else {
            // For small groups, add to "Other" category
            if (!groups['Other']) {
                groups['Other'] = [];
            }
            groups['Other'].push(...files);
        }
    });

    return groups;
}
