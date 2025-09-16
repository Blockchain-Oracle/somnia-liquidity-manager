'use client';

import { useState } from 'react';
import { ChevronDown, Filter, X } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface FilterSidebarProps {
  onFiltersChange?: (filters: any) => void;
  className?: string;
}

export function FilterSidebar({ onFiltersChange, className }: FilterSidebarProps) {
  const [priceRange, setPriceRange] = useState([0, 100]);
  const [showOnlyBuyNow, setShowOnlyBuyNow] = useState(true);
  const [selectedTraits, setSelectedTraits] = useState<string[]>([]);
  const [selectedCollections, setSelectedCollections] = useState<string[]>([]);
  
  const collections = [
    { name: 'Cyber Punks', count: 2341 },
    { name: 'Neon Dreams', count: 1823 },
    { name: 'Abstract Realms', count: 921 },
    { name: 'Digital Horizons', count: 512 },
  ];
  
  const traits = [
    { category: 'Background', values: ['Blue', 'Purple', 'Green', 'Red'] },
    { category: 'Type', values: ['Human', 'Robot', 'Alien', 'Hybrid'] },
    { category: 'Rarity', values: ['Common', 'Rare', 'Epic', 'Legendary'] },
  ];

  const clearFilters = () => {
    setPriceRange([0, 100]);
    setShowOnlyBuyNow(true);
    setSelectedTraits([]);
    setSelectedCollections([]);
  };

  return (
    <div className={`bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl border border-gray-700/50 p-6 shadow-xl ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-purple-400" />
          <h3 className="font-semibold text-lg text-white">Filters</h3>
        </div>
        <button
          onClick={clearFilters}
          className="text-sm text-gray-400 hover:text-purple-400 transition-colors"
        >
          Clear all
        </button>
      </div>
      
      <div className="space-y-6">
        {/* Status */}
        <div>
          <h4 className="font-medium mb-3 text-white">Status</h4>
          <div className="flex items-center justify-between">
            <label htmlFor="buy-now" className="text-sm text-gray-300">Buy Now</label>
            <Switch
              id="buy-now"
              checked={showOnlyBuyNow}
              onCheckedChange={setShowOnlyBuyNow}
            />
          </div>
        </div>
        
        {/* Price Range */}
        <div>
          <h4 className="font-medium mb-3 text-white">Price Range</h4>
          <div className="space-y-4">
            <Slider
              value={priceRange}
              onValueChange={setPriceRange}
              max={100}
              step={0.1}
              className="w-full"
            />
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <input
                  type="number"
                  value={priceRange[0]}
                  onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                  className="w-full px-3 py-2 bg-black/30 border border-gray-700/50 rounded-lg text-sm text-white placeholder-gray-500 focus:border-purple-500/50 focus:outline-none transition-colors"
                  placeholder="Min"
                />
              </div>
              <span className="text-gray-400">to</span>
              <div className="flex-1">
                <input
                  type="number"
                  value={priceRange[1]}
                  onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                  className="w-full px-3 py-2 bg-black/30 border border-gray-700/50 rounded-lg text-sm text-white placeholder-gray-500 focus:border-purple-500/50 focus:outline-none transition-colors"
                  placeholder="Max"
                />
              </div>
            </div>
            <div className="text-xs text-gray-400 uppercase tracking-wider">ETH</div>
          </div>
        </div>
        
        {/* Collections */}
        <div>
          <h4 className="font-medium mb-3 text-white">Collections</h4>
          <div className="space-y-2">
            {collections.map((collection) => (
              <label
                key={collection.name}
                className="flex items-center justify-between p-2 hover:bg-black/30 rounded-lg cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedCollections.includes(collection.name)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedCollections([...selectedCollections, collection.name]);
                      } else {
                        setSelectedCollections(selectedCollections.filter(c => c !== collection.name));
                      }
                    }}
                    className="rounded border-gray-600 bg-gray-700 checked:bg-purple-500 checked:border-purple-500"
                  />
                  <span className="text-sm text-gray-300">{collection.name}</span>
                </div>
                <span className="text-xs text-gray-400">{collection.count}</span>
              </label>
            ))}
          </div>
        </div>
        
        {/* Traits */}
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="traits" className="border-none">
            <AccordionTrigger className="font-medium py-0 hover:no-underline text-white">
              Traits
            </AccordionTrigger>
            <AccordionContent className="pt-4">
              <div className="space-y-4">
                {traits.map((trait) => (
                  <div key={trait.category}>
                    <h5 className="text-sm font-medium mb-2 text-gray-300">{trait.category}</h5>
                    <div className="flex flex-wrap gap-2">
                      {trait.values.map((value) => (
                        <Badge
                          key={value}
                          variant={selectedTraits.includes(`${trait.category}:${value}`) ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => {
                            const traitKey = `${trait.category}:${value}`;
                            if (selectedTraits.includes(traitKey)) {
                              setSelectedTraits(selectedTraits.filter(t => t !== traitKey));
                            } else {
                              setSelectedTraits([...selectedTraits, traitKey]);
                            }
                          }}
                        >
                          {value}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        
        {/* Apply Button */}
        <Button 
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-semibold shadow-lg hover:shadow-purple-500/25 transition-all"
          onClick={() => onFiltersChange?.({
            priceRange,
            showOnlyBuyNow,
            selectedTraits,
            selectedCollections
          })}
        >
          Apply Filters
        </Button>
      </div>
    </div>
  );
}