// Define types for event categories
type EventCategory = {
    name: string;
    keywords: string[];
    promptWord: string; // Word to use for AI template generation
    colorPalettes: string[][]; // Suggested color palettes for this event type
};

/**
 * Comprehensive event categories with related keywords, prompt words, and color palettes
 */

export const eventCategories: EventCategory[] = [
    {
        name: 'Wedding',
        keywords: ['wedding', 'bride', 'groom', 'marriage', 'ceremony', 'engagement', 'ring', 'bouquet', 'altar', 'veil'],
        promptWord: 'romantic',
        colorPalettes: [
            ['#F5F5F5', '#E8D7D7', '#D6BBC0', '#A5668B', '#69306D'], // Romantic purple
            ['#FFF9F9', '#F2E2E2', '#DACACA', '#C8A9A9', '#8E6E6E']  // Soft blush
        ]
    },
    {
        name: 'Birthday',
        keywords: ['birthday', 'cake', 'candles', 'celebration', 'party', 'gift', 'presents', 'balloons'],
        promptWord: 'festive',
        colorPalettes: [
            ['#F9C80E', '#F86624', '#EA3546', '#662E9B', '#43BCCD'], // Vibrant party
            ['#FF5A5F', '#FFB400', '#8BD3E6', '#BE79DF', '#6D47D4']  // Fun celebration
        ]
    },
    {
        name: 'Anniversary',
        keywords: ['anniversary', 'years', 'celebrate', 'married', 'together', 'love', 'romance'],
        promptWord: 'elegant',
        colorPalettes: [
            ['#D0A0A0', '#F0C0C0', '#F0E0E0', '#C0A0A0', '#806060'], // Rose gold
            ['#C0C0E0', '#E0E0F0', '#F0F0FF', '#A0A0C0', '#606080']  // Silver blue
        ]
    },
    {
        name: 'Baby Shower',
        keywords: ['baby', 'shower', 'newborn', 'pregnancy', 'expecting', 'gender', 'reveal', 'infant'],
        promptWord: 'gentle',
        colorPalettes: [
            ['#A7E8F8', '#F8E0E6', '#F9F1CF', '#D3EACC', '#E6E6FA'], // Soft pastels
            ['#C9E4DE', '#F9EBE0', '#F9CAC8', '#FDF0DD', '#E1F0EA']  // Gentle neutrals
        ]
    },
    {
        name: 'Graduation',
        keywords: ['graduation', 'diploma', 'degree', 'cap', 'gown', 'university', 'college', 'student', 'academic', 'commencement'],
        promptWord: 'achievement',
        colorPalettes: [
            ['#1A1E28', '#31588A', '#638DE3', '#BACCF4', '#F1F3F8'], // Academic blue
            ['#0D0D0D', '#333333', '#767676', '#B3B3B3', '#F0F0F0']  // Traditional black
        ]
    },
    {
        name: 'Religious Ceremony',
        keywords: ['religious', 'ceremony', 'baptism', 'bar mitzvah', 'bat mitzvah', 'confirmation', 'faith', 'church', 'temple', 'prayer', 'spiritual'],
        promptWord: 'sacred',
        colorPalettes: [
            ['#F0F0FF', '#D0D0E0', '#B0B0C0', '#9090A0', '#707080'], // Spiritual silver
            ['#FFF8E0', '#FFE0A0', '#D0B060', '#A08040', '#705020']  // Sacred gold
        ]
    },
    {
        name: 'Holiday',
        keywords: ['holiday', 'christmas', 'hanukkah', 'diwali', 'eid', 'thanksgiving', 'festival', 'seasonal', 'festive'],
        promptWord: 'festive',
        colorPalettes: [
            ['#165B33', '#146B3A', '#F8B229', '#EA4630', '#BB2528'], // Holiday traditional
            ['#17223B', '#263859', '#6B778D', '#FF6768', '#FFD369']  // Festive night
        ]
    },
    {
        name: 'Concert',
        keywords: ['concert', 'music', 'performance', 'stage', 'band', 'show', 'crowd', 'audience', 'festival', 'performer', 'singer', 'microphone'],
        promptWord: 'vibrant',
        colorPalettes: [
            ['#000000', '#3D0066', '#8F00FF', '#FF7BFD', '#FFFFFF'], // Concert purple
            ['#000000', '#1D0033', '#5500CC', '#8B6DFF', '#EDECEE']  // Stage lights
        ]
    },
    {
        name: 'Corporate Event',
        keywords: ['corporate', 'business', 'office', 'company', 'professional', 'conference', 'meeting', 'presentation', 'team', 'colleagues'],
        promptWord: 'professional',
        colorPalettes: [
            ['#1C2B2D', '#1F6F8B', '#99A8B2', '#E6D5B8', '#F1F1F1'], // Business formal
            ['#F8F9FA', '#E9ECEF', '#DEE2E6', '#CED4DA', '#ADB5BD']  // Corporate minimal
        ]
    },
    {
        name: 'Memorial',
        keywords: ['memorial', 'funeral', 'remembrance', 'honor', 'tribute', 'memory', 'respect', 'condolence'],
        promptWord: 'respectful',
        colorPalettes: [
            ['#1D1D1D', '#383838', '#626262', '#909090', '#C1C1C1'], // Respectful grays
            ['#01295F', '#013E8D', '#015FC7', '#0186F7', '#0CA4FD']  // Peaceful blues
        ]
    },
    {
        name: 'Sports Event',
        keywords: ['sports', 'game', 'match', 'competition', 'team', 'athlete', 'tournament', 'championship', 'stadium', 'field', 'player'],
        promptWord: 'dynamic',
        colorPalettes: [
            ['#173F5F', '#20639B', '#3CAEA3', '#F6D55C', '#ED553B'], // Energetic sports
            ['#0D1821', '#344966', '#F0F4EF', '#BFCC94', '#679436']  // Field and court
        ]
    },
    {
        name: 'Cultural Festival',
        keywords: ['cultural', 'festival', 'tradition', 'heritage', 'ethnic', 'celebration', 'costume', 'dance', 'parade', 'folk'],
        promptWord: 'traditional',
        colorPalettes: [
            ['#8C1C13', '#BF4342', '#E7D7C1', '#A78A7F', '#735751'], // Rich cultural
            ['#FE7F2D', '#FCCA46', '#A1C181', '#619B8A', '#233D4D']  // Festival vibrant
        ]
    },
    {
        name: 'Award Ceremony',
        keywords: ['award', 'ceremony', 'recognition', 'trophy', 'achievement', 'honor', 'prize', 'recipient', 'nomination'],
        promptWord: 'prestigious',
        colorPalettes: [
            ['#000000', '#1A1A1A', '#D4AF37', '#C0C0C0', '#FFD700'], // Gold and black
            ['#0C0C10', '#1C1C30', '#303050', '#D0D0F0', '#F0F0FF']  // Elegant night
        ]
    },
    {
        name: 'Reunion',
        keywords: ['reunion', 'family', 'relatives', 'gathering', 'alumni', 'school', 'college', 'classmates', 'homecoming'],
        promptWord: 'nostalgic',
        colorPalettes: [
            ['#5E548E', '#9F86C0', '#BE95C4', '#E0B1CB', '#FDE2E4'], // Memory lane
            ['#1D3557', '#457B9D', '#A8DADC', '#F1FAEE', '#E63946']  // Reunion classic
        ]
    },
    {
        name: 'General Event',
        keywords: ['event', 'occasion', 'gathering', 'people', 'crowd', 'group', 'social'],
        promptWord: 'elegant',
        colorPalettes: [
            ['#F8B195', '#F67280', '#C06C84', '#6C5B7B', '#355C7D'], // Versatile gradient
            ['#99B898', '#FECEAB', '#FF847C', '#E84A5F', '#2A363B']  // Modern neutral
        ]
    }
];

/**
 * Parse event tags from a string or array format
 * @param eventTagsData The event tags data which could be in various formats
 * @returns A cleaned array of event tag strings
 */
export const parseEventTags = (eventTagsData: string | string[] | undefined): string[] => {
    if (!eventTagsData) return [];

    // Handle string format
    if (typeof eventTagsData === 'string') {
        try {
            // Try to parse as JSON
            const parsed = JSON.parse(eventTagsData);
            if (Array.isArray(parsed)) {
                return parsed.map(tag => tag.toLowerCase().trim());
            }
        } catch (e) {
            // If JSON parsing fails, clean the string and split by commas
            const cleanedStr = eventTagsData.replace(/[\[\]'"]/g, '');
            return cleanedStr.split(',').map(tag => tag.toLowerCase().trim());
        }
    }

    // Handle array format
    if (Array.isArray(eventTagsData)) {
        return eventTagsData.map(tag => tag.toLowerCase().trim());
    }

    return [];
};

/**
 * Analyze event tags to determine the most likely event category
 * @param tags Array of event tag strings
 * @returns The most appropriate EventCategory object
 */
export const analyzeEventTags = (tags: string[]): EventCategory => {

    if (!tags || tags.length === 0) {
        // Return default General Event category if no tags provided
        return eventCategories.find(cat => cat.name === 'General Event') || eventCategories[eventCategories.length - 1];
    }

    // Calculate scores for each category based on keyword matches
    const categoryScores = eventCategories.map(category => {
        let score = 0;

        // For each tag, check if it matches or is related to any keyword in the category
        tags.forEach(tag => {
            category.keywords.forEach(keyword => {
                // Exact match
                if (tag === keyword) {
                    score += 2;
                }
                // Partial match (tag contains keyword or keyword contains tag)
                else if (tag.includes(keyword) || keyword.includes(tag)) {
                    score += 1;
                }
            });
        });

        return { category, score };
    });

    // Sort by score (highest first)
    categoryScores.sort((a, b) => b.score - a.score);

    // Return the highest scoring category, or default to General Event if no matches found
    return categoryScores[0].score > 0
        ? categoryScores[0].category
        : eventCategories.find(cat => cat.name === 'General Event') || eventCategories[eventCategories.length - 1];
};

/**
 * Handle special case for concert/performance detection based on example tags
 * @param tags Array of event tag strings
 * @returns Boolean indicating if this is likely a concert/performance
 */

export const isLikelyConcert = (tags: string[]): boolean => {
    // Tags that strongly suggest a concert or performance
    const concertIndicators = ['stage', 'crowd', 'audience', 'performance', 'concert', 'show', 'music'];

    // Count how many concert indicators are present
    const matchCount = tags.filter(tag =>
        concertIndicators.some(indicator => tag.includes(indicator) || indicator.includes(tag))
    ).length;

    // If at least 2 concert indicators are found, it's likely a concert
    return matchCount >= 2;
};

/**
 * Generate appropriate templates based on detected event category
 * @param eventCategory The detected event category
 * @returns Configuration for template generation
 */

export const getTemplateConfigForCategory = (eventCategory: EventCategory) => {
    return {
        promptWord: eventCategory.promptWord,
        colorPalettes: eventCategory.colorPalettes,
        name: eventCategory.name
    };
};