export interface Device {
  id: string;
  name: string;
  brand: string;

  emoji: string;
  category: 'Electronics' | 'Appliances' | 'Home & Garden' | 'Other';
  purchasePrice: number;
  purchaseDate: string;
  warrantyExpiry: string;
  warrantyStatus: 'active' | 'expiring' | 'expired';
  daysRemaining: number;
  store: string;
  serialNumber?: string;
}

export const mockDevices: Device[] = [
  {
    id: '1',
    name: 'iPhone 15 Pro',
    brand: 'Apple',

    emoji: '📱',
    category: 'Electronics',
    purchasePrice: 1199,
    purchaseDate: 'Aug 20, 2025',
    warrantyExpiry: 'Aug 20, 2026',
    warrantyStatus: 'active',
    daysRemaining: 365,
    store: 'Apple Store',
    serialNumber: 'F2LW1234567890',
  },
  {
    id: '2',
    name: 'MacBook Pro 16"',
    brand: 'Apple',

    emoji: '💻',
    category: 'Electronics',
    purchasePrice: 2499,
    purchaseDate: 'Jan 15, 2024',
    warrantyExpiry: 'Jan 15, 2025',
    warrantyStatus: 'expiring',
    daysRemaining: 15,
    store: 'Apple Store',
    serialNumber: 'C02Z1234567890',
  },
  {
    id: '3',
    name: 'Apple Watch Series 9',
    brand: 'Apple',

    emoji: '⌚',
    category: 'Electronics',
    purchasePrice: 429,
    purchaseDate: 'Nov 10, 2024',
    warrantyExpiry: 'Nov 10, 2025',
    warrantyStatus: 'active',
    daysRemaining: 295,
    store: 'Best Buy',
    serialNumber: 'HW1234567890',
  },
  {
    id: '4',
    name: 'AirPods Pro',
    brand: 'Apple',

    emoji: '🎧',
    category: 'Electronics',
    purchasePrice: 249,
    purchaseDate: 'Dec 5, 2024',
    warrantyExpiry: 'Dec 5, 2025',
    warrantyStatus: 'active',
    daysRemaining: 320,
    store: 'Amazon',
    serialNumber: 'AP1234567890',
  },
  {
    id: '5',
    name: 'iPad Air',
    brand: 'Apple',

    emoji: '📱',
    category: 'Electronics',
    purchasePrice: 599,
    purchaseDate: 'Mar 1, 2023',
    warrantyExpiry: 'Mar 1, 2024',
    warrantyStatus: 'expired',
    daysRemaining: 0,
    store: 'Apple Store',
    serialNumber: 'IP1234567890',
  },
  {
    id: '6',
    name: 'Samsung TV 65"',
    brand: 'Samsung',

    emoji: '📺',
    category: 'Electronics',
    purchasePrice: 1799,
    purchaseDate: 'Jun 15, 2024',
    warrantyExpiry: 'Jun 15, 2026',
    warrantyStatus: 'active',
    daysRemaining: 540,
    store: 'Best Buy',
    serialNumber: 'TV1234567890',
  },
  {
    id: '7',
    name: 'Dyson V15 Vacuum',
    brand: 'Dyson',

    emoji: '🧹',
    category: 'Appliances',
    purchasePrice: 749,
    purchaseDate: 'Sep 10, 2024',
    warrantyExpiry: 'Sep 10, 2026',
    warrantyStatus: 'active',
    daysRemaining: 630,
    store: 'Dyson Store',
    serialNumber: 'DY1234567890',
  },
  {
    id: '8',
    name: 'KitchenAid Mixer',
    brand: 'KitchenAid',

    emoji: '🍳',
    category: 'Appliances',
    purchasePrice: 399,
    purchaseDate: 'Apr 20, 2024',
    warrantyExpiry: 'Apr 20, 2025',
    warrantyStatus: 'active',
    daysRemaining: 245,
    store: 'Williams Sonoma',
    serialNumber: 'KA1234567890',
  },
  {
    id: '9',
    name: 'Sony WH-1000XM5',
    brand: 'Sony',

    emoji: '🎧',
    category: 'Electronics',
    purchasePrice: 399,
    purchaseDate: 'Feb 14, 2024',
    warrantyExpiry: 'Feb 14, 2025',
    warrantyStatus: 'active',
    daysRemaining: 180,
    store: 'Sony Store',
    serialNumber: 'SN1234567890',
  },
  {
    id: '10',
    name: 'Nintendo Switch OLED',
    brand: 'Nintendo',

    emoji: '🎮',
    category: 'Electronics',
    purchasePrice: 349,
    purchaseDate: 'Dec 25, 2023',
    warrantyExpiry: 'Dec 25, 2024',
    warrantyStatus: 'expiring',
    daysRemaining: 45,
    store: 'GameStop',
    serialNumber: 'NI1234567890',
  },
  {
    id: '11',
    name: 'Instant Pot Duo',
    brand: 'Instant Pot',

    emoji: '🍲',
    category: 'Appliances',
    purchasePrice: 99,
    purchaseDate: 'Jan 5, 2024',
    warrantyExpiry: 'Jan 5, 2025',
    warrantyStatus: 'active',
    daysRemaining: 150,
    store: 'Target',
    serialNumber: 'IP1234567890',
  },
  {
    id: '12',
    name: 'Dell Monitor 27"',
    brand: 'Dell',

    emoji: '🖥️',
    category: 'Electronics',
    purchasePrice: 329,
    purchaseDate: 'May 8, 2024',
    warrantyExpiry: 'May 8, 2027',
    warrantyStatus: 'active',
    daysRemaining: 865,
    store: 'Dell Store',
    serialNumber: 'DL1234567890',
  },
];