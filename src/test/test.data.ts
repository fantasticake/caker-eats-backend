import { UserRole } from 'src/user/entities/user.entity';

export const HASHED_PASSWORD = 'hashed';

export const customer = {
  id: 1,
  email: 'test@email.com',
  password: HASHED_PASSWORD,
  role: UserRole.Customer,
  restaurantId: 10,
  verified: false,
  orders: [],
  driverOrders: [],
  promotions: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};
