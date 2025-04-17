import { Dialog, DialogContent, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

interface RoomSharingModalProps {
  isOpen: boolean;
  roomId: string;
  onClose: () => void;
}

export function RoomSharingModal({
  isOpen,
  roomId,
  onClose
}: RoomSharingModalProps) {
  const { toast } = useToast();
  
  // Generate room link
  const roomLink = `${window.location.origin}/room/${roomId}`;
  
  // Copy functions
  const copyToClipboard = async (text: string, type: 'Room ID' | 'Room Link') => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: `${type} copied to clipboard`,
      });
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please copy manually",
        variant: "destructive",
      });
    }
  };
  
  // Share functions
  const shareWhatsApp = () => {
    const message = encodeURIComponent(`Join my Rang game with this link: ${roomLink}`);
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };
  
  const shareEmail = () => {
    const subject = encodeURIComponent('Join my Rang card game');
    const body = encodeURIComponent(`Join my Rang game with this link: ${roomLink}`);
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-secondary-dark">
        <div className="flex justify-between items-center mb-4">
          <DialogTitle className="text-lg font-poppins font-bold">
            Share Room
          </DialogTitle>
          <DialogClose className="text-white/70 hover:text-white">
            <i className="fas fa-times"></i>
          </DialogClose>
        </div>
        
        <div className="bg-secondary/30 p-4 rounded-lg mb-4">
          <div className="text-sm text-white/70 mb-1">Room ID</div>
          <div className="flex">
            <Input
              type="text"
              value={roomId}
              readOnly
              className="bg-secondary-light/20 text-white rounded-l-lg px-3 py-2 flex-1 focus:outline-none"
            />
            <Button
              className="bg-primary hover:bg-primary-light px-3 rounded-r-lg"
              onClick={() => copyToClipboard(roomId, 'Room ID')}
            >
              <i className="fas fa-copy"></i>
            </Button>
          </div>
        </div>
        
        <div className="mb-4">
          <div className="text-sm text-white/70 mb-1">Share Link</div>
          <div className="flex">
            <Input
              type="text"
              value={roomLink}
              readOnly
              className="bg-secondary-light/20 text-white rounded-l-lg px-3 py-2 flex-1 focus:outline-none text-sm"
            />
            <Button
              className="bg-primary hover:bg-primary-light px-3 rounded-r-lg"
              onClick={() => copyToClipboard(roomLink, 'Room Link')}
            >
              <i className="fas fa-copy"></i>
            </Button>
          </div>
        </div>
        
        <div className="flex justify-center space-x-3">
          <Button
            variant="secondary"
            className="flex items-center px-4 py-2"
            onClick={shareWhatsApp}
          >
            <i className="fab fa-whatsapp mr-2"></i>
            <span>WhatsApp</span>
          </Button>
          
          <Button
            variant="secondary"
            className="flex items-center px-4 py-2"
            onClick={shareEmail}
          >
            <i className="fas fa-envelope mr-2"></i>
            <span>Email</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
