import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import httpClient from '../../services/httpClient';
import SubtitleOverlay from '../../components/listening/SubtitleOverlay';

const VideoPlayerPage: React.FC = () => {
  const { videoId } = useParams<{ videoId: string }>();
  const [video, setVideo] = useState<any>(null);
  const [subtitles, setSubtitles] = useState<any[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoId) {
      fetchVideo();
      fetchSubtitles();
    }
  }, [videoId]);

  const fetchVideo = async () => {
    // In a real app we'd have a GET /videos/:id endpoint. Since we didn't specify it explicitly,
    // let's simulate or assume it exists in a full implementation.
    // We will just mock for UI demonstration since this is MVP.
    setVideo({
      id: videoId,
      title: 'Sample Listening Video',
      video_url: 'https://www.w3schools.com/html/mov_bbb.mp4',
      source_type: 'upload'
    });
  };

  const fetchSubtitles = async () => {
    try {
      const response = await httpClient.get(`/videos/${videoId}/subtitles`);
      setSubtitles(response.data.data);
    } catch (error) {
      console.error(error);
      // Mock some subtitles if none exist
      setSubtitles([
        { id: '1', start_time_ms: 0, end_time_ms: 3000, text: 'Hello, welcome to this video.' },
        { id: '2', start_time_ms: 3000, end_time_ms: 6000, text: 'Today we will learn about listening.' }
      ]);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime * 1000);
    }
  };

  if (!video) return <div>Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto p-4 flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-4">{video.title}</h1>
      
      <div className="relative w-full bg-black rounded-lg overflow-hidden shadow-lg aspect-video">
        {video.source_type === 'upload' ? (
          <video 
            ref={videoRef}
            src={video.video_url} 
            className="w-full h-full"
            controls 
            onTimeUpdate={handleTimeUpdate}
          />
        ) : (
          <div className="text-white p-10 text-center">YouTube embed placeholder</div>
        )}
        
        {/* Subtitle Overlay */}
        <SubtitleOverlay subtitles={subtitles} currentTimeMs={currentTime} />
      </div>
    </div>
  );
};

export default VideoPlayerPage;
