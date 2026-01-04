import { Star } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";

interface BeautyScoreCardProps {
  score: number;
  label: string;
  icon?: React.ReactNode;
  color?: "red" | "yellow" | "green";
}

export default function BeautyScoreCard({
  score,
  label,
  icon,
  color,
}: BeautyScoreCardProps) {
  const { t, language } = useLanguageuage();
  const getColor = (score: number) => {
    if (color) {
      return color;
    }
    if (score >= 80) return "green";
    if (score >= 60) return "yellow";
    return "red";
  };

  const scoreColor = getColor(score);

  const colorClasses = {
    red: {
      bg: "bg-red-50",
      border: "border-red-200",
      text: "text-red-700",
      bar: "bg-red-500",
      gradient: "from-red-500 to-red-600",
    },
    yellow: {
      bg: "bg-yellow-50",
      border: "border-yellow-200",
      text: "text-yellow-700",
      bar: "bg-yellow-500",
      gradient: "from-yellow-500 to-yellow-600",
    },
    green: {
      bg: "bg-green-50",
      border: "border-green-200",
      text: "text-green-700",
      bar: "bg-green-500",
      gradient: "from-green-500 to-green-600",
    },
  };

  const colors = colorClasses[scoreColor];

  return (
    <div
      className={`${colors.bg} border ${colors.border} rounded-xl p-6 transition-all duration-300 hover:shadow-lg`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {icon && (
            <div
              className={`p-2 rounded-lg bg-gradient-to-br ${colors.gradient} text-white`}
            >
              {icon}
            </div>
          )}
          <h3 className="font-semibold text-brown-800">{label}</h3>
        </div>
        <span className={`text-2xl font-bold ${colors.text}`}>
          {score.toFixed(1)}
        </span>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div
          className={`h-full ${colors.bar} rounded-full transition-all duration-1000 ease-out`}
          style={{ width: `${score}%` }}
        />
      </div>

      <div className="mt-3 text-sm text-gray-600">
        {score >= 90 && t.detection.grades.exceptional}
        {score >= 80 && score < 90 && t.detection.grades.excellent}
        {score >= 70 && score < 80 && t.detection.grades.veryGood}
        {score >= 60 && score < 70 && t.detection.grades.good}
        {score >= 50 && score < 60 && t.detection.grades.fair}
        {score < 50 && t.detection.grades.needsImprovement}
      </div>
    </div>
  );
}

export function StarRating({ score }: { score: number }) {
  const stars = Math.round((score / 100) * 5);

  return (
    <div className="flex gap-1">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`w-6 h-6 ${
            i < stars
              ? "fill-gold-500 text-gold-500"
              : "fill-gray-300 text-gray-300"
          }`}
        />
      ))}
    </div>
  );
}
