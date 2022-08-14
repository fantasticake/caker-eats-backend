import { Order, OrderStatus } from 'src/order/entities/order.entity';
import { Category } from 'src/restaurant/entities/catergory.entitiy';
import { Dish } from 'src/restaurant/entities/dish.entity';
import { Restaurant } from 'src/restaurant/entities/restaurant.entity';
import { Promotion } from 'src/user/entities/promotion.entity';
import { User, UserRole } from 'src/user/entities/user.entity';

export const HASHED_PASSWORD = 'hashed';

export const customerTestData: User = {
  id: 1,
  email: 'test@email.com',
  password: HASHED_PASSWORD,
  role: UserRole.Customer,
  verified: false,
  orders: [],
  driverOrders: [],
  promotions: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const ownerTestData: User = {
  id: 2,
  email: 'test@email.com',
  password: HASHED_PASSWORD,
  role: UserRole.Owner,
  restaurantId: 10,
  verified: false,
  orders: [],
  driverOrders: [],
  promotions: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const driverTestData: User = {
  id: 3,
  email: 'test@email.com',
  password: HASHED_PASSWORD,
  role: UserRole.Driver,
  verified: false,
  orders: [],
  driverOrders: [],
  promotions: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const categoryTestData: Category = {
  id: 5,
  name: 'test category',
  slug: 'test-category',
  imageUrl: 'category.image.url',
  restaurants: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const restaurantTestData: Restaurant = {
  id: 10,
  name: 'test.restaurant',
  owner: ownerTestData,
  ownerId: ownerTestData.id,
  orders: [],
  menu: [],
  category: categoryTestData,
  isPromoted: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const dishTestData = {
  id: 15,
  name: 'test dish',
  price: 10,
  restaurant: restaurantTestData,
  options: [{ name: 'test dish option', extra: 1 }],
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const promotionTestData: Promotion = {
  id: 20,
  transactionId: 30,
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const orderTestData: Order = {
  id: 30,
  dishes: [
    {
      dishId: dishTestData.id,
      count: 1,
      options: [{ name: dishTestData.options[0].name }],
    },
  ],
  restaurant: restaurantTestData,
  location: 'test location',
  customerId: customerTestData.id,
  driverId: null,
  status: OrderStatus.Pending,
  createdAt: new Date(),
  updatedAt: new Date(),
};
