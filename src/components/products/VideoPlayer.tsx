import { useState } from "react";
import { Play } from "lucide-react";

interface VideoPlayerProps {
  url: string;
  className?: string;
}

const getYouTubeId = (url: string): string | null => {
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
};

const isVideoUrl = (url: string): boolean => {
  if (!url) return false;
  return /\.(mp4|webm|ogg)(\?|$)/i.test(url) || /youtube\.com|youtu\.be/i.test(url);
};

const VideoPlayer = ({ url, className = "" }: VideoPlayerProps) => {
  const [playing, setPlaying] = useState(false);
  const youtubeId = getYouTubeId(url);

  if (youtubeId) {
    if (!playing) {
      return (
        <div
          className={`relative cursor-pointer group ${className}`}
          onClick={() => setPlaying(true)}
        >
          <img
            src={`https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`}
            alt="Video thumbnail"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
            <div className="w-16 h-16 rounded-full bg-primary/90 flex items-center justify-center shadow-lg">
              <Play className="h-8 w-8 text-primary-foreground ml-1" />
            </div>
          </div>
        </div>
      );
    }
    return (
      <iframe
        src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0`}
        className={`w-full h-full ${className}`}
        allow="autoplay; encrypted-media"
        allowFullScreen
        title="Product video"
      />
    );
  }

  // Direct video file
  return (
    <video
      src={url}
      controls
      className={`w-full h-full object-cover ${className}`}
      preload="metadata"
    />
  );
};

export { isVideoUrl };
export default VideoPlayer;
