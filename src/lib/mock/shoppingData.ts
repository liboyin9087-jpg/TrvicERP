import { z } from 'zod';

// --- 1. Define Zod Schema for ShoppingLocation (with i18n support and validation) ---
// This schema serves as the single source of truth for the data structure,
// providing both runtime validation and TypeScript type inference.

// Define a schema for internationalized strings.
// This structure allows for storing translations of a field.
const I18nStringSchema = z.object({
  'en-US': z.string().min(1, 'English name is required'),
  'zh-TW': z.string().min(1, 'Traditional Chinese name is required'),
  // Extend with other locales as needed, e.g., 'ja-JP': z.string()
}).strict('Unsupported i18n locale found');

// Define the schema for a ShoppingLocation.
// It includes i18n support for translatable fields and robust validation.
const ShoppingLocationSchema = z.object({
  id: z.string().min(1, 'ID is required'),
  name: I18nStringSchema,
  location: I18nStringSchema,
  category: I18nStringSchema,
  description: I18nStringSchema,
  contact: z.string().min(1, 'Contact is required'), // Original interface implied required.
  hours: I18nStringSchema,
  rating: z.number().min(0).max(5), // Original interface implied required, added range validation.
  tags: z.array(I18nStringSchema).optional(), // Tags are often optional.
}).strict('Unsupported field found in ShoppingLocation'); // Ensures no extra fields are present.

// --- 2. Infer TypeScript Type from Zod Schema ---
// This ensures that the TypeScript type definition is always in sync with the validation schema.
export type ShoppingLocation = z.infer<typeof ShoppingLocationSchema>;

// --- 3. Mock Data Source (hardcoded for this mock file, but rigorously validated) ---
// In a real application, this data would typically be fetched from a database or an external API.
// We explicitly validate the mock data against the schema at the point of definition
// to catch structure issues early.
const MOCK_TAIWAN_SHOPPING_LOCATIONS_RAW = [
  {
    id: '001',
    name: { 'en-US': 'Taipei 101 Shopping Center', 'zh-TW': '台北101購物中心' },
    location: { 'en-US': 'Xinyi District, Taipei City', 'zh-TW': '台北市信義區' },
    category: { 'en-US': 'Department Store', 'zh-TW': '百貨' },
    description: { 'en-US': 'Taipei\'s famous landmark, a high-end shopping mall.', 'zh-TW': '台北著名地標，高級購物中心。' },
    contact: '02-8123-4567',
    hours: { 'en-US': '11:00-22:00', 'zh-TW': '11:00-22:00' },
    rating: 4.8,
    tags: [
      { 'en-US': 'Landmark', 'zh-TW': '地標' },
      { 'en-US': 'Luxury', 'zh-TW': '高級' },
      { 'en-US': 'Food', 'zh-TW': '美食' }
    ]
  },
  {
    id: '002',
    name: { 'en-US': 'Feng Chia Night Market', 'zh-TW': '逢甲夜市' },
    location: { 'en-US': 'Xitun District, Taichung City', 'zh-TW': '台中市西屯區' },
    category: { 'en-US': 'Night Market', 'zh-TW': '夜市' },
    description: { 'en-US': 'One of Taiwan\'s largest night markets, known for snacks and clothing.', 'zh-TW': '台灣最大夜市之一，小吃和服飾。' },
    contact: '04-2291-2345',
    hours: { 'en-US': '17:00-24:00', 'zh-TW': '17:00-24:00' },
    rating: 4.7,
    tags: [
      { 'en-US': 'Night Market', 'zh-TW': '夜市' },
      { 'en-US': 'Snacks', 'zh-TW': '小吃' },
      { 'en-US': 'Clothing', 'zh-TW': '服飾' }
    ]
  },
  {
    id: '003',
    name: { 'en-US': 'Shilin Night Market', 'zh-TW': '士林夜市' },
    location: { 'en-US': 'Shilin District, Taipei City', 'zh-TW': '台北市士林區' },
    category: { 'en-US': 'Night Market', 'zh-TW': '夜市' },
    description: { 'en-US': 'Famous night market in Taipei for food and games.', 'zh-TW': '台北著名夜市，以美食和遊戲聞名。' },
    contact: '02-1234-5678',
    hours: { 'en-US': '17:00-00:00', 'zh-TW': '17:00-00:00' },
    rating: 4.5,
    tags: [
      { 'en-US': 'Night Market', 'zh-TW': '夜市' },
      { 'en-US': 'Food', 'zh-TW': '美食' },
      { 'en-US': 'Games', 'zh-TW': '遊戲' }
    ]
  },
];

// Validate the mock data against the schema to ensure integrity.
const MOCK_TAIWAN_SHOPPING_LOCATIONS: ShoppingLocation[] =
  MOCK_TAIWAN_SHOPPING_LOCATIONS_RAW.map((data, index) => {
    try {
      return ShoppingLocationSchema.parse(data);
    } catch (error) {
      // Log validation errors for immediate feedback during development/testing.
      console.error(`Validation error in mock data at index ${index}:`, error);
      // In a production build, you might want to throw or filter out invalid items.
      throw new Error(`Invalid mock shopping location data at index ${index}: ${error instanceof Error ? error.message : String(error)}`);
    }
  });


// --- 4. Create ShoppingService Class ---
// This class encapsulates data access logic, separating it from the data source itself.
// It also provides robust methods with input validation and i18n support.

/**
 * Interface for the configuration of the ShoppingService.
 * This allows the service to receive its data source and locale preferences.
 */
export interface ShoppingServiceConfig {
  /** The data source for shopping locations. In a real app, this might be an API client or a repository. */
  dataSource: ShoppingLocation[];
  /** The default locale to use for retrieving i18n strings. */
  defaultLocale?: 'en-US' | 'zh-TW'; // Extend as more locales are added to I18nStringSchema
}

export class ShoppingService {
  private shoppingLocations: ShoppingLocation[];
  private currentLocale: 'en-US' | 'zh-TW';

  constructor(config: ShoppingServiceConfig) {
    if (!Array.isArray(config.dataSource)) {
      throw new Error('ShoppingService: dataSource must be an array of ShoppingLocation.');
    }
    this.shoppingLocations = config.dataSource;
    this.currentLocale = config.defaultLocale || 'en-US'; // Default to 'en-US' if not specified.
  }

  /**
   * Helper to safely retrieve the localized string from an i18n object.
   * It prioritizes the current locale, then 'en-US', then the first available locale,
   * to ensure a string is always returned if available.
   */
  private getLocalizedField(field: { [key: string]: string }): string {
    return field[this.currentLocale] || field['en-US'] || Object.values(field)[0] || '';
  }

  /**
   * Retrieves all shopping locations.
   * @returns A Promise resolving to an array of all ShoppingLocation objects.
   */
  public async getShoppingLocations(): Promise<ShoppingLocation[]> {
    // Simulate async operation if this were fetching from an API.
    return Promise.resolve(this.shoppingLocations);
  }

  /**
   * Filters shopping locations by a given category, performing a case-insensitive search.
   * Includes robust handling for empty or invalid category input.
   * @param category The category name to filter by.
   * @returns A Promise resolving to an array of ShoppingLocation objects matching the category.
   */
  public async getShoppingByCategory(category: string | null | undefined): Promise<ShoppingLocation[]> {
    if (!category || typeof category !== 'string' || category.trim() === '') {
      console.warn('getShoppingByCategory received an empty or invalid category. Returning all locations.');
      // Depending on requirements, could return an empty array [] or all locations.
      return this.getShoppingLocations();
    }

    const searchCategory = category.trim().toLowerCase();
    return Promise.resolve(
      this.shoppingLocations.filter(location =>
        this.getLocalizedField(location.category).toLowerCase().includes(searchCategory)
      )
    );
  }

  /**
   * Filters shopping locations by a given location string (e.g., city, district), case-insensitive.
   * Includes robust handling for empty or invalid location input.
   * @param searchLocation The location string to filter by.
   * @returns A Promise resolving to an array of ShoppingLocation objects matching the location.
   */
  public async getShoppingByLocation(searchLocation: string | null | undefined): Promise<ShoppingLocation[]> {
    if (!searchLocation || typeof searchLocation !== 'string' || searchLocation.trim() === '') {
      console.warn('getShoppingByLocation received an empty or invalid location. Returning all locations.');
      // Depending on requirements, could return an empty array [] or all locations.
      return this.getShoppingLocations();
    }

    const trimmedSearchLocation = searchLocation.trim().toLowerCase();
    return Promise.resolve(
      this.shoppingLocations.filter(location =>
        this.getLocalizedField(location.location).toLowerCase().includes(trimmedSearchLocation)
      )
    );
  }

  /**
   * Retrieves a specific shopping location by its unique ID.
   * @param id The ID of the shopping location.
   * @returns A Promise resolving to the ShoppingLocation object if found, otherwise `undefined`.
   */
  public async getShoppingLocationById(id: string | null | undefined): Promise<ShoppingLocation | undefined> {
    if (!id || typeof id !== 'string' || id.trim() === '') {
      console.warn('getShoppingLocationById received an empty or invalid ID.');
      return Promise.resolve(undefined);
    }
    return Promise.resolve(this.shoppingLocations.find(location => location.id === id));
  }

  /**
   * Sets the current locale for the service. This affects which translation is returned by `getLocalizedField`.
   * @param locale The new locale to use ('en-US' | 'zh-TW').
   */
  public setLocale(locale: 'en-US' | 'zh-TW'): void {
    if (['en-US', 'zh-TW'].includes(locale)) {
      this.currentLocale = locale;
    } else {
      console.warn(`Unsupported locale: ${locale}. Keeping current locale: ${this.currentLocale}`);
    }
  }

  /**
   * Gets the current locale of the service.
   * @returns The current locale string.
   */
  public getLocale(): 'en-US' | 'zh-TW' {
    return this.currentLocale;
  }
}

// --- Export an instance of the service configured with mock data ---
// This is the primary export from this mock data file, making the service
// readily available for use in other modules.
export const shoppingService = new ShoppingService({
  dataSource: MOCK_TAIWAN_SHOPPING_LOCATIONS,
  defaultLocale: 'zh-TW', // Example: default to Traditional Chinese for the service instance.
});

// Note: For integration with a React component (Widget), the component would receive
// a `ShoppingServiceConfig` or the `shoppingService` instance directly via props,
// rather than importing `useAppStore` or relying on global state.
// This allows the component to be independent and configurable.