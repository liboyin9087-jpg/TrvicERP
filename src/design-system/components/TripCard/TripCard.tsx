/**
 * TrvicERP Design System - Trip Card Component
 * 
 * 旅程卡片元件，整合 StatusBadge、AvatarStack、ProgressRing
 * 支援旅行社、福委、員工三種角色的差異化顯示
 */

import React, { useState } from 'react';
import { 
  Bookmark, 
  BookmarkCheck, 
  Calendar, 
  Users, 
  DollarSign,
  Star,
  TrendingUp,
  MoreHorizontal,
  CheckSquare,
  Square
} from 'lucide-react';
import { tripCard } from '../../tokens/design-tokens';
import { TripCardProps, CardSize, UserRole, Trip } from '../../types';
import { 
  cn, 
  formatCurrency, 
  formatDateRange, 
  formatTripDuration,
  countryCodeToFlag 
} from '../../utils';

// Sub-components
import { StatusBadge } from '../StatusBadge';
import { AvatarStack } from '../AvatarStack';
import { ProgressRing } from '../ProgressRing';

// 尺寸配置
const sizeConfig: Record<CardSize, {
  wrapper: string;
  image: string;
  padding: string;
  title: string;
  subtitle: string;
  showSecondaryInfo: boolean;
  showActions: boolean;
  ringSize: 'xsmall' | 'small' | 'medium';
  avatarSize: 'xsmall' | 'small' | 'medium';
  badgeSize: 'small' | 'medium';
  maxVisibleAvatars: number;
}> = {
  large: {
    wrapper: 'w-[360px] h-[420px]',
    image: 'h-[200px]',
    padding: 'p-5',
    title: 'text-xl',
    subtitle: 'text-sm',
    showSecondaryInfo: true,
    showActions: true,
    ringSize: 'small',
    avatarSize: 'small',
    badgeSize: 'medium',
    maxVisibleAvatars: 4,
  },
  medium: {
    wrapper: 'w-[320px] h-[380px]',
    image: 'h-[180px]',
    padding: 'p-4',
    title: 'text-lg',
    subtitle: 'text-sm',
    showSecondaryInfo: true,
    showActions: true,
    ringSize: 'small',
    avatarSize: 'small',
    badgeSize: 'medium',
    maxVisibleAvatars: 3,
  },
  small: {
    wrapper: 'w-[280px] h-[320px]',
    image: 'h-[140px]',
    padding: 'p-4',
    title: 'text-base',
    subtitle: 'text-xs',
    showSecondaryInfo: true,
    showActions: false,
    ringSize: 'xsmall',
    avatarSize: 'xsmall',
    badgeSize: 'small',
    maxVisibleAvatars: 3,
  },
  compact: {
    wrapper: 'w-[240px] h-[200px]',
    image: 'h-[100px]',
    padding: 'p-3',
    title: 'text-sm',
    subtitle: 'text-xs',
    showSecondaryInfo: false,
    showActions: false,
    ringSize: 'xsmall',
    avatarSize: 'xsmall',
    badgeSize: 'small',
    maxVisibleAvatars: 2,
  },
  list: {
    wrapper: 'w-full h-[120px]',
    image: 'w-[120px] h-full',
    padding: 'p-4',
    title: 'text-base',
    subtitle: 'text-sm',
    showSecondaryInfo: true,
    showActions: false,
    ringSize: 'xsmall',
    avatarSize: 'xsmall',
    badgeSize: 'small',
    maxVisibleAvatars: 3,
  },
};

// 預設圖片
const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400&h=300&fit=crop';

// ============================================================================
// CARD HEADER (Status Badge + Bookmark)
// ============================================================================

interface CardHeaderProps {
  trip: Trip;
  size: CardSize;
  isBookmarked?: boolean;
  isSelected?: boolean;
  showSelect?: boolean;
  onBookmarkToggle?: () => void;
  onSelectToggle?: () => void;
}

const CardHeader: React.FC<CardHeaderProps> = ({
  trip,
  size,
  isBookmarked,
  isSelected,
  showSelect,
  onBookmarkToggle,
  onSelectToggle,
}) => {
  const config = sizeConfig[size];

  return (
    <div className="absolute top-4 left-4 right-4 flex items-start justify-between z-10">
      <StatusBadge 
        status={trip.status} 
        size={config.badgeSize}
        onDark={true}
      />
      
      <div className="flex items-center gap-2">
        {showSelect && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelectToggle?.();
            }}
            className="p-1 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors"
            aria-label={isSelected ? '取消選取' : '選取'}
          >
            {isSelected ? (
              <CheckSquare size={18} className="text-white" />
            ) : (
              <Square size={18} className="text-white/70" />
            )}
          </button>
        )}
        
        {onBookmarkToggle && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onBookmarkToggle();
            }}
            className="p-1 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors"
            aria-label={isBookmarked ? '取消收藏' : '收藏'}
          >
            {isBookmarked ? (
              <BookmarkCheck size={18} className="text-white" />
            ) : (
              <Bookmark size={18} className="text-white/70" />
            )}
          </button>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// CARD CONTENT (Info + Participants + Meta)
// ============================================================================

interface CardContentProps {
  trip: Trip;
  size: CardSize;
  role: UserRole;
  showProgress?: boolean;
}

const CardContent: React.FC<CardContentProps> = ({
  trip,
  size,
  role,
  showProgress,
}) => {
  const config = sizeConfig[size];
  const flag = trip.destinationCode ? countryCodeToFlag(trip.destinationCode) : '🌏';

  return (
    <div className={cn('flex flex-col gap-3', config.padding, 'pt-4')}>
      {/* 標題區 */}
      <div>
        <h3 className={cn('font-bold text-white line-clamp-2', config.title)}>
          {trip.title}
        </h3>
        <p className={cn('text-white/80 mt-1', config.subtitle)}>
          {formatDateRange(trip.startDate, trip.endDate)}
        </p>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-sm">{flag}</span>
          <span className="text-white/70 text-sm">{trip.destination}</span>
        </div>
      </div>

      {/* 參與者 */}
      <div className="flex items-center justify-between">
        <AvatarStack
          users={trip.participants}
          size={config.avatarSize}
          maxVisible={config.maxVisibleAvatars}
          onDark={true}
          borderStyle="white"
        />
        <span className="text-white/70 text-sm">
          {trip.totalParticipants} 人
          {trip.maxParticipants && ` / ${trip.maxParticipants}`}
        </span>
      </div>

      {/* 次要資訊 (依角色) */}
      {config.showSecondaryInfo && (
        <div className="flex items-center justify-between pt-2 border-t border-white/10">
          {/* 左側資訊 */}
          <div className="flex items-center gap-4 text-white/70 text-sm">
            <span className="flex items-center gap-1">
              <Calendar size={14} />
              {formatTripDuration(trip.startDate, trip.endDate)}
            </span>
            
            {/* 角色特定資訊 */}
            {role === 'travelAgency' && trip.pricePerPerson && (
              <span className="flex items-center gap-1">
                <DollarSign size={14} />
                {formatCurrency(trip.pricePerPerson)}/人
              </span>
            )}
            
            {role === 'welfareCommittee' && trip.voteCount !== undefined && (
              <span className="flex items-center gap-1">
                <Users size={14} />
                {trip.voteCount} 人選擇
              </span>
            )}
            
            {role === 'employee' && trip.rating && (
              <span className="flex items-center gap-1">
                <Star size={14} className="fill-yellow-400 text-yellow-400" />
                {trip.rating}
              </span>
            )}
          </div>

          {/* 右側進度環 */}
          {showProgress && trip.progress !== undefined && (
            <ProgressRing
              value={trip.progress}
              size={config.ringSize}
              displayMode="percentage"
              onDark={true}
              animation="onMount"
            />
          )}
          
          {/* 旅行社: 利潤率 */}
          {role === 'travelAgency' && trip.profitMargin !== undefined && !showProgress && (
            <div className="flex items-center gap-1 text-emerald-400 text-sm">
              <TrendingUp size={14} />
              <span>{trip.profitMargin}%</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// CARD ACTIONS (Footer Buttons)
// ============================================================================

interface CardActionsProps {
  role: UserRole;
  onPrimaryAction?: () => void;
  onSecondaryAction?: () => void;
}

const CardActions: React.FC<CardActionsProps> = ({
  role,
  onPrimaryAction,
  onSecondaryAction,
}) => {
  // 根據角色決定按鈕文字
  const actionLabels: Record<UserRole, { primary: string; secondary: string }> = {
    travelAgency: { primary: '編輯團期', secondary: '查看詳情' },
    welfareCommittee: { primary: '管理報名', secondary: '查看詳情' },
    employee: { primary: '立即報名', secondary: '了解更多' },
  };

  const labels = actionLabels[role];

  return (
    <div className="flex gap-2 px-5 pb-5">
      {onSecondaryAction && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSecondaryAction();
          }}
          className={cn(
            'flex-1 py-2 px-4 rounded-lg text-sm font-medium',
            'bg-white/10 text-white hover:bg-white/20',
            'transition-colors duration-150'
          )}
        >
          {labels.secondary}
        </button>
      )}
      {onPrimaryAction && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPrimaryAction();
          }}
          className={cn(
            'flex-1 py-2 px-4 rounded-lg text-sm font-medium',
            'bg-coral-500 text-white hover:bg-coral-600',
            'transition-colors duration-150'
          )}
          style={{ backgroundColor: '#FF6B6B' }}
        >
          {labels.primary}
        </button>
      )}
    </div>
  );
};

// ============================================================================
// MAIN TRIP CARD COMPONENT
// ============================================================================

export const TripCard: React.FC<TripCardProps> = ({
  trip,
  size = 'medium',
  role = 'employee',
  showProgress = true,
  showActions = true,
  isBookmarked = false,
  isSelected = false,
  className,
  onClick,
  onBookmarkToggle,
  onSelectToggle,
  onPrimaryAction,
  onSecondaryAction,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const config = sizeConfig[size];
  const imageUrl = trip.imageUrl || DEFAULT_IMAGE;

  // List 模式使用不同的佈局
  if (size === 'list') {
    return (
      <TripCardList
        trip={trip}
        role={role}
        showProgress={showProgress}
        isBookmarked={isBookmarked}
        isSelected={isSelected}
        className={className}
        onClick={onClick}
        onBookmarkToggle={onBookmarkToggle}
        onSelectToggle={onSelectToggle}
      />
    );
  }

  return (
    <article
      className={cn(
        'relative overflow-hidden rounded-2xl cursor-pointer',
        'transition-all duration-300 ease-out',
        config.wrapper,
        isHovered && 'shadow-2xl -translate-y-1',
        isSelected && 'ring-2 ring-teal-500',
        className
      )}
      style={{
        boxShadow: isHovered ? tripCard.shadow.hover : tripCard.shadow.default,
      }}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="button"
      tabIndex={0}
      aria-label={`${trip.title} - ${trip.destination}`}
    >
      {/* 背景圖片 */}
      <div 
        className={cn('absolute inset-0 bg-cover bg-center', config.image)}
        style={{ backgroundImage: `url(${imageUrl})` }}
      />
      
      {/* 漸層遮罩 */}
      <div 
        className="absolute inset-0"
        style={{ background: tripCard.gradient.overlay }}
      />

      {/* Header */}
      <CardHeader
        trip={trip}
        size={size}
        isBookmarked={isBookmarked}
        isSelected={isSelected}
        showSelect={role === 'travelAgency'}
        onBookmarkToggle={onBookmarkToggle}
        onSelectToggle={onSelectToggle}
      />

      {/* Content (底部對齊) */}
      <div className="absolute bottom-0 left-0 right-0">
        <CardContent
          trip={trip}
          size={size}
          role={role}
          showProgress={showProgress}
        />

        {/* Actions */}
        {showActions && config.showActions && (onPrimaryAction || onSecondaryAction) && (
          <CardActions
            role={role}
            onPrimaryAction={onPrimaryAction}
            onSecondaryAction={onSecondaryAction}
          />
        )}
      </div>
    </article>
  );
};

// ============================================================================
// LIST VARIANT
// ============================================================================

interface TripCardListProps {
  trip: Trip;
  role: UserRole;
  showProgress?: boolean;
  isBookmarked?: boolean;
  isSelected?: boolean;
  className?: string;
  onClick?: () => void;
  onBookmarkToggle?: () => void;
  onSelectToggle?: () => void;
}

const TripCardList: React.FC<TripCardListProps> = ({
  trip,
  role,
  showProgress,
  isBookmarked,
  isSelected,
  className,
  onClick,
  onBookmarkToggle,
  onSelectToggle,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const imageUrl = trip.imageUrl || DEFAULT_IMAGE;
  const flag = trip.destinationCode ? countryCodeToFlag(trip.destinationCode) : '🌏';

  return (
    <article
      className={cn(
        'relative flex overflow-hidden rounded-xl cursor-pointer',
        'bg-white border border-neutral-200',
        'transition-all duration-200 ease-out',
        'h-[120px]',
        isHovered && 'shadow-lg border-neutral-300',
        isSelected && 'ring-2 ring-teal-500',
        className
      )}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="button"
      tabIndex={0}
    >
      {/* 左側圖片 */}
      <div 
        className="w-[120px] h-full flex-shrink-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${imageUrl})` }}
      >
        {/* Status Badge */}
        <div className="p-2">
          <StatusBadge status={trip.status} size="small" onDark={true} />
        </div>
      </div>

      {/* 右側內容 */}
      <div className="flex-1 p-4 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between">
            <h3 className="font-semibold text-neutral-800 line-clamp-1">
              {trip.title}
            </h3>
            <div className="flex items-center gap-2 ml-2">
              {role === 'travelAgency' && onSelectToggle && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectToggle();
                  }}
                  className="text-neutral-400 hover:text-neutral-600"
                >
                  {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                </button>
              )}
              {onBookmarkToggle && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onBookmarkToggle();
                  }}
                  className="text-neutral-400 hover:text-neutral-600"
                >
                  {isBookmarked ? (
                    <BookmarkCheck size={18} className="text-teal-500" />
                  ) : (
                    <Bookmark size={18} />
                  )}
                </button>
              )}
            </div>
          </div>
          <p className="text-sm text-neutral-500 mt-1">
            {flag} {trip.destination} · {formatDateRange(trip.startDate, trip.endDate)}
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <AvatarStack
              users={trip.participants}
              size="xsmall"
              maxVisible={3}
              borderStyle="white"
            />
            <span className="text-sm text-neutral-500">
              {trip.totalParticipants} 人
            </span>
            
            {role === 'travelAgency' && trip.pricePerPerson && (
              <span className="text-sm text-neutral-600 font-medium">
                {formatCurrency(trip.pricePerPerson)}/人
              </span>
            )}
          </div>

          {showProgress && trip.progress !== undefined && (
            <ProgressRing
              value={trip.progress}
              size="xsmall"
              displayMode="percentage"
              animation="onMount"
            />
          )}
        </div>
      </div>
    </article>
  );
};

// ============================================================================
// EXPORTS
// ============================================================================

export default TripCard;
export type { TripCardProps, CardSize, UserRole, Trip } from '../../types';
