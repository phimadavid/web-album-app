import type { Metadata } from "next";

export const metadata: Metadata = {
   title: "Edit Album | Albummai",
   description:
      "Edit and customize your photo album with AI-powered tools, layout options, background generation, and caption creation",
   keywords: [
      "edit photo album",
      "album editor",
      "photo book customization",
      "AI album editing",
      "layout editor",
      "background generation",
      "caption editor",
      "photo arrangement",
      "album design tools",
   ],
   openGraph: {
      title: "Edit Album | Albummai",
      description:
         "Edit and customize your photo album with AI-powered tools, layout options, background generation, and caption creation",
      type: "website",
      images: [
         {
            url: "/images/image-album.jpg",
            width: 1200,
            height: 630,
            alt: "Album editing and customization tools",
         },
      ],
   },
   twitter: {
      card: "summary_large_image",
      title: "Edit Album | Albummai",
      description:
         "Edit and customize your photo album with AI-powered tools, layout options, background generation, and caption creation",
      images: ["/images/image-album.jpg"],
   },
   robots: {
      index: false, // Album editing pages typically shouldn't be indexed
      follow: true,
   },
};

export default function EditLayout({
   children,
}: {
   children: React.ReactNode;
}) {
   return <>{children}</>;
}
