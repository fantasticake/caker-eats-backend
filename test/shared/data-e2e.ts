import { UserRole } from 'src/user/entities/user.entity';

export const adminE2E = {
  email: 'admin@email.com',
  password: '1234',
  role: UserRole.Admin,
};

export const customerE2E = {
  email: 'test@email.com',
  password: '1234',
  role: UserRole.Customer,
};

export const categoryE2E = {
  name: 'test category',
  slug: 'test-category',
  imageUrl: 'image url',
};
