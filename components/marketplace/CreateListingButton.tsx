'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { CreateListingModalImproved as CreateListingModal } from './CreateListingModalImproved';

export function CreateListingButton() {
  const { address } = useAccount();
  const [open, setOpen] = useState(false);
  
  if (!address) {
    return null;
  }
  
  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
      >
        <Plus className="mr-2 h-4 w-4" />
        List NFT
      </Button>
      
      <CreateListingModal open={open} onOpenChange={setOpen} />
    </>
  );
}