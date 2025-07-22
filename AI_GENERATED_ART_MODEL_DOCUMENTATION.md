# AI Generated Art Model Documentation

## Overview
The `aiGeneratedArt` model has been successfully created to store AI-generated artwork in the web album application. This document outlines the model structure, relationships, and integration with the existing database.

## Database Table: `AI_Generated_Arts`

### Schema Structure

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, NOT NULL | Unique identifier for each AI art record |
| `userId` | INTEGER | NOT NULL, FOREIGN KEY | References the user who created the art |
| `prompt` | TEXT | NOT NULL | The text prompt used to generate the art |
| `style` | STRING | NOT NULL | The artistic style applied (e.g., "photorealistic", "anime", "oil painting") |
| `imageUrl` | STRING | NOT NULL | URL to the generated image |
| `s3Key` | STRING | NULLABLE | AWS S3 key if stored in S3 |
| `s3Url` | STRING | NULLABLE | AWS S3 URL if stored in S3 |
| `mimeType` | STRING | NULLABLE, DEFAULT: 'image/png' | MIME type of the generated image |
| `width` | INTEGER | NULLABLE | Image width in pixels |
| `height` | INTEGER | NULLABLE | Image height in pixels |
| `generationModel` | STRING | NULLABLE | AI model used for generation (e.g., "DALL-E", "Midjourney") |
| `generationParameters` | JSON | NULLABLE | Additional parameters used during generation |
| `isPublic` | BOOLEAN | NOT NULL, DEFAULT: false | Whether the art is publicly visible |
| `isFavorite` | BOOLEAN | NOT NULL, DEFAULT: false | Whether the user marked it as favorite |
| `albumId` | UUID | NULLABLE, FOREIGN KEY | Optional reference to an album |
| `tags` | JSON | NULLABLE | Array of tags for categorization |
| `createdAt` | DATE | NOT NULL | Timestamp when the record was created |
| `updatedAt` | DATE | NOT NULL | Timestamp when the record was last updated |

## Relationships

### 1. User Relationship (Many-to-One)
- **Type**: `AiGeneratedArt` belongs to `User`
- **Foreign Key**: `userId` → `Users.id`
- **Cascade**: ON DELETE CASCADE, ON UPDATE CASCADE
- **Description**: Each AI art piece is owned by a specific user

```typescript
// In User model
User.hasMany(AiGeneratedArt, {
  foreignKey: 'userId',
  as: 'aiGeneratedArts',
});

// In AiGeneratedArt model
AiGeneratedArt.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});
```

### 2. Album Relationship (Many-to-One, Optional)
- **Type**: `AiGeneratedArt` optionally belongs to `Album`
- **Foreign Key**: `albumId` → `Albums.id`
- **Cascade**: ON DELETE SET NULL, ON UPDATE CASCADE
- **Description**: AI art can optionally be organized into albums

```typescript
// In Album model
Album.hasMany(AiGeneratedArt, {
  foreignKey: 'albumId',
  as: 'aiGeneratedArts',
});

// In AiGeneratedArt model
AiGeneratedArt.belongsTo(Album, {
  foreignKey: 'albumId',
  as: 'album',
});
```

## Database Indexes

The following indexes have been created for optimal query performance:

1. `idx_ai_art_user_id` - Index on `userId` for user-specific queries
2. `idx_ai_art_album_id` - Index on `albumId` for album-specific queries
3. `idx_ai_art_user_favorite` - Composite index on `userId` and `isFavorite` for favorite queries
4. `idx_ai_art_public` - Index on `isPublic` for public art discovery
5. `idx_ai_art_created_at` - Index on `createdAt` for chronological sorting
6. `idx_ai_art_style` - Index on `style` for style-based filtering

## API Integration

### Endpoints
- `POST /api/me/ai-art` - Save new AI generated art
- `GET /api/me/ai-art` - Retrieve user's AI generated art

### Example Usage

#### Saving AI Art
```javascript
const response = await fetch('/api/me/ai-art', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    imageUrl: 'https://example.com/generated-art.png',
    prompt: 'A beautiful sunset over mountains',
    style: 'photorealistic',
    generationModel: 'DALL-E-3',
    width: 1024,
    height: 1024,
  }),
});
```

#### Retrieving AI Art
```javascript
const response = await fetch('/api/me/ai-art');
const data = await response.json();
// Returns array of user's AI generated art with user and album relationships
```

## Integration with Existing Models

### Relationship to Users Table
- Each AI art piece is owned by a user
- Users can have multiple AI generated artworks
- When a user is deleted, their AI art is also deleted (CASCADE)

### Relationship to Albums Table
- AI art can optionally be organized into albums
- Albums can contain multiple AI generated artworks
- When an album is deleted, AI art records are preserved but `albumId` is set to NULL

### Relationship to Images Table
- AI generated art is separate from uploaded images
- Both serve different purposes in the application
- AI art focuses on generated content, while Images handle user uploads

## Use Cases

1. **Personal Art Gallery**: Users can save and organize their AI-generated artwork
2. **Album Integration**: AI art can be added to existing photo albums
3. **Public Sharing**: Users can make their AI art public for discovery
4. **Favorites System**: Users can mark their favorite AI creations
5. **Style-based Organization**: Filter and organize art by generation style
6. **Prompt History**: Keep track of successful prompts for future reference

## Migration Details

- **Migration File**: `20250722103928-create-ai-generated-art.js`
- **Status**: Successfully applied
- **Rollback**: Available via `npx sequelize-cli db:migrate:undo`

## Model Files Created

1. `src/backend/db/models/aiGeneratedArt.ts` - Sequelize model definition
2. `src/backend/db/migrations/20250722103928-create-ai-generated-art.js` - Database migration
3. Updated `src/backend/db/models/associations.ts` - Model relationships
4. Updated `src/backend/db/models/index.ts` - Model exports
5. Updated `src/app/api/me/ai-art/route.ts` - API implementation

## Future Enhancements

1. **Versioning**: Track different versions of the same prompt
2. **Collaboration**: Allow users to share and remix AI art
3. **Analytics**: Track popular styles and prompts
4. **Integration**: Connect with external AI art generation services
5. **Metadata**: Store additional generation metadata (seed, steps, etc.)
