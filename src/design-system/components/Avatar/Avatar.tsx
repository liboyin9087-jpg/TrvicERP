/**
 * TrvicERP Design System - Avatar Component
 * 
 * 單一用戶頭像元件，支援圖片、縮寫 fallback、在線狀態指示
 */

import React, { useState } from 'react';
import { User as UserIcon } from 'lucide-react';
import { avatarStack } from '../../tokens/design-tokens';
import { AvatarProps, AvatarSize, OnlineStatus, User } from '../../types';
import { cn, getAvatarColor, getInitials } from '../../utils';

// 尺寸對應的 CSS 值
const sizeConfig: Record<AvatarSize, {
  container: string;
  initials: string;
  icon: number;
  statusDot: string;
  statusOffset: string;
}> = {
  xsmall: {
    container: 'w-6 h-6',
    initials: 'text-[10px]',
    icon: 12,
    statusDot: 'w-1.5 h-1.5',
    statusOffset: '-right-0.5 -bottom-0.5',
  },
  small: {
    container: 'w-8 h-8',
    initials: 'text-xs',
    icon: 14,
    statusDot: 'w-2 h-2',
    statusOffset: '-right-0.5 -bottom-0.5',
  },
  medium: {
    container: 'w-10 h-10',
    initials: 'text-sm',
    icon: 16,
    statusDot: 'w-2.5 h-2.5',
    statusOffset: 'right-0 bottom-0',
  },
  large: {
    container: 'w-12 h-12',
    initials: 'text-base',
    icon: 20,
    statusDot: 'w-3 h-3',
    statusOffset: 'right-0 bottom-0',
  },
  xlarge: {
    container: 'w-16 h-16',
    initials: 'text-xl',
    icon: 24,
    statusDot: 'w-3.5 h-3.5',
    statusOffset: 'right-0.5 bottom-0.5',
  },
};

// 在線狀態顏色
const statusColors: Record<OnlineStatus, string> = {
  online: avatarStack.status.online,
  away: avatarStack.status.away,
  busy: avatarStack.status.busy,
  offline: avatarStack.status.offline,
};

// 邊框樣式
const borderStyles: Record<'none' | 'white' | 'themed', string> = {
  none: '',
  white: 'ring-2 ring-white',
  themed: 'ring-2 ring-teal-500',
};

export const Avatar: React.FC<AvatarProps> = ({
  user,
  size = 'medium',
  showStatus = false,
  status = 'offline',
  border = 'none',
  className,
  onClick,
}) => {
  const [imageError, setImageError] = useState(false);
  const config = sizeConfig[size];
  const colors = getAvatarColor(user.id);
  const initials = getInitials(user.name);
  const hasImage = user.avatar && !imageError;

  const handleImageError = () => {
    setImageError(true);
  };

  const containerClasses = cn(
    // 基礎樣式
    'relative inline-flex items-center justify-center rounded-full overflow-hidden',
    'transition-all duration-150 ease-out',
    // 尺寸
    config.container,
    // 邊框
    borderStyles[border],
    // 可點擊時的樣式
    onClick && 'cursor-pointer hover:scale-110 hover:z-10 hover:shadow-lg',
    className
  );

  return (
    <div
      className={containerClasses}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
      aria-label={user.name}
      title={user.name}
    >
      {/* 頭像圖片或 Fallback */}
      {hasImage ? (
        <img
          src={user.avatar}
          alt={user.name}
          className="w-full h-full object-cover"
          onError={handleImageError}
        />
      ) : (
        <div
          className={cn(
            'w-full h-full flex items-center justify-center font-semibold',
            config.initials
          )}
          style={{
            backgroundColor: colors.background,
            color: colors.text,
          }}
        >
          {initials || <UserIcon size={config.icon} />}
        </div>
      )}

      {/* 在線狀態指示器 */}
      {showStatus && (
        <span
          className={cn(
            'absolute rounded-full ring-2 ring-white',
            config.statusDot,
            config.statusOffset
          )}
          style={{ backgroundColor: statusColors[status] }}
          aria-label={`狀態：${status}`}
        />
      )}
    </div>
  );
};

// ============================================================================
// AVATAR GROUP (簡單的頭像組，無重疊)
// ============================================================================

export interface AvatarGroupProps {
  users: User[];
  size?: AvatarSize;
  max?: number;
  className?: string;
}

export const AvatarGroup: React.FC<AvatarGroupProps> = ({
  users,
  size = 'medium',
  max = 5,
  className,
}) => {
  const visibleUsers = users.slice(0, max);
  const remainingCount = users.length - max;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {visibleUsers.map((user) => (
        <Avatar key={user.id} user={user} size={size} />
      ))}
      {remainingCount > 0 && (
        <span className="text-sm text-neutral-500">
          +{remainingCount}
        </span>
      )}
    </div>
  );
};

// ============================================================================
// EXPORTS
// ============================================================================

export default Avatar;
export type { AvatarProps, AvatarSize, OnlineStatus } from '../../types';
