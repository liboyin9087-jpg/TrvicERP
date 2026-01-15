interface ShoppingLocation {
  id: string;
  name: string;
  location: string;
  category: string;
  description: string;
  contact: string;
  hours: string;
  rating: number;
  tags: string[];
}

export const TAIWAN_SHOPPING_LOCATIONS: ShoppingLocation[] = [
  {
    id: '001',
    name: '台北101購物中心',
    location: '台北市信義區',
    category: '百貨',
    description: '台北著名地標，高級購物中心',
    contact: '02-8123-4567',
    hours: '11:00-22:00',
    rating: 4.8,
    tags: ['地標', '高級', '美食']
  },
  {
    id: '002',
    name: '逢甲夜市',
    location: '台中市西屯區',
    category: '夜市',
    description: '台灣最大夜市之一，小吃和服飾',
    contact: '04-2291-2345',
    hours: '17:00-24:00',
    rating: 4.7,
    tags: ['夜市', '小吃', '服飾']
  },
  // 更多購物地點...
];

export const getShoppingByCategory = (category: string): ShoppingLocation[] => {
  return TAIWAN_SHOPPING_LOCATIONS.filter(location => 
    location.category.toLowerCase().includes(category.toLowerCase())
  );
};

export const getShoppingByLocation = (location: string): ShoppingLocation[] => {
  return TAIWAN_SHOPPING_LOCATIONS.filter(loc => 
    loc.location.toLowerCase().includes(location.toLowerCase())
  );
};
