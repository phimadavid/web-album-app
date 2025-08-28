import type { Metadata } from "next";

export const metadata: Metadata = {
   title: "Upload Photos | Albummai",
   description:
      "Upload and organize your photos with AI-powered smart cataloging and automatic event detection",
   keywords: [
      "photo upload",
      "AI photo organization",
      "smart photo cataloging",
      "automatic photo sorting",
      "image metadata extraction",
      "photo album creation",
      "AI image analysis",
   ],
   openGraph: {
      title: "Upload Photos | Albummai",
      description:
         "Upload and organize your photos with AI-powered smart cataloging and automatic event detection",
      type: "website",
      images: [
         {
            url: "/images/image-album.jpg",
            width: 1200,
            height: 630,
            alt: "AI-powered photo upload and organization",
         },
      ],
   },
   twitter: {
      card: "summary_large_image",
      title: "Upload Photos | Albummai",
      description:
         "Upload and organize your photos with AI-powered smart cataloging and automatic event detection",
      images: ["/images/image-album.jpg"],
   },
   robots: {
      index: false, // Typically you don't want upload pages indexed
      follow: true,
   },
};

export default function UploadLayout({
   children,
}: {
   children: React.ReactNode;
}) {
   return <>{children}</>;
}
