import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PubSub } from 'graphql-subscriptions';
import { Restaurant } from 'src/restaurant/entities/restaurant.entity';
import { PUBSUB_TOKEN } from 'src/shared/shared.constants';
import { Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { OrderService } from './order.service';

const getMockedRepo = () => ({
  save: jest.fn(),
  create: jest.fn(),
  findBy: jest.fn(),
  findOneBy: jest.fn(),
  findOne: jest.fn(),
});

const getMockedPubSub = () => ({
  publish: jest.fn(),
});

describe('OrderService', () => {
  let orderService: OrderService;
  let ordersRepo: Record<keyof Repository<Order>, jest.Mock>;
  let restaurantsRepo: Record<keyof Repository<Restaurant>, jest.Mock>;
  let pubSub: Record<keyof PubSub, jest.Mock>;
  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        OrderService,
        { provide: getRepositoryToken(Order), useValue: getMockedRepo() },
        { provide: getRepositoryToken(Restaurant), useValue: getMockedRepo() },
        { provide: PUBSUB_TOKEN, useValue: getMockedPubSub() },
      ],
    }).compile();
    orderService = module.get(OrderService);
    ordersRepo = module.get(getRepositoryToken(Order));
    restaurantsRepo = module.get(getRepositoryToken(Restaurant));
    pubSub = module.get(PUBSUB_TOKEN);
  });

  it('should be defined', () => {
    expect(orderService).toBeDefined();
  });

  describe('createOrder', () => {
    it('should return an error if restaurant not found', async () => {});

    it('should return an error if dish not found', async () => {});

    it('should return an error if dish option not found', async () => {});

    it('should create an order', async () => {});

    it('should return an error if it fails', async () => {});
  });

  describe('seeOrders', () => {
    it('should return orders', async () => {});

    it('should return an error if it fails', async () => {});
  });

  describe('canAccessOrder', () => {
    it('should return false if order not provided', async () => {});

    it('should return false if not accesable', async () => {});

    it('should return true if accesable', async () => {});
  });

  describe('seeOrder', () => {
    it('should return an error if order not found', async () => {});

    it('should return an error if not accesable', async () => {});

    it('should return an order', async () => {});

    it('should return an error if it fails', async () => {});
  });

  describe('editOrderStatus', () => {
    it('should return an error if order not found', async () => {});

    it('should return an error if not accesable', async () => {});

    it('should return an error if not allowed', async () => {});

    it('should edit order status', async () => {});

    it('should return an error if it fails', async () => {});
  });

  describe('pickupOrder', () => {
    it('should return an error if order not found', async () => {});

    it('should pickup order', async () => {});

    it('should return an error if it fails', async () => {});
  });
});
