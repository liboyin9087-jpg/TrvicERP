/**
 * TrvicERP Design System - Avatar Stack Component
 * 
 * 重疊的頭像堆疊元件，用於展示團隊成員
 */

import React, { useState } from 'react';
import { avatarStack } from '../../tokens/design-tokens';
import { AvatarStackProps, StackSize, OverlapStyle, User } from '../../types';
import { cn, getAvatarColor, getInitials } from '../../utils';

// 尺寸配置
const sizeConfig: Record<StackSize, {
  avatar: string;
  avatarPx: number;
  overflow: string;
  border: string;
  fontSize: string;
  initialsFont: string;
}> = {
  xsmall: {
    avatar: 'w-6 h-6',
    avatarPx: 24,
    overflow: 'h-5 min-w-5 px-1',
    border: 'ring-[1.5px]',
    fontSize: 'text-[10px]',
    initialsFont: 'text-[10px]',
  },
  small: {
    avatar: 'w-8 h-8',
    avatarPx: 32,
    overflow: 'h-6 min-w-6 px-1.5',
    border: 'ring-2',
    fontSize: 'text-[11px]',
    initialsFont: 'text-xs',
  },
  medium: {
    avatar: 'w-10 h-10',
    avatarPx: 40,
    overflow: 'h-7 min-w-7 px-1.5',
    border: 'ring-2',
    fontSize: 'text-xs',
    initialsFont: 'text-sm',
  },
  large: {
    avatar: 'w-12 h-12',
    avatarPx: 48,
    overflow: 'h-8 min-w-8 px-2',
    border: 'ring-[2.5px]',
    fontSize: 'text-[13px]',
    initialsFont: 'text-base',
  },
};

// Overlap 配置 (負值 margin)
const overlapConfig: Record<StackSize, Record<OverlapStyle, string>> = {
  xsmall: { tight: '-ml-2.5', normal: '-ml-2', loose: '-ml-1.5' },
  small: { tight: '-ml-3', normal: '-ml-2.5', loose: '-ml-1.5' },
  medium: { tight: '-ml-4', normal: '-ml-3', loose: '-ml-2' },
  large: { tight: '-ml-5', normal: '-ml-3.5', loose: '-ml-2.5' },
};

// 單一 Avatar 內部元件
interface StackAvatarProps {
  user: User;
  size: StackSize;
  border: 'none' | 'white' | 'themed';
  zIndex: number;
  isFirst: boolean;
  overlap: OverlapStyle;
  isCurrentUser?: boolean;
  onDark?: boolean;
  onClick?: () => void;
  onHover?: (user: User | null) => void;
}

const StackAvatar: React.FC<StackAvatarProps> = ({
  user,
  size,
  border,
  zIndex,
  isFirst,
  overlap,
  isCurrentUser,
  onDark,
  onClick,
  onHover,
}) => {
  const [imageError, setImageError] = useState(false);
  const config = sizeConfig[size];
  const colors = getAvatarColor(user.id);
  const initials = getInitials(user.name);
  const hasImage = user.avatar && !imageError;

  const borderColor = border === 'themed' 
    ? 'ring-teal-500' 
    : onDark 
      ? 'ring-neutral-800' 
      : 'ring-white';

  const currentUserRing = isCurrentUser ? 'ring-teal-400' : borderColor;

  return (
    <div
      className={cn(
        'relative rounded-full overflow-hidden flex-shrink-0',
        'transition-all duration-150 ease-out',
        config.avatar,
        border !== 'none' && config.border,
        border !== 'none' && currentUserRing,
        !isFirst && overlapConfig[size][overlap],
        onClick && 'cursor-pointer hover:scale-110 hover:z-50 hover:shadow-lg'
      )}
      style={{ zIndex }}
      onClick={onClick}
      onMouseEnter={() => onHover?.(user)}
      onMouseLeave={() => onHover?.(null)}
      title={user.name}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {hasImage ? (
        <img
          src={user.avatar}
          alt={user.name}
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
        />
      ) : (
        <div
          className={cn(
            'w-full h-full flex items-center justify-center font-semibold',
            config.initialsFont
          )}
          style={{
            backgroundColor: colors.background,
            color: colors.text,
          }}
        >
          {initials}
        </div>
      )}

      {/* 當前用戶標示 */}
      {isCurrentUser && (
        <div className="absolute inset-0 ring-2 ring-teal-400 ring-inset rounded-full" />
      )}
    </div>
  );
};

// Overflow Counter 元件
interface OverflowCounterProps {
  count: number;
  size: StackSize;
  overlap: OverlapStyle;
  onDark?: boolean;
  onClick?: () => void;
}

const OverflowCounter: React.FC<OverflowCounterProps> = ({
  count,
  size,
  overlap,
  onDark,
  onClick,
}) => {
  const config = sizeConfig[size];
  const overflowStyles = onDark 
    ? avatarStack.overflow.dark 
    : avatarStack.overflow.light;

  // 格式化數字
  const displayCount = count > 999 ? '999+' : `+${count}`;

  return (
    <button
      className={cn(
        'rounded-full flex items-center justify-center font-semibold flex-shrink-0',
        'transition-all duration-150 ease-out',
        config.overflow,
        config.fontSize,
        config.border,
        onDark ? 'ring-neutral-800' : 'ring-white',
        overlapConfig[size][overlap],
        onClick && 'cursor-pointer hover:scale-105'
      )}
      style={{
        backgroundColor: overflowStyles.background,
        color: overflowStyles.text,
      }}
      onClick={onClick}
      aria-label={`還有 ${count} 位成員`}
    >
      {displayCount}
    </button>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const AvatarStack: React.FC<AvatarStackProps> = ({
  users,
  size = 'medium',
  maxVisible = 3,
  direction = 'left',
  overlap = 'normal',
  borderStyle = 'white',
  showOverflow = true,
  onDark = false,
  className,
  onClick,
  onOverflowClick,
  onUserClick,
  currentUserId,
}) => {
  const [hoveredUser, setHoveredUser] = useState<User | null>(null);

  // 計算顯示的用戶
  const visibleUsers = users.slice(0, maxVisible);
  const overflowCount = users.length - maxVisible;
  const hasOverflow = overflowCount > 0 && showOverflow;

  // 根據方向決定 z-index
  const getZIndex = (index: number) => {
    if (direction === 'left') {
      return maxVisible - index;
    }
    return index + 1;
  };

  return (
    <div
      className={cn(
        'inline-flex items-center',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
      role="group"
      aria-label={`${users.length} 位成員`}
    >
      {/* 頭像列表 */}
      {visibleUsers.map((user, index) => (
        <StackAvatar
          key={user.id}
          user={user}
          size={size}
          border={borderStyle}
          zIndex={getZIndex(index)}
          isFirst={index === 0}
          overlap={overlap}
          isCurrentUser={currentUserId === user.id}
          onDark={onDark}
          onClick={onUserClick ? () => onUserClick(user) : undefined}
          onHover={setHoveredUser}
        />
      ))}

      {/* Overflow Counter */}
      {hasOverflow && (
        <OverflowCounter
          count={overflowCount}
          size={size}
          overlap={overlap}
          onDark={onDark}
          onClick={onOverflowClick}
        />
      )}

      {/* Tooltip (hover 時顯示) */}
      {hoveredUser && (
        <div className="sr-only">
          {hoveredUser.name}
          {hoveredUser.department && ` - ${hoveredUser.department}`}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// WITH LABEL VARIANT
// ============================================================================

export interface AvatarStackWithLabelProps extends AvatarStackProps {
  label?: string;
  showLabel?: boolean;
}

export const AvatarStackWithLabel: React.FC<AvatarStackWithLabelProps> = ({
  users,
  label,
  showLabel = true,
  size = 'medium',
  ...props
}) => {
  const defaultLabel = `${users.length} 人`;
  const displayLabel = label || defaultLabel;

  return (
    <div className="inline-flex items-center gap-2">
      <AvatarStack users={users} size={size} {...props} />
      {showLabel && (
        <span className="text-sm text-neutral-600">
          {displayLabel}
        </span>
      )}
    </div>
  );
};

// ============================================================================
// EXPORTS
// ============================================================================

export default AvatarStack;
export type { AvatarStackProps, StackSize, OverlapStyle } from '../../types';
