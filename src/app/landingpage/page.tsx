'use client';

import Link from 'next/link';
import Image from 'next/image';
import React, { useState } from 'react';
import { albumFormats } from '../sample-data/album-formats';
import { features } from '../sample-data/features';
import ImageAlbum from '../../../public/images/image-album.jpg';
import { CheckCircle2, ChevronLeft, Info } from 'lucide-react';

const LandingPage = () => {
  const [activeFeature, setActiveFeature] = useState(0);
  const [hoveredFormat, setHoveredFormat] = useState<number | null>(null);

  const HeroSection = () => (
    <section className="relative bg-gradient-to-l from-blue-50 via-blue-100 to-blue-400 h-screen py-10 sm:py-20">
      {/* Background Image */}
      <div className="absolute inset-0 opacity-50">
        <Image
          src={ImageAlbum}
          alt="Album Designer Background"
          fill
          className="object-cover"
          priority
        />
      </div>

      {/* Gradient Overlay to maintain blue gradient effect */}
      <div className="absolute inset-0 bg-gradient-to-l from-blue-50/80 via-blue-100/60 to-blue-400/60" />

      {/* Content */}
      <div className="relative z-10 max-w-full mx-auto pt-10 px-4 sm:px-6 lg:px-0">
        <div className="flex flex-col lg:flex-row items-center justify-center">
          {/* Content - Centered */}
          <div className="flex-1 mb-10 lg:mb-0">
            <div className="text-center max-w-5xl mx-auto">
              <h1 className="text-4xl lg:text-[2.5rem] leading-[3.5rem] font-bold mb-6">
                Create Beautiful Digital Albums Fast Using A.I and That Last Forever
              </h1>
              <p className="text-lg text-gray-600 mb-8">
                Design professional-quality photo albums with our intuitive
                tools. Perfect for weddings, family memories, and special
                occasions.
              </p>
              <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
                <Link href="/create" className='flex justify-center'>
                  <button className="box min-h-14 px-8 py-3 bg-blue-600 font-semibold text-white rounded-full hover:bg-blue-700 flex items-center justify-center group">
                    <ChevronLeft className="w-5 h-5 mr-2 font-semibold group-hover:translate-x-1 transition-transform" />
                    Create Album
                  </button>
                </Link>
              </div>
              {/* Trust Indicators */}
              <div className="mt-12 flex items-center justify-center space-x-6">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <span className="text-sm text-gray-600">Free Templates</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <span className="text-sm text-gray-600">No Credit Card</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <span className="text-sm text-gray-600">24/7 Support</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );

  const FeaturesSection = () => (
    <section id="features" className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-right">
          <h2 className="text-3xl font-bold mb-4">
            Powerful Features for Perfect Albums
          </h2>
          <p className="text-xl text-gray-600">
            Everything you need to create stunning photo albums
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="p-6 bg-white place-items-end rounded-lg text-right shadow-lg hover:shadow-xl transition-shadow"
              onMouseEnter={() => setActiveFeature(index)}
            >
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );

  const PricingSection = () => (
    <section
      id="pricing"
      className="py-20 bg-gradient-to-l from-blue-50 via-blue-100 to-blue-400 min-h-screen"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-right mb-16">
          <h2 className="text-3xl font-bold mb-4">
            Album Format Pricing
          </h2>
          <p className="text-xl text-gray-600">
            Choose the perfect format for your memories
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {albumFormats.map((format, index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-all duration-300 relative"
              onMouseEnter={() => setHoveredFormat(index)}
              onMouseLeave={() => setHoveredFormat(null)}
            >
              {/* Format Icon and Name */}
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  {format.icon}
                </div>
                <div className="relative">
                  <Info
                    className="w-5 h-5 text-gray-400 hover:text-blue-600 cursor-help transition-colors"
                  />
                  {/* Hover Information Tooltip */}
                  {hoveredFormat === index && (
                    <div className="absolute right-0 top-6 w-80 bg-gray-900 text-white p-4 rounded-lg shadow-xl z-10 text-sm">
                      <h4 className="font-semibold mb-2">{format.hoverInfo.title}</h4>
                      <ul className="space-y-1">
                        {format.hoverInfo.details.map((detail, detailIndex) => (
                          <li key={detailIndex} className="text-gray-300">
                            • {detail}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              <h3 className="text-xl font-bold mb-2">{format.name}</h3>
              <p className="text-2xl font-bold text-blue-600 mb-3">{format.price}</p>

              {/* Dimensions */}
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-1">Available sizes:</p>
                <p className="text-sm font-medium">{format.dimensions.join(', ')}</p>
              </div>

              {/* Description */}
              <p className="text-gray-600 text-sm mb-4">{format.description}</p>

              {/* Features */}
              <ul className="space-y-2 mb-6">
                {format.features.map((feature, fIndex) => (
                  <li key={fIndex} className="flex items-center text-sm">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <Link href="/create">
                <button className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                  Choose {format.name}
                </button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );

  return (
    <div className="min-h-screen">
      <main>
        <HeroSection />
        <FeaturesSection />
        <PricingSection />
      </main>
    </div>
  );
};

export default LandingPage;
