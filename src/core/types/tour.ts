import type { ApiError } from './api';

type TourId = string & { readonly __brand: 'TourId' };
type AttractionId = string & { readonly __brand: 'AttractionId' };
type HighlightId = string & { readonly __brand: 'HighlightId' };
type InclusionId = string & { readonly __brand: 'InclusionId' };
type NTAmount = number & { readonly __brand: 'NTAmount' };
type UserId = string & { readonly __brand: 'UserId' };

export enum TourStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ARCHIVED = 'archived'
}

export enum TourType {
  GROUP = 'group',
  FIT = 'fit',
  SEMI_FIT = 'semi-fit',
  INCENTIVE = 'incentive',
  MICE = 'mice'
}

export enum DifficultyLevel {
  EASY = 'easy',
  MODERATE = 'moderate',
  CHALLENGING = 'challenging',
  DIFFICULT = 'difficult'
}

export enum AttractionType {
  SCENIC = 'scenic',
  HISTORIC = 'historic',
  CULTURAL = 'cultural',
  SHOPPING = 'shopping',
  DINING = 'dining',
  ACTIVITY = 'activity'
}

export enum InclusionCategory {
  TRANSPORT = 'transport',
  ACCOMMODATION = 'accommodation',
  MEAL = 'meal',
  TICKET = 'ticket',
  GUIDE = 'guide',
  INSURANCE = 'insurance',
  OTHER = 'other'
}

export interface ServiceResult<T = unknown> {
  data: T | null;
  error: ApiError | null;
}

export interface Attraction {
  id: AttractionId;
  name: string;
  imageUrl: string;
  type: AttractionType;
  durationMinutes: number;
  lat: number;
  lng: number;
  description: string;
  address: string;
}

export interface TourHighlight {
  id: HighlightId;
  title: string;
  description: string;
  imageUrl: string;
}

export interface InclusionItem {
  id: InclusionId;
  category: InclusionCategory;
  description: string;
  isIncluded: boolean;
}

export interface TourDayContent {
  day: number;
  title: string;
  description: string;
  attractions: Attraction[];
  meals: {
    breakfast: string;
    lunch: string;
    dinner: string;
  };
  accommodation: string;
}

export interface Tour {
  id: TourId;
  code: string;
  name: string;
  englishName: string;
  type: TourType;
  status: TourStatus;
  destination: string;
  countries: string[];
  days: number;
  nights: number;
  difficulty: DifficultyLevel;
  description: string;
  shortDescription: string;
  coverImage: string;
  images: string[];
  highlights: TourHighlight[];
  inclusions: InclusionItem[];
  dayContents: TourDayContent[];
  basePrice: NTAmount;
  currency: 'NTD';
  minPax: number;
  maxPax: number;
  tags: string[];
  categories: string[];
  slug: string;
  metaTitle: string;
  metaDescription: string;
  createdAt: string;
  updatedAt: string;
  createdBy: UserId;
}

export interface PublicTourData {
  id: TourId;
  title: string;
  days: number;
  basePrice: NTAmount;
  coverImage: string;
  description: string;
  itineraryJson: {
    points: { time: string; name: string; desc: string; image: string }[];
    hotel: string;
  }[];
  shareToken: string;
}

export interface CreateTourData {
  code: string;
  name: string;
  englishName: string;
  type: TourType;
  destination: string;
  countries: string[];
  days: number;
  nights: number;
  difficulty: DifficultyLevel;
  description: string;
  shortDescription: string;
  coverImage: string;
  images: string[];
  highlights: Omit<TourHighlight, 'id'>[];
  inclusions: Omit<InclusionItem, 'id'>[];
  dayContents: Omit<TourDayContent, 'day'>[];
  basePrice: NTAmount;
  currency: 'NTD';
  minPax: number;
  maxPax: number;
  tags: string[];
  categories: string[];
}

export interface UpdateTourData {
  code: string;
  name: string;
  englishName: string;
  type: TourType;
  status: TourStatus;
  destination: string;
  countries: string[];
  days: number;
  nights: number;
  difficulty: DifficultyLevel;
  description: string;
  shortDescription: string;
  coverImage: string;
  images: string[];
  basePrice: NTAmount;
  currency: 'NTD';
  minPax: number;
  maxPax: number;
  tags: string[];
  categories: string[];
}

export interface TourQuery {
  status: TourStatus | TourStatus[];
  type: TourType | TourType[];
  destination: string;
  countries: string[];
  minDays: number;
  maxDays: number;
  minPrice: number;
  maxPrice: number;
  tags: string[];
  search: string;
  page: number;
  limit: number;
}