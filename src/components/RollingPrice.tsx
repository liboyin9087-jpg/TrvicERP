// =====================================================
// TravelCanvas - RollingPrice Component
// 滾動數字動畫效果
// =====================================================

import React, { useEffect, useRef, useState } from 'react';

interface RollingPriceProps {
  value: number;
  duration?: number;
  className?: string;
}

const RollingPrice: React.FC<RollingPriceProps> = ({ 
  value, 
  duration = 600,
  className = '' 
}) => {
  const [displayValue, setDisplayValue] = useState(value);
  const previousValue = useRef(value);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const startValue = previousValue.current;
    const endValue = value;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (ease-out-cubic)
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      
      const currentValue = Math.round(
        startValue + (endValue - startValue) * easeProgress
      );
      
      setDisplayValue(currentValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        previousValue.current = endValue;
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value, duration]);

  // 格式化數字
  const formatNumber = (num: number): string => {
    return num.toLocaleString('zh-TW');
  };

  return (
    <span className={`tabular-nums tracking-tight ${className}`}>
      {formatNumber(displayValue)}
    </span>
  );
};

export default RollingPrice;
