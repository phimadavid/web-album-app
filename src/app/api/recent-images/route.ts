// src/app/api/recent-images/route.ts
import { NextResponse } from "next/server";
import db from "@/backend/db/models/index";

const { Image, Album, sequelize } = db;

export async function GET(request: Request) {
   try {
      // Ensure database connection is established
      await sequelize.authenticate();
      
      const url = new URL(request.url);
      const limit = parseInt(url.searchParams.get('limit') || '6');

      console.log('🔍 Fetching recent images with limit:', limit);

      // First try to fetch images with album information
      let images;
      try {
         images = await Image.findAll({
            attributes: [
               "id",
               "filename",
               "s3Url",
               "previewUrl",
               "captureDate",
               "locationName",
               "eventGroup",
               "albumId",
               "createdAt"
            ],
            include: [
               {
                  model: Album,
                  as: 'album',
                  attributes: ['bookName', 'id'],
                  required: false // LEFT JOIN instead of INNER JOIN
               }
            ],
            order: [["createdAt", "DESC"]],
            limit: limit,
         });
         console.log('✅ Successfully fetched images with album join');
      } catch (joinError) {
         console.warn('⚠️ Failed to fetch with album join, trying simple query:', joinError);
         // Fallback: fetch images without album join
         images = await Image.findAll({
            attributes: [
               "id",
               "filename",
               "s3Url",
               "previewUrl",
               "captureDate",
               "locationName",
               "eventGroup",
               "albumId",
               "createdAt"
            ],
            order: [["createdAt", "DESC"]],
            limit: limit,
         });
         console.log('✅ Successfully fetched images without album join');
      }

      console.log('📊 Found images count:', images.length);
      console.log('🔍 Raw images data:', images.map(img => ({
         id: img.id,
         filename: img.filename,
         s3Url: img.s3Url,
         albumId: img.albumId,
         createdAt: img.createdAt
      })));

      // Process the images for the recent projects display
      const processedImages = images.map((image: any) => {
         const albumName = image.album?.bookName || 'Untitled Album';
         const eventGroup = image.eventGroup || 'Recent Upload';
         
         const processed = {
            id: image.id,
            src: image.s3Url || image.previewUrl,
            name: image.filename || `Image ${image.id}`,
            category: eventGroup,
            albumName: albumName,
            albumId: image.albumId,
            captureDate: image.captureDate,
            locationName: image.locationName,
            createdAt: image.createdAt
         };

         console.log('✅ Processed image:', processed);
         return processed;
      });

      console.log('🎯 Final processed images:', processedImages);
      return NextResponse.json(processedImages);
   } catch (error) {
      console.error("💥 Fetch recent images error:", error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      const errorStack = error instanceof Error ? error.stack : undefined;
      const errorName = error instanceof Error ? error.name : 'UnknownError';
      
      console.error("Error details:", {
         message: errorMessage,
         stack: errorStack,
         name: errorName
      });
      
      return NextResponse.json(
         { 
            error: "Failed to fetch recent images",
            details: errorMessage,
            timestamp: new Date().toISOString()
         },
         { status: 500 }
      );
   }
}
