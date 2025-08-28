import type { Metadata } from "next";

export const metadata: Metadata = {
   title: "Album Layout Selection | Albummai",
   description:
      "Choose the perfect layout for your photo album - single or multiple photos per page with AI-powered arrangement suggestions",
   keywords: [
      "album layout",
      "photo arrangement",
      "album design",
      "photo layout selection",
      "single photo layout",
      "multiple photo layout",
      "album page design",
   ],
   openGraph: {
      title: "Album Layout Selection | Albummai",
      description:
         "Choose the perfect layout for your photo album - single or multiple photos per page with AI-powered arrangement suggestions",
      type: "website",
      images: [
         {
            url: "/images/image-album.jpg",
            width: 1200,
            height: 630,
            alt: "Album layout selection and design options",
         },
      ],
   },
   twitter: {
      card: "summary_large_image",
      title: "Album Layout Selection | Albummai",
      description:
         "Choose the perfect layout for your photo album - single or multiple photos per page with AI-powered arrangement suggestions",
      images: ["/images/image-album.jpg"],
   },
   robots: {
      index: false, // Layout selection pages typically shouldn't be indexed
      follow: true,
   },
};

export default function AlbumLayoutLayout({
   children,
}: {
   children: React.ReactNode;
}) {
   return <>{children}</>;
}
