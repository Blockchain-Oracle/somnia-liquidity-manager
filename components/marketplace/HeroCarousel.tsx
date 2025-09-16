'use client';

import { useCallback, useEffect } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

const featuredCollections = [
  {
    id: 1,
    title: 'Cyber Punks Genesis',
    description: 'The original collection of 10,000 unique digital collectibles living on Somnia',
    image: 'https://images.unsplash.com/photo-1620321023374-d1a68fbc720d?w=1200&h=600&fit=crop',
    floorPrice: '2.5 STT',
    totalVolume: '15.2K STT',
    gradient: 'from-purple-600 to-pink-600'
  },
  {
    id: 2,
    title: 'Neon Dreams',
    description: 'Explore the future through stunning neon-infused digital artwork',
    image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&h=600&fit=crop',
    floorPrice: '1.8 STT',
    totalVolume: '8.7K STT',
    gradient: 'from-blue-600 to-cyan-600'
  },
  {
    id: 3,
    title: 'Abstract Realms',
    description: 'Where imagination meets blockchain in a symphony of colors',
    image: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=1200&h=600&fit=crop',
    floorPrice: '3.2 STT',
    totalVolume: '22.1K STT',
    gradient: 'from-green-600 to-teal-600'
  },
  {
    id: 4,
    title: 'Digital Horizons',
    description: 'Journey through digital landscapes that defy reality',
    image: 'https://images.unsplash.com/photo-1635002962487-2c1d4d2f63c2?w=1200&h=600&fit=crop',
    floorPrice: '0.9 STT',
    totalVolume: '5.3K STT',
    gradient: 'from-orange-600 to-red-600'
  }
];

export function HeroCarousel() {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: 'start' },
    [Autoplay({ delay: 5000, stopOnInteraction: false })]
  );

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gray-900">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gray-900/20 to-gray-900/80 z-10" />
      
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {featuredCollections.map((collection) => (
            <div key={collection.id} className="flex-[0_0_100%] min-w-0 relative">
              <div className="relative h-[500px] md:h-[600px]">
                <img
                  src={collection.image}
                  alt={collection.title}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent" />
                
                <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12 z-20">
                  <div className="max-w-3xl">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold text-white">
                        Featured Collection
                      </span>
                      <span className={`px-3 py-1 bg-gradient-to-r ${collection.gradient} rounded-full text-xs font-semibold text-white`}>
                        Trending
                      </span>
                    </div>
                    
                    <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
                      {collection.title}
                    </h1>
                    
                    <p className="text-lg md:text-xl text-gray-300 mb-6 max-w-2xl">
                      {collection.description}
                    </p>
                    
                    <div className="flex flex-wrap items-center gap-6 mb-8">
                      <div>
                        <p className="text-sm text-gray-400 mb-1">Floor Price</p>
                        <p className="text-2xl font-bold text-white">{collection.floorPrice}</p>
                      </div>
                      <div className="w-px h-12 bg-gray-700" />
                      <div>
                        <p className="text-sm text-gray-400 mb-1">Total Volume</p>
                        <p className="text-2xl font-bold text-white">{collection.totalVolume}</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-4">
                      <Button 
                        size="lg"
                        className="bg-white text-black hover:bg-gray-200 font-semibold"
                      >
                        View Collection
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </Button>
                      <Button 
                        size="lg"
                        variant="outline"
                        className="border-white/20 text-white hover:bg-white/10"
                      >
                        Learn More
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Navigation buttons */}
      <button
        onClick={scrollPrev}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-3 bg-white/10 backdrop-blur-md rounded-full hover:bg-white/20 transition-colors"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-6 w-6 text-white" />
      </button>
      
      <button
        onClick={scrollNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-3 bg-white/10 backdrop-blur-md rounded-full hover:bg-white/20 transition-colors"
        aria-label="Next slide"
      >
        <ChevronRight className="h-6 w-6 text-white" />
      </button>
      
      {/* Dots indicator */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex gap-2">
        {featuredCollections.map((_, index) => (
          <button
            key={index}
            className="w-2 h-2 rounded-full bg-white/50 hover:bg-white/80 transition-colors"
            onClick={() => emblaApi?.scrollTo(index)}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}