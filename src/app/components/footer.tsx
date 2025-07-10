import React from "react";
import { BookOpen } from "lucide-react";
import Link from "next/link";

const Footer: React.FC = () => {
  const productLinks = [
    { name: "Features", path: "/features" },
    { name: "Templates", path: "/templates" },
    { name: "Pricing", path: "/price-list" },
    { name: "Updates", path: "/updates" }
  ];

  const companyLinks = [
    { name: "About", path: "/about" },
    { name: "Blog", path: "/blog" },
    { name: "Careers", path: "/careers" },
    { name: "Contact", path: "/contact" }
  ];

  const legalLinks = [
    { name: "Privacy", path: "/privacy" },
    { name: "Terms", path: "/terms" },
    { name: "Security", path: "/security" }
  ];

  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div>
            <div className="flex items-center space-x-2 justify-end mb-4">
              <BookOpen className="w-6 h-6" />
              <span className="text-lg font-bold">AlbumCraft</span>
            </div>
            <p className="text-gray-400 text-right">
              Create beautiful memories that last forever
            </p>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-right">Product</h4>
            <ul className="flex flex-col text-right space-y-2 text-gray-400">
              {productLinks.map((link) => (
                <li key={link.name}>
                  <Link href={link.path}>
                    <span className="hover:text-white transition-colors duration-200 cursor-pointer">
                      {link.name}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="text-lg text-right font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-gray-400 text-right">
              {companyLinks.map((link) => (
                <li key={link.name}>
                  <Link href={link.path}>
                    <span className="hover:text-white transition-colors duration-200 cursor-pointer">
                      {link.name}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-right">Legal</h4>
            <ul className="space-y-2 text-gray-400 text-right">
              {legalLinks.map((link) => (
                <li key={link.name}>
                  <Link href={link.path}>
                    <span className="hover:text-white transition-colors duration-200 cursor-pointer">
                      {link.name}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Copyright Section */}
        <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
          <p>
            &copy; {new Date().getFullYear()} AlbumCraft. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;