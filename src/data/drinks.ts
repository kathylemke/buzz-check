export type DrinkCategory = 'protein_shake' | 'energy_drink' | 'coffee' | 'pre_workout' | 'protein_powder' | 'other';

export type DrinkProduct = {
  name: string;
  flavors: string[];
};

export type DrinkBrand = {
  name: string;
  category: DrinkCategory;
  products: DrinkProduct[];
  icon?: string;
};

export const DRINK_CATEGORIES: { key: DrinkCategory; label: string; emoji: string }[] = [
  { key: 'protein_shake', label: 'Protein', emoji: '💪' },
  { key: 'energy_drink', label: 'Energy', emoji: '⚡' },
  { key: 'coffee', label: 'Coffee', emoji: '☕' },
  { key: 'pre_workout', label: 'Pre-Workout', emoji: '🔥' },
  { key: 'protein_powder', label: 'Protein Powder', emoji: '🥛' },
  { key: 'other', label: 'Other', emoji: '🥤' },
];

export const DRINK_BRANDS: DrinkBrand[] = [
  // ── Protein Shakes ──
  {
    name: 'Fairlife', category: 'protein_shake', products: [
      { name: 'Core Power Protein Shake', flavors: ['Chocolate', 'Vanilla', 'Strawberry', 'Strawberry Banana', 'Banana'] },
      { name: 'Core Power Elite', flavors: ['Chocolate', 'Vanilla', 'Strawberry', 'Chocolate Peanut Butter'] },
      { name: 'Core Power Light', flavors: ['Chocolate', 'Vanilla', 'Salted Caramel'] },
    ],
  },
  {
    name: 'Muscle Milk', category: 'protein_shake', products: [
      { name: 'Genuine', flavors: ['Chocolate', 'Vanilla', 'Strawberry Banana', 'Cookies N Cream', 'Banana Cream'] },
      { name: 'Pro Series', flavors: ['Knockout Chocolate', 'Intense Vanilla', 'Cookies N Cream', 'Banana'] },
      { name: 'Smoothie', flavors: ['Strawberry Banana', 'Peach Mango', 'Blueberry'] },
      { name: 'Coffee House', flavors: ['Café Latte', 'Mocha Latte', 'Vanilla Latte'] },
    ],
  },
  {
    name: 'Orgain', category: 'protein_shake', products: [
      { name: 'Organic Protein Shake', flavors: ['Creamy Chocolate Fudge', 'Vanilla Bean', 'Strawberries & Cream', 'Peanut Butter'] },
      { name: 'Organic Protein + Superfoods', flavors: ['Iced Café Mocha', 'Chocolate Coconut', 'Vanilla Bean'] },
      { name: 'Sport Protein Shake', flavors: ['Chocolate', 'Vanilla'] },
    ],
  },
  {
    name: 'Ensure', category: 'protein_shake', products: [
      { name: 'Ensure Original', flavors: ['Milk Chocolate', 'Vanilla', 'Strawberry', 'Dark Chocolate', 'Butter Pecan', 'Banana Nut'] },
      { name: 'Ensure Max Protein', flavors: ['Milk Chocolate', 'French Vanilla', 'Café Mocha', 'Creamy Peach'] },
      { name: 'Ensure Plus', flavors: ['Milk Chocolate', 'Vanilla', 'Strawberry', 'Dark Chocolate', 'Butter Pecan'] },
    ],
  },
  {
    name: 'Premier Protein', category: 'protein_shake', products: [
      { name: 'Premier Protein Shake', flavors: ['Chocolate', 'Vanilla', 'Caramel', 'Café Latte', 'Cookies & Cream', 'Strawberries & Cream', 'Bananas & Cream', 'Peaches & Cream'] },
      { name: 'Premier Protein Clear', flavors: ['Tropical Punch', 'Raspberry', 'Lemon'] },
      { name: 'Premier Protein Powder', flavors: ['Chocolate Milkshake', 'Vanilla Milkshake', 'Café Latte'] },
    ],
  },
  {
    name: 'Gatorade Protein', category: 'protein_shake', products: [
      { name: 'Gatorade Protein Shake', flavors: ['Chocolate', 'Vanilla', 'Chocolate Peanut Butter', 'Cookies & Cream', 'Chocolate Caramel'] },
      { name: 'Gatorade Super Shake', flavors: ['Chocolate', 'Vanilla', 'Strawberry'] },
    ],
  },
  {
    name: 'Owyn', category: 'protein_shake', products: [
      { name: 'Owyn Protein Shake', flavors: ['Dark Chocolate', 'Vanilla', 'Strawberry Banana', 'Cookies & Cream', 'Chai'] },
      { name: 'Owyn Pro Elite', flavors: ['Chocolate', 'Vanilla', 'Cold Brew Coffee'] },
    ],
  },
  {
    name: 'Ghost', category: 'protein_shake', products: [
      { name: 'Ghost Whey', flavors: ['Cereal Milk', 'Peanut Butter Cereal Milk', 'Coffee Ice Cream', 'Chocolate Cereal Milk', 'Chips Ahoy', 'Nutter Butter'] },
      { name: 'Ghost Vegan', flavors: ['Peanut Butter Cereal Milk', 'Chocolate Cereal Milk', 'Banana Pancake Batter'] },
    ],
  },
  {
    name: 'Dymatize', category: 'protein_shake', products: [
      { name: 'ISO100', flavors: ['Gourmet Chocolate', 'Gourmet Vanilla', 'Cookies & Cream', 'Fruity Pebbles', 'Cocoa Pebbles', 'Strawberry'] },
      { name: 'Elite 100% Whey', flavors: ['Rich Chocolate', 'Vanilla', 'Cookies & Cream'] },
    ],
  },

  // ── Energy Drinks ──
  {
    name: 'Monster', category: 'energy_drink', products: [
      { name: 'Original', flavors: ['Original', 'Lo-Carb', 'Assault', 'Import'] },
      { name: 'Ultra', flavors: ['Ultra White', 'Ultra Rosa', 'Ultra Sunrise', 'Ultra Blue', 'Ultra Paradise', 'Ultra Gold', 'Ultra Violet', 'Ultra Watermelon', 'Ultra Peachy Keen'] },
      { name: 'Java Monster', flavors: ['Mean Bean', 'Loca Moca', 'Salted Caramel', 'Swiss Chocolate', 'Kona Blend', 'Irish Blend'] },
      { name: 'Juice Monster', flavors: ['Mango Loco', 'Pipeline Punch', 'Pacific Punch', 'Papillon', 'Aussie Lemonade'] },
      { name: 'Rehab', flavors: ['Tea + Lemonade', 'Peach Tea', 'Raspberry Tea', 'Watermelon', 'Strawberry Lemonade'] },
      { name: 'Reserve', flavors: ['White Pineapple', 'Watermelon', 'Orange Dreamsicle', 'Kiwi Strawberry'] },
    ],
  },
  {
    name: 'Red Bull', category: 'energy_drink', products: [
      { name: 'Original', flavors: ['Original'] },
      { name: 'Sugar Free', flavors: ['Sugar Free'] },
      { name: 'Total Zero', flavors: ['Total Zero'] },
      { name: 'Editions', flavors: ['Tropical', 'Watermelon', 'Blueberry', 'Peach-Nectarine', 'Coconut Berry', 'Strawberry Apricot', 'Amber', 'Juneberry', 'Curuba Elderflower'] },
    ],
  },
  {
    name: 'Celsius', category: 'energy_drink', products: [
      { name: 'Celsius Original', flavors: ['Sparkling Orange', 'Sparkling Wild Berry', 'Sparkling Watermelon', 'Sparkling Kiwi Guava', 'Sparkling Grape Rush', 'Peach Mango Green Tea', 'Raspberry Açaí Green Tea'] },
      { name: 'Celsius Vibe', flavors: ['Cosmic Vibe', 'Fantasy Vibe', 'Arctic Vibe', 'Tropical Vibe', 'Peach Vibe'] },
      { name: 'Celsius Essentials', flavors: ['Sparkling Orange', 'Cherry Limeade', 'Blue Crush', 'Tropical Blast', 'Strawberry Lemonade'] },
      { name: 'Celsius On-The-Go', flavors: ['Orange', 'Kiwi Guava', 'Berry', 'Dragonfruit Lime', 'Cranberry Lemon'] },
    ],
  },
  {
    name: 'Ghost Energy', category: 'energy_drink', products: [
      { name: 'Ghost Energy', flavors: ['Sour Patch Kids Blue Raspberry', 'Warheads Sour Watermelon', 'Swedish Fish', 'Orange Cream', 'Citrus', 'Tropical Mango', 'Welch\'s Grape'] },
    ],
  },
  {
    name: 'Reign', category: 'energy_drink', products: [
      { name: 'Reign Total Body Fuel', flavors: ['Melon Mania', 'Orange Dreamsicle', 'Razzle Berry', 'Lemon HDZ', 'Peach Fizz', 'White Gummy Bear', 'Mang-O-Matic'] },
      { name: 'Reign Storm', flavors: ['Harvest Grape', 'Peach Nectarine', 'Valencia Orange', 'Kiwi Blend'] },
    ],
  },
  {
    name: 'Bang', category: 'energy_drink', products: [
      { name: 'Bang Energy', flavors: ['Rainbow Unicorn', 'Star Blast', 'Cotton Candy', 'Purple Haze', 'Sour Heads', 'Blue Razz', 'Peach Mango'] },
    ],
  },
  {
    name: 'C4', category: 'energy_drink', products: [
      { name: 'C4 Original Energy', flavors: ['Frozen Bombsicle', 'Midnight Cherry', 'Strawberry Watermelon', 'Cotton Candy', 'Purple Frost', 'Orange Slice', 'Tropical Blast'] },
      { name: 'C4 Smart Energy', flavors: ['Cotton Candy', 'Black Cherry', 'Peach Mango Nectar', 'Freedom Ice', 'Watermelon Burst'] },
    ],
  },
  {
    name: 'Alani Nu', category: 'energy_drink', products: [
      { name: 'Alani Nu Energy', flavors: ['Cosmic Stardust', 'Cherry Slush', 'Trippy Hippie', 'Hawaiian Shaved Ice', 'Mimosa', 'Watermelon Wave', 'Breezeberry', 'Arctic White'] },
      { name: 'Alani Nu Fit Shake', flavors: ['Chocolate', 'Vanilla', 'Cookies & Cream', 'Fruity Cereal'] },
      { name: 'Alani Nu Balance', flavors: ['Watermelon', 'Cotton Candy Grape', 'Berry'] },
    ],
  },
  {
    name: 'ZOA', category: 'energy_drink', products: [
      { name: 'ZOA Original', flavors: ['Original', 'Wild Orange', 'Lemon Lime', 'Pineapple Coconut', 'Super Berry', 'Tropical Punch'] },
      { name: 'ZOA Zero Sugar', flavors: ['Wild Orange', 'Cherry Limeade', 'Frosted Grape', 'Tropical Punch'] },
    ],
  },
  {
    name: 'Prime Energy', category: 'energy_drink', products: [
      { name: 'Prime Energy', flavors: ['Blue Raspberry', 'Tropical Punch', 'Strawberry Watermelon', 'Lemon Lime', 'Orange Mango', 'Ice Pop'] },
      { name: 'Prime Hydration', flavors: ['Lemon Lime', 'Tropical Punch', 'Blue Raspberry', 'Meta Moon', 'Ice Pop', 'Grape', 'Strawberry Watermelon'] },
    ],
  },
  {
    name: '3D Energy', category: 'energy_drink', products: [
      { name: '3D Energy', flavors: ['Red White & Blue', 'Sunburst Orange', 'Berry Blue', 'Gold', 'Green', 'Chrome', 'Liberty Pop'] },
    ],
  },

  // ── Coffee ──
  {
    name: 'Starbucks', category: 'coffee', products: [
      { name: 'Hot Coffee', flavors: ['Pike Place', 'Blonde Roast', 'Dark Roast', 'Caffè Mocha', 'Caramel Macchiato', 'Pumpkin Spice Latte', 'Vanilla Latte', 'Flat White'] },
      { name: 'Iced', flavors: ['Iced Coffee', 'Iced Latte', 'Iced Caramel Macchiato', 'Iced Matcha Latte', 'Iced Brown Sugar Oatmilk Shaken Espresso'] },
      { name: 'Frappuccino Bottled', flavors: ['Mocha', 'Vanilla', 'Caramel', 'Coffee'] },
      { name: 'Doubleshot', flavors: ['Espresso', 'Espresso & Cream', 'Vanilla', 'Mocha', 'White Chocolate'] },
      { name: 'Refreshers', flavors: ['Strawberry Açaí', 'Mango Dragonfruit', 'Pink Drink', 'Paradise Drink'] },
    ],
  },
  {
    name: 'Dunkin', category: 'coffee', products: [
      { name: 'Hot Coffee', flavors: ['Original Blend', 'French Vanilla', 'Caramel', 'Mocha', 'Hazelnut'] },
      { name: 'Iced / Cold Brew', flavors: ['Iced Coffee', 'Cold Brew', 'Iced Latte', 'Iced Chai'] },
      { name: 'Refreshers', flavors: ['Strawberry Dragonfruit', 'Peach Passion Fruit', 'Mango Pineapple'] },
    ],
  },
  {
    name: 'Dutch Bros', category: 'coffee', products: [
      { name: 'Breve / Latte', flavors: ['911', 'Caramelizer', 'Annihilator', 'Golden Eagle', 'Kicker', 'White Chocolate Mocha'] },
      { name: 'Freeze (Blended)', flavors: ['Double Rainbro', 'Palm Beach', 'Cotton Candy', 'OG Gummy Bear'] },
      { name: 'Rebel Energy', flavors: ['Electric Berry', 'Peach', 'Blue Raspberry', 'Strawberry'] },
    ],
  },
  {
    name: 'Peet\'s', category: 'coffee', products: [
      { name: 'Drip / Brewed', flavors: ['Major Dickason\'s Blend', 'Big Bang', 'French Roast', 'House Blend', 'Café Domingo'] },
      { name: 'Espresso Drinks', flavors: ['Latte', 'Cappuccino', 'Mocha', 'Iced Espresso', 'Caramel Macchiato'] },
    ],
  },
  {
    name: 'La Colombe', category: 'coffee', products: [
      { name: 'Draft Latte', flavors: ['Original', 'Triple Shot', 'Oatmilk', 'Mocha', 'Vanilla', 'Caramel'] },
      { name: 'Cold Brew', flavors: ['Cold Brew', 'Cold Brew Medium Roast'] },
    ],
  },
  {
    name: 'Blue Bottle', category: 'coffee', products: [
      { name: 'Drip / Pour Over', flavors: ['Hayes Valley Espresso', 'Three Africas', 'Bella Donovan', 'Giant Steps', 'Single Origin'] },
      { name: 'Canned', flavors: ['New Orleans Iced', 'Bright Field Blend', 'Single Origin Cold Brew'] },
    ],
  },
  {
    name: 'Philz', category: 'coffee', products: [
      { name: 'Philz Blends', flavors: ['Tesora', 'Mint Mojito', 'Ether', 'Silken Splendor', 'Tantalizing Turkish', 'Dancing Water', 'Philharmonic'] },
    ],
  },
  {
    name: 'Homemade / Local', category: 'coffee', products: [
      { name: 'Brewed', flavors: ['Drip Coffee', 'Pour Over', 'French Press', 'Cold Brew', 'Other'] },
      { name: 'Espresso', flavors: ['Espresso', 'Latte', 'Cappuccino', 'Americano', 'Flat White', 'Mocha'] },
    ],
  },

  // ── Pre-Workout ──
  {
    name: 'C4 Pre-Workout', category: 'pre_workout', products: [
      { name: 'C4 Original', flavors: ['Cherry Limeade', 'Fruit Punch', 'Watermelon', 'Icy Blue Razz', 'Strawberry Margarita', 'Orange Burst', 'Pink Lemonade'] },
      { name: 'C4 Ultimate', flavors: ['Sour Batch Bros', 'Strawberry Watermelon', 'Icy Blue Razz', 'Orange Mango'] },
    ],
  },
  {
    name: 'Ghost Legend', category: 'pre_workout', products: [
      { name: 'Ghost Legend', flavors: ['Sour Patch Kids Redberry', 'Warheads Sour Watermelon', 'Welch\'s Grape', 'Swedish Fish', 'Blue Raspberry', 'Sonic Cherry Limeade'] },
      { name: 'Ghost Legend V2', flavors: ['Sour Patch Kids Blue Raspberry', 'Warheads Sour Green Apple', 'Welch\'s Grape'] },
    ],
  },
  {
    name: 'Bucked Up', category: 'pre_workout', products: [
      { name: 'Bucked Up', flavors: ['Blue Raz', 'Watermelon', 'Blood Raz', 'Rocket Pop', 'Gym N Juice', 'Miami', 'Strawberry Kiwi'] },
      { name: 'Woke AF', flavors: ['Blue Raz', 'Rocket Pop', 'Blood Raz', 'Miami', 'Grape Gainz'] },
    ],
  },
  {
    name: 'Gorilla Mode', category: 'pre_workout', products: [
      { name: 'Gorilla Mode', flavors: ['Cherry Blackout', 'Mojo Mojito', 'Volcano Burst', 'Jungle Juice', 'Tiger\'s Blood', 'Fruit Punch', 'Lemon Lime'] },
      { name: 'Gorilla Mode Nitric', flavors: ['Cherry Blackout', 'Jungle Juice', 'Tiger\'s Blood', 'Bombsicle'] },
    ],
  },
  {
    name: 'Ryse', category: 'pre_workout', products: [
      { name: 'Ryse Godzilla', flavors: ['Sunny D', 'Ring Pop Berry', 'Kool-Aid Tropical Punch', 'Tiger\'s Blood', 'Baja Burst', 'Freedom Rocks'] },
      { name: 'Ryse Loaded', flavors: ['Smarties', 'Tiger\'s Blood', 'Freedom Rocks'] },
    ],
  },
  {
    name: 'Beyond Raw', category: 'pre_workout', products: [
      { name: 'LIT', flavors: ['Fruit Punch', 'Blue Lemonade', 'Gummy Worm', 'Icy Rocket', 'Sour Gummy Worm', 'Watermelon Lemonade'] },
      { name: 'LIT AF', flavors: ['Icy Fireworks', 'Gummy Worm', 'Sweet & Tart'] },
    ],
  },
  // ── Protein Powder ──
  {
    name: 'Optimum Nutrition', category: 'protein_powder', products: [
      { name: 'Gold Standard 100% Whey', flavors: ['Double Rich Chocolate', 'Vanilla Ice Cream', 'Extreme Milk Chocolate', 'Strawberry Banana', 'Mocha Cappuccino', 'Banana Cream', 'Cookies & Cream', 'Delicious Strawberry', 'Chocolate Peanut Butter', 'French Vanilla', 'White Chocolate', 'Chocolate Malt', 'Chocolate Mint', 'Coffee', 'Rocky Road', 'Salted Caramel'] },
      { name: 'Gold Standard Casein', flavors: ['Chocolate Supreme', 'Creamy Vanilla', 'Strawberry Smoothie', 'Chocolate Peanut Butter'] },
      { name: 'Gold Standard Plant', flavors: ['Chocolate', 'Vanilla', 'Berry'] },
    ],
  },
  {
    name: 'Dymatize', category: 'protein_powder', products: [
      { name: 'ISO100', flavors: ['Gourmet Chocolate', 'Fudge Brownie', 'Vanilla', 'Strawberry', 'Cookies & Cream', 'Peanut Butter', 'Birthday Cake', 'Chocolate Peanut Butter', 'Dunks Cinnamon Cereal', 'Fruity Pebbles', 'Cocoa Pebbles'] },
      { name: 'Elite 100% Whey', flavors: ['Rich Chocolate', 'Vanilla Cupcake', 'Cookies & Cream'] },
    ],
  },
  {
    name: 'Ghost', category: 'protein_powder', products: [
      { name: 'Ghost Whey', flavors: ['Chips Ahoy!', 'Nutter Butter', 'Oreo', 'Cereal Milk', 'Peanut Butter Cereal Milk', 'Coffee Ice Cream', 'Fruity Cereal Milk', 'Chocolate Chip Cookie', 'Marshmallow Cereal Milk'] },
      { name: 'Ghost Vegan', flavors: ['Peanut Butter Cereal Milk', 'Chocolate Cereal Milk', 'Banana Pancake Batter'] },
    ],
  },
  {
    name: 'Transparent Labs', category: 'protein_powder', products: [
      { name: '100% Grass-Fed Whey', flavors: ['Chocolate Peanut Butter', 'Mocha', 'Vanilla Peanut Butter', 'Cinnamon French Toast', 'Milk Chocolate', 'French Vanilla', 'Strawberry'] },
      { name: 'Casein', flavors: ['Chocolate', 'Vanilla'] },
      { name: 'Plant Protein', flavors: ['Chocolate', 'Vanilla', 'Strawberry'] },
    ],
  },
  {
    name: 'Muscle Milk', category: 'protein_powder', products: [
      { name: 'Genuine Protein Powder', flavors: ['Chocolate', 'Vanilla Creme', 'Strawberry', 'Cookies N Cream', 'Banana Cream'] },
      { name: '100% Whey', flavors: ['Chocolate', 'Vanilla'] },
    ],
  },
  {
    name: 'MyProtein', category: 'protein_powder', products: [
      { name: 'Impact Whey Protein', flavors: ['Chocolate Smooth', 'Vanilla', 'Strawberry Cream', 'Natural Chocolate', 'Cookies & Cream', 'Mocha', 'Salted Caramel', 'Chocolate Brownie', 'Blueberry', 'Banana', 'Unflavored'] },
      { name: 'Impact Whey Isolate', flavors: ['Chocolate Smooth', 'Vanilla', 'Strawberry Cream', 'Salted Caramel', 'Natural Chocolate'] },
      { name: 'Clear Whey Isolate', flavors: ['Peach Tea', 'Lemonade', 'Orange Mango', 'Bitter Lemon', 'Mojito', 'Rainbow Candy'] },
    ],
  },
  {
    name: 'Orgain', category: 'protein_powder', products: [
      { name: 'Organic Protein', flavors: ['Chocolate Fudge', 'Vanilla Bean', 'Peanut Butter', 'Creamy Chocolate Fudge', 'Natural Unsweetened'] },
      { name: 'Sport Protein', flavors: ['Chocolate', 'Vanilla'] },
    ],
  },
  {
    name: 'Naked Nutrition', category: 'protein_powder', products: [
      { name: 'Naked Whey', flavors: ['Unflavored', 'Chocolate', 'Vanilla', 'Strawberry'] },
      { name: 'Naked Casein', flavors: ['Unflavored', 'Chocolate'] },
      { name: 'Naked Pea', flavors: ['Unflavored', 'Chocolate'] },
    ],
  },
  {
    name: 'Garden of Life', category: 'protein_powder', products: [
      { name: 'Organic Plant Protein', flavors: ['Chocolate', 'Vanilla', 'Vanilla Chai', 'Unflavored'] },
      { name: 'Sport Plant Protein', flavors: ['Chocolate', 'Vanilla'] },
    ],
  },
  {
    name: 'Premier Protein', category: 'protein_powder', products: [
      { name: 'Protein Powder', flavors: ['Chocolate Milkshake', 'Vanilla Milkshake', 'Cafe Latte'] },
    ],
  },
  {
    name: 'Isopure', category: 'protein_powder', products: [
      { name: 'Zero Carb Protein', flavors: ['Creamy Vanilla', 'Dutch Chocolate', 'Cookies & Cream', 'Strawberries & Cream', 'Banana Cream', 'Unflavored'] },
      { name: 'Infusions', flavors: ['Tropical Punch', 'Mixed Berry', 'Mango Lime', 'Citrus Lemonade'] },
    ],
  },
];

export function getBrandsByCategory(category: DrinkCategory): DrinkBrand[] {
  return DRINK_BRANDS.filter((b) => b.category === category);
}

export function getBrandProducts(brandName: string): DrinkProduct[] {
  return DRINK_BRANDS.find((b) => b.name === brandName)?.products ?? [];
}

export function getProductFlavors(brandName: string, productName: string): string[] {
  const brand = DRINK_BRANDS.find((b) => b.name === brandName);
  return brand?.products.find((p) => p.name === productName)?.flavors ?? [];
}
