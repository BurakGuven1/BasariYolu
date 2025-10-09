import { useState, useEffect } from 'react';
import { Trophy, Star, TrendingUp, Award } from 'lucide-react';
import { getStudentPoints, getPointsHistory, getPointsToNextLevel } from '../lib/pointsSystem';

interface PointsDisplayProps {
  studentId: string;
}

export default function PointsDisplay({ studentId }: PointsDisplayProps) {
  const [points, setPoints] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    if (studentId) {
      loadPoints();
    }
  }, [studentId]);

  const loadPoints = async () => {
    const data = await getStudentPoints(studentId);
    setPoints(data);

    if (showDetails) {
      const historyData = await getPointsHistory(studentId, 5);
      setHistory(historyData);
    }
  };

  if (!points) return null;

  const pointsToNext = getPointsToNextLevel(points.total_points, points.level);
  const progressPercentage = ((points.total_points % 100) / 100) * 100;

  return (
    <div className="relative">
      {/* Compact Display - Sağ Üst */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105"
      >
        <Trophy className="h-5 w-5" />
        <div className="text-left">
          <div className="text-xs opacity-90">Level {points.level}</div>
          <div className="font-bold">{points.total_points} Puan</div>
        </div>
      </button>

      {/* Detailed Modal */}
      {showDetails && (
        <div className="absolute right-0 top-14 bg-white rounded-xl shadow-2xl p-6 w-80 z-50 border-2 border-amber-200">
          <button
            onClick={() => setShowDetails(false)}
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>

          {/* Level & Points */}
          <div className="text-center mb-4">
            <div className="bg-gradient-to-br from-amber-400 to-orange-500 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-3">
              <Award className="h-10 w-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">Level {points.level}</h3>
            <p className="text-3xl font-bold text-amber-600">{points.total_points}</p>
            <p className="text-sm text-gray-600">Toplam Puan</p>
          </div>

          {/* Progress to Next Level */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Sonraki Level</span>
              <span>{pointsToNext} puan kaldı</span>
            </div>
            <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-amber-500 to-orange-500 h-full transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          {/* Recent Activity */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Son Aktiviteler
            </h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {history.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  Haydi çalışmaya devam 💪
                </p>
              ) : (
                history.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-sm bg-gray-50 rounded-lg p-2">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-amber-500" />
                      <span className="text-gray-700">{item.reason}</span>
                    </div>
                    <span className="font-semibold text-green-600">+{item.points}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}