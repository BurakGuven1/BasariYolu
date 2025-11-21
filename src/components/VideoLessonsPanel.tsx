import React, { useState, useEffect } from 'react';
import { Play, CheckCircle, BookmarkPlus, BookmarkCheck, Clock, TrendingUp, Filter, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface VideoLesson {
  id: string;
  exam_type: string;
  subject: string;
  topic: string;
  title: string;
  description: string;
  youtube_url: string;
  youtube_video_id: string;
  duration_seconds: number;
  thumbnail_url: string;
  difficulty: 'easy' | 'medium' | 'hard';
  instructor_name: string;
  instructor_title: string;
  is_premium: boolean;
  view_count: number;
}

interface VideoProgress {
  video_id: string;
  watched_seconds: number;
  completion_percentage: number;
  is_completed: boolean;
  bookmarked: boolean;
}

interface VideoLessonsPanelProps {
  studentId: string;
  examType: string;
}

export default function VideoLessonsPanel({ studentId, examType }: VideoLessonsPanelProps) {
  const [videos, setVideos] = useState<VideoLesson[]>([]);
  const [progress, setProgress] = useState<Record<string, VideoProgress>>({});
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<VideoLesson | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');

  useEffect(() => {
    fetchVideos();
    fetchProgress();
  }, [studentId, examType]);

  const fetchVideos = async () => {
    try {
      let query = supabase
        .from('video_lessons')
        .select('*')
        .eq('exam_type', examType)
        .eq('is_published', true)
        .order('subject')
        .order('topic')
        .order('order_index');

      const { data, error } = await query;

      if (error) throw error;
      setVideos(data || []);
    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProgress = async () => {
    try {
      const { data, error } = await supabase
        .from('student_video_progress')
        .select('*')
        .eq('student_id', studentId);

      if (error) throw error;

      const progressMap: Record<string, VideoProgress> = {};
      data?.forEach((p: any) => {
        progressMap[p.video_id] = p;
      });

      setProgress(progressMap);
    } catch (error) {
      console.error('Error fetching progress:', error);
    }
  };

  const handleVideoClick = (video: VideoLesson) => {
    setSelectedVideo(video);
  };

  const handleVideoClose = () => {
    setSelectedVideo(null);
    // Refresh progress after watching
    fetchProgress();
  };

  const handleToggleBookmark = async (videoId: string) => {
    try {
      const currentProgress = progress[videoId];
      const newBookmarkState = !currentProgress?.bookmarked;

      const { error } = await supabase
        .from('student_video_progress')
        .upsert({
          student_id: studentId,
          video_id: videoId,
          bookmarked: newBookmarkState,
          watched_seconds: currentProgress?.watched_seconds || 0,
          total_duration_seconds: videos.find((v) => v.id === videoId)?.duration_seconds || 0,
        });

      if (error) throw error;

      // Update local state
      setProgress((prev) => ({
        ...prev,
        [videoId]: {
          ...prev[videoId],
          bookmarked: newBookmarkState,
        },
      }));
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    }
  };

  const subjects = Array.from(new Set(videos.map((v) => v.subject)));
  const topics = selectedSubject === 'all'
    ? []
    : Array.from(new Set(videos.filter((v) => v.subject === selectedSubject).map((v) => v.topic)));

  const filteredVideos = videos.filter((video) => {
    if (selectedSubject !== 'all' && video.subject !== selectedSubject) return false;
    if (selectedTopic !== 'all' && video.topic !== selectedTopic) return false;
    if (filterDifficulty !== 'all' && video.difficulty !== filterDifficulty) return false;
    if (searchQuery && !video.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'text-green-600 bg-green-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'hard':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'Kolay';
      case 'medium':
        return 'Orta';
      case 'hard':
        return 'Zor';
      default:
        return difficulty;
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <Play className="w-6 h-6 text-red-600" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Video Dersler</h2>
        </div>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="text-gray-600 dark:text-gray-400 mt-4">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Play className="w-6 h-6 text-red-600" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Video Dersler</h2>
          </div>
          <div className="bg-red-100 dark:bg-red-900 px-4 py-2 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-300 font-semibold">
              {filteredVideos.length} Video
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Video ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <select
            value={selectedSubject}
            onChange={(e) => {
              setSelectedSubject(e.target.value);
              setSelectedTopic('all');
            }}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">Tüm Dersler</option>
            {subjects.map((subject) => (
              <option key={subject} value={subject}>
                {subject}
              </option>
            ))}
          </select>

          {selectedSubject !== 'all' && topics.length > 0 && (
            <select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">Tüm Konular</option>
              {topics.map((topic) => (
                <option key={topic} value={topic}>
                  {topic}
                </option>
              ))}
            </select>
          )}

          <select
            value={filterDifficulty}
            onChange={(e) => setFilterDifficulty(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">Tüm Seviyeler</option>
            <option value="easy">Kolay</option>
            <option value="medium">Orta</option>
            <option value="hard">Zor</option>
          </select>
        </div>

        {/* Videos Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVideos.map((video) => {
            const videoProgress = progress[video.id];
            const isCompleted = videoProgress?.is_completed || false;
            const isBookmarked = videoProgress?.bookmarked || false;
            const completionPct = videoProgress?.completion_percentage || 0;

            return (
              <div
                key={video.id}
                className="relative group bg-gray-50 dark:bg-gray-700 rounded-lg overflow-hidden hover:shadow-lg transition-all"
              >
                {/* Thumbnail */}
                <div className="relative aspect-video cursor-pointer" onClick={() => handleVideoClick(video)}>
                  <img
                    src={video.thumbnail_url}
                    alt={video.title}
                    className="w-full h-full object-cover"
                  />
                  {/* Play overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-red-600 rounded-full p-4">
                      <Play className="w-8 h-8 text-white" fill="white" />
                    </div>
                  </div>

                  {/* Completion badge */}
                  {isCompleted && (
                    <div className="absolute top-2 right-2 bg-green-600 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Tamamlandı
                    </div>
                  )}

                  {/* Progress bar */}
                  {completionPct > 0 && !isCompleted && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gray-800 bg-opacity-75 p-1">
                      <div className="w-full bg-gray-600 rounded-full h-1">
                        <div
                          className="bg-red-600 h-1 rounded-full"
                          style={{ width: `${completionPct}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Duration */}
                  {video.duration_seconds && (
                    <div className="absolute bottom-2 left-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs font-semibold">
                      {formatDuration(video.duration_seconds)}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-bold text-gray-900 dark:text-white text-sm line-clamp-2">
                      {video.title}
                    </h3>
                    <button
                      onClick={() => handleToggleBookmark(video.id)}
                      className="flex-shrink-0"
                    >
                      {isBookmarked ? (
                        <BookmarkCheck className="w-5 h-5 text-yellow-600" />
                      ) : (
                        <BookmarkPlus className="w-5 h-5 text-gray-400 hover:text-yellow-600" />
                      )}
                    </button>
                  </div>

                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                    {video.description}
                  </p>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600 dark:text-gray-400">
                      {video.subject} - {video.topic}
                    </span>
                    <span className={`px-2 py-1 rounded-full font-semibold ${getDifficultyColor(video.difficulty)}`}>
                      {getDifficultyText(video.difficulty)}
                    </span>
                  </div>

                  <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600 text-xs text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-2">
                      <span>{video.instructor_name}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        {video.view_count} görüntüleme
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredVideos.length === 0 && (
          <div className="text-center py-12">
            <Play className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Henüz video bulunamadı</p>
          </div>
        )}
      </div>

      {/* Video Modal */}
      {selectedVideo && (
        <VideoPlayer
          video={selectedVideo}
          studentId={studentId}
          onClose={handleVideoClose}
          initialProgress={progress[selectedVideo.id]}
        />
      )}
    </>
  );
}

// Video Player Component
interface VideoPlayerProps {
  video: VideoLesson;
  studentId: string;
  onClose: () => void;
  initialProgress?: VideoProgress;
}

function VideoPlayer({ video, studentId, onClose, initialProgress }: VideoPlayerProps) {
  const [currentTime, setCurrentTime] = useState(initialProgress?.watched_seconds || 0);

  const handleProgressUpdate = async (watchedSeconds: number, totalSeconds: number) => {
    try {
      await supabase.rpc('update_video_progress', {
        p_student_id: studentId,
        p_video_id: video.id,
        p_watched_seconds: Math.floor(watchedSeconds),
        p_total_duration_seconds: Math.floor(totalSeconds || video.duration_seconds || 0),
      });
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      // In real implementation, get actual video time from YouTube API
      const newTime = currentTime + 1;
      setCurrentTime(newTime);

      // Update progress every 10 seconds
      if (newTime % 10 === 0) {
        handleProgressUpdate(newTime, video.duration_seconds);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [currentTime]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">{video.title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </div>

        <div className="aspect-video bg-black">
          <iframe
            className="w-full h-full"
            src={`https://www.youtube.com/embed/${video.youtube_video_id}?autoplay=1&start=${initialProgress?.watched_seconds || 0}`}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>

        <div className="p-6">
          <div className="mb-4">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Açıklama</h4>
            <p className="text-gray-600 dark:text-gray-400">{video.description}</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500 dark:text-gray-400">Eğitmen:</span>
              <p className="font-semibold text-gray-900 dark:text-white">{video.instructor_name}</p>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Ders:</span>
              <p className="font-semibold text-gray-900 dark:text-white">{video.subject}</p>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Konu:</span>
              <p className="font-semibold text-gray-900 dark:text-white">{video.topic}</p>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Seviye:</span>
              <p className="font-semibold text-gray-900 dark:text-white">
                {video.difficulty === 'easy' ? 'Kolay' : video.difficulty === 'medium' ? 'Orta' : 'Zor'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
