import type { Metadata } from "next";

export const metadata: Metadata = {
   title: "Terms & Conditions | Albummai",
   description:
      "Review and accept our terms and conditions and privacy policy to continue creating your personalized photo album",
   keywords: [
      "terms and conditions",
      "privacy policy",
      "album creation terms",
      "photo album agreement",
      "user agreement",
      "service terms",
   ],
   openGraph: {
      title: "Terms & Conditions | Albummai",
      description:
         "Review and accept our terms and conditions and privacy policy to continue creating your personalized photo album",
      type: "website",
      images: [
         {
            url: "/images/image-album.jpg",
            width: 1200,
            height: 630,
            alt: "Albummai Terms and Conditions",
         },
      ],
   },
   twitter: {
      card: "summary_large_image",
      title: "Terms & Conditions | Albummai",
      description:
         "Review and accept our terms and conditions and privacy policy to continue creating your personalized photo album",
      images: ["/images/image-album.jpg"],
   },
   robots: {
      index: false, // Terms pages typically shouldn't be indexed
      follow: true,
   },
};

export default function TermsLayout({
   children,
}: {
   children: React.ReactNode;
}) {
   return <>{children}</>;
}
