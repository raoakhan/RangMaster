import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export function GameControls({
  onToggleChat,
  onToggleVideo,
  onToggleAudio,
  onShowSettings,
  isVideoEnabled = false,
  isAudioEnabled = false,
  isChatOpen = false
}: {
  onToggleChat: () => void;
  onToggleVideo: () => void;
  onToggleAudio: () => void;
  onShowSettings: () => void;
  isVideoEnabled?: boolean;
  isAudioEnabled?: boolean;
  isChatOpen?: boolean;
}) {
  return (
    <div className="absolute bottom-4 right-4 flex flex-col space-y-2">
      <Button
        onClick={onToggleChat}
        variant="secondary"
        className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg p-0"
        aria-label="Toggle chat"
      >
        <i className={cn("fas", isChatOpen ? "fa-times" : "fa-comment-alt", "text-white")}></i>
      </Button>
      
      <Button
        onClick={onToggleVideo}
        variant="secondary"
        className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg p-0"
        aria-label="Toggle video"
      >
        <i className={cn("fas", isVideoEnabled ? "fa-video" : "fa-video-slash", "text-white")}></i>
      </Button>
      
      <Button
        onClick={onToggleAudio}
        variant="secondary"
        className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg p-0"
        aria-label="Toggle audio"
      >
        <i className={cn("fas", isAudioEnabled ? "fa-microphone" : "fa-microphone-slash", "text-white")}></i>
      </Button>
      
      <Button
        onClick={onShowSettings}
        className="w-12 h-12 rounded-full bg-accent hover:bg-accent-dark flex items-center justify-center shadow-lg p-0"
        aria-label="Settings"
      >
        <i className="fas fa-cog text-black"></i>
      </Button>
    </div>
  );
}
