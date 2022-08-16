import { UserRole } from 'src/user/entities/user.entity';

export const adminE2E = {
  email: 'admin@email.com',
  password: '1234',
  role: UserRole.Admin,
};

export const customerE2E = {
  email: 'customer@email.com',
  password: '1234',
  role: UserRole.Customer,
};

export const ownerE2E = {
  email: 'owner@email.com',
  password: '1234',
  role: UserRole.Owner,
};

export const owner2E2E = {
  email: 'owner2@email.com',
  password: '1234',
  role: UserRole.Owner,
};

export const categoryE2E = {
  name: 'test category',
  slug: 'test-category',
  imageUrl: 'image url',
};

export const restaurantE2E = {
  name: 'test restaurant',
  categorySlug: categoryE2E.slug,
};

export const editedRestaurantE2E = {
  name: 'edited restaurant',
  categorySlug: categoryE2E.slug,
};

export const dishE2E = {
  name: 'test dish',
  price: 5,
};

export const editedDishE2E = {
  name: 'edited dish',
  price: 5,
};
