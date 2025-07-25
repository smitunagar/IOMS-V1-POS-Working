// menuService.ts

export interface IngredientQuantity {
  inventoryItemName: string;
  quantityPerDish: number;
  unit: string;
}

export interface Dish {
  id: string;
  name: string;
  price: number;
  category: string;
  image: string;
  aiHint: string;
  ingredients: IngredientQuantity[] | string[]; // For legacy or parsed dishes
}

const MENU_STORAGE_KEY_BASE = 'restaurantMenu';

function generateDishId(): string {
  return `dish_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function getUserMenuStorageKey(userId: string): string {
  return `${MENU_STORAGE_KEY_BASE}_${userId}`;
}

// Default menu data when backend is not available
const DEFAULT_MENU_DATA: Dish[] = [
  {
    id: 'M001',
    name: 'Margherita Pizza',
    price: 12.99,
    category: 'Pizza',
    image: "https://placehold.co/100x100.png",
    aiHint: 'margherita pizza',
    ingredients: ['flour', 'tomato_sauce', 'mozzarella', 'basil']
  },
  {
    id: 'M002',
    name: 'Chicken Biryani',
    price: 15.99,
    category: 'Main Course',
    image: "https://placehold.co/100x100.png",
    aiHint: 'chicken biryani',
    ingredients: ['basmati_rice', 'chicken', 'spices', 'yogurt']
  },
  {
    id: 'M003',
    name: 'Caesar Salad',
    price: 8.99,
    category: 'Salad',
    image: "https://placehold.co/100x100.png",
    aiHint: 'caesar salad',
    ingredients: ['romaine_lettuce', 'caesar_dressing', 'croutons', 'parmesan']
  },
  {
    id: 'M004',
    name: 'Chocolate Lava Cake',
    price: 6.99,
    category: 'Dessert',
    image: "https://placehold.co/100x100.png",
    aiHint: 'chocolate cake',
    ingredients: ['chocolate', 'flour', 'eggs', 'butter']
  }
];

export async function getDishes(userId: string | null): Promise<Dish[]> {
  try {
    // First try to fetch from backend API
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
    const response = await fetch(`${backendUrl}/api/menu`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (response.ok) {
      const backendMenu = await response.json();
      // Transform backend data to frontend format
      const transformedMenu: Dish[] = backendMenu.map((item: any) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        category: item.category,
        image: "https://placehold.co/100x100.png", // Default image
        aiHint: item.name.toLowerCase().split(' ').slice(0, 2).join(' '),
        ingredients: item.ingredients || []
      }));
      console.log('✅ Menu loaded from backend API:', transformedMenu.length, 'items');
      return transformedMenu;
    }
  } catch (error) {
    console.warn('Backend API not available, using fallback data:', error);
  }

  // Fallback to localStorage if backend is not available
  if (typeof window !== 'undefined' && userId) {
    try {
      const menuStorageKey = getUserMenuStorageKey(userId);
      const storedMenu = localStorage.getItem(menuStorageKey);
      if (storedMenu) {
        const parsedMenu = JSON.parse(storedMenu) as Dish[];
        if (parsedMenu.length > 0) {
          console.log('📱 Menu loaded from localStorage:', parsedMenu.length, 'items');
          return parsedMenu;
        }
      }
    } catch (e) {
      console.error('Error reading menu from localStorage:', e);
    }
  }

  // Final fallback: return default menu data
  console.log('🔄 Using default menu data:', DEFAULT_MENU_DATA.length, 'items');
  return DEFAULT_MENU_DATA;
}

export function saveDishes(userId: string | null, dishes: Dish[]): void {
  if (typeof window === 'undefined' || !userId) return;
  try {
    const menuStorageKey = getUserMenuStorageKey(userId);
    localStorage.setItem(menuStorageKey, JSON.stringify(dishes));
  } catch (e) {
    console.error('Error saving menu:', e);
  }
}

export function addDishToMenu(userId: string | null, dishName: string, aiIngredients: any): Dish | null {
  if (typeof window === 'undefined' || !userId) return null;
  const currentDishes = getDishes(userId);

  // Defensive: Ingredients as IngredientQuantity[] or string[]
  let transformedIngredients: IngredientQuantity[] | string[];
  if (Array.isArray(aiIngredients) && typeof aiIngredients[0] === 'object') {
    transformedIngredients = aiIngredients as IngredientQuantity[];
  } else if (Array.isArray(aiIngredients)) {
    transformedIngredients = aiIngredients.map(name => ({
      inventoryItemName: name,
      quantityPerDish: 1,
      unit: '',
    }));
  } else {
    transformedIngredients = [];
  }

  const newDish: Dish = {
    id: generateDishId(),
    name: dishName,
    price: 10.00,
    category: "New Dishes",
    image: "https://placehold.co/100x100.png",
    aiHint: dishName.toLowerCase().split(' ').slice(0, 2).join(' '),
    ingredients: transformedIngredients,
  };

  const updatedDishes = [...currentDishes, newDish];
  saveDishes(userId, updatedDishes);
  return newDish;
}
