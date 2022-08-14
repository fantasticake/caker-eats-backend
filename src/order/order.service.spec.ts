import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PubSub } from 'graphql-subscriptions';
import { Restaurant } from 'src/restaurant/entities/restaurant.entity';
import { PUBSUB_TOKEN } from 'src/shared/shared.constants';
import {
  customerTestData,
  dishTestData,
  driverTestData,
  orderTestData,
  ownerTestData,
  restaurantTestData,
} from 'src/test/test.data';
import { Repository } from 'typeorm';
import { CreateOrderInput } from './dtos/create-order.dto';
import { EditOrderStatusInput } from './dtos/edit-order-status.dto';
import { PickupOrderInput } from './dtos/pickup-order.dto';
import { SeeOrderInput } from './dtos/see-order.dto';
import { Order, OrderStatus } from './entities/order.entity';
import {
  ORDER_CREATED_TRIGGER,
  ORDER_STATUS_CHANGED_TRIGGER,
} from './order.constants';
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
    const input: CreateOrderInput = {
      restaurantId: orderTestData.restaurant.id,
      dishes: orderTestData.dishes,
      location: orderTestData.location,
    };
    it('should return an error if restaurant not found', async () => {
      restaurantsRepo.findOne.mockResolvedValueOnce(null);
      const result = await orderService.createOrder(input, customerTestData);
      expect(restaurantsRepo.findOne).toBeCalledTimes(1);
      expect(restaurantsRepo.findOne).toBeCalledWith({
        where: { id: input.restaurantId },
        relations: ['menu'],
      });
      expect(result).toEqual({ ok: false, error: 'Restaurant not found.' });
    });

    it('should return an error if dish not found', async () => {
      restaurantsRepo.findOne.mockResolvedValueOnce(restaurantTestData);
      const result = await orderService.createOrder(input, customerTestData);
      expect(result).toEqual({ ok: false, error: 'Dish not found.' });
    });

    it('should return an error if dish option not found', async () => {
      restaurantsRepo.findOne.mockResolvedValueOnce({
        ...restaurantTestData,
        menu: [{ ...dishTestData, options: [] }],
      });
      const result = await orderService.createOrder(input, customerTestData);
      expect(result).toEqual({ ok: false, error: 'Dish option not found.' });
    });

    it('should create an order', async () => {
      restaurantsRepo.findOne.mockResolvedValueOnce({
        ...restaurantTestData,
        menu: [dishTestData],
      });
      ordersRepo.create.mockReturnValueOnce(orderTestData);
      ordersRepo.save.mockResolvedValueOnce(orderTestData);
      const result = await orderService.createOrder(input, customerTestData);
      expect(ordersRepo.create).toBeCalledTimes(1);
      expect(ordersRepo.create).toBeCalledWith({
        ...input,
        restaurant: {
          ...restaurantTestData,
          menu: [dishTestData],
        },
        customer: customerTestData,
      });
      expect(ordersRepo.save).toBeCalledTimes(1);
      expect(ordersRepo.save).toBeCalledWith(orderTestData);
      expect(pubSub.publish).toBeCalledTimes(1);
      expect(pubSub.publish).toBeCalledWith(ORDER_CREATED_TRIGGER, {
        orderCreated: orderTestData,
      });
      expect(result).toEqual({ ok: true });
    });

    it('should return an error if it fails', async () => {
      restaurantsRepo.findOne.mockRejectedValueOnce(new Error());
      const result = await orderService.createOrder(input, customerTestData);
      expect(result).toEqual({ ok: false, error: 'Cannot create an order.' });
    });
  });

  describe('seeOrders', () => {
    it('should return orders', async () => {
      ordersRepo.findBy.mockResolvedValueOnce([orderTestData]);
      const result = await orderService.seeOrders(customerTestData);
      expect(ordersRepo.findBy).toBeCalledTimes(1);
      expect(ordersRepo.findBy).toBeCalledWith({
        customer: { id: customerTestData.id },
      });
      expect(result).toEqual({ ok: true, result: [orderTestData] });
    });

    it('should return an error if it fails', async () => {
      ordersRepo.findBy.mockRejectedValueOnce(new Error());
      const result = await orderService.seeOrders(customerTestData);
      expect(result).toEqual({ ok: false, error: 'Cannot see orders.' });
    });
  });

  describe('canAccessOrder', () => {
    it('should return false if not accesable', () => {
      const result = orderService.canAccessOrder(orderTestData, {
        ...customerTestData,
        id: 999,
      });
      expect(result).toEqual(false);
    });

    it('should return true if accesable', () => {
      const result = orderService.canAccessOrder(
        orderTestData,
        customerTestData,
      );
      expect(result).toEqual(true);
    });
  });

  describe('seeOrder', () => {
    const input: SeeOrderInput = {
      orderId: orderTestData.id,
    };
    it('should return an error if order not found', async () => {
      ordersRepo.findOne.mockResolvedValueOnce(null);
      const result = await orderService.seeOrder(input, customerTestData);
      expect(ordersRepo.findOne).toBeCalledTimes(1);
      expect(ordersRepo.findOne).toBeCalledWith({
        where: {
          id: input.orderId,
        },
        relations: ['restaurant', 'driver', 'customer'],
      });
      expect(result).toEqual({ ok: false, error: 'Order not found.' });
    });

    it('should return an error if not accesable', async () => {
      ordersRepo.findOne.mockResolvedValueOnce(orderTestData);
      const result = await orderService.seeOrder(input, {
        ...customerTestData,
        id: 999,
      });
      expect(result).toEqual({ ok: false, error: 'Cannot access an order.' });
    });

    it('should return an order', async () => {
      ordersRepo.findOne.mockResolvedValueOnce(orderTestData);
      const result = await orderService.seeOrder(input, customerTestData);
      expect(result).toEqual({ ok: true, result: orderTestData });
    });

    it('should return an error if it fails', async () => {
      ordersRepo.findOne.mockRejectedValueOnce(new Error());
      const result = await orderService.seeOrder(input, customerTestData);
      expect(result).toEqual({ ok: false, error: 'Cannot see an order.' });
    });
  });

  describe('editOrderStatus', () => {
    const input: EditOrderStatusInput = {
      orderId: orderTestData.id,
      status: OrderStatus.Cooking,
    };
    it('should return an error if order not found', async () => {
      ordersRepo.findOne.mockResolvedValueOnce(null);
      const result = await orderService.editOrderStatus(input, ownerTestData);
      expect(ordersRepo.findOne).toBeCalledTimes(1);
      expect(ordersRepo.findOne).toBeCalledWith({
        where: {
          id: input.orderId,
        },
        relations: ['restaurant'],
      });
      expect(result).toEqual({ ok: false, error: 'Order not found.' });
    });

    it('should return an error if not accesable', async () => {
      ordersRepo.findOne.mockResolvedValueOnce(orderTestData);
      const result = await orderService.editOrderStatus(input, {
        ...ownerTestData,
        id: 999,
      });
      expect(result).toEqual({ ok: false, error: 'Cannot access an order.' });
    });

    it('should return an error if not allowed', async () => {
      ordersRepo.findOne.mockResolvedValueOnce(orderTestData);
      const result = await orderService.editOrderStatus(
        { ...input, status: OrderStatus.PickedUp },
        ownerTestData,
      );
      expect(result).toEqual({
        ok: false,
        error: 'Not allowed to edit order status.',
      });
    });

    it('should edit order status', async () => {
      ordersRepo.findOne.mockResolvedValueOnce(orderTestData);
      ordersRepo.save.mockResolvedValueOnce(orderTestData);
      const result = await orderService.editOrderStatus(input, ownerTestData);
      expect(ordersRepo.save).toBeCalledTimes(1);
      expect(ordersRepo.save).toBeCalledWith({
        ...orderTestData,
        status: input.status,
      });
      expect(pubSub.publish).toBeCalledTimes(1);
      expect(pubSub.publish).toBeCalledWith(ORDER_STATUS_CHANGED_TRIGGER, {
        orderStatusChanged: orderTestData,
      });
      expect(result).toEqual({ ok: true });
    });

    it('should return an error if it fails', async () => {
      ordersRepo.findOne.mockRejectedValueOnce(new Error());
      const result = await orderService.editOrderStatus(input, ownerTestData);
      expect(result).toEqual({
        ok: false,
        error: 'Cannot edit an order status.',
      });
    });
  });

  describe('pickupOrder', () => {
    const input: PickupOrderInput = {
      orderId: orderTestData.id,
    };
    it('should return an error if order not found', async () => {
      ordersRepo.findOneBy.mockResolvedValueOnce(null);
      const result = await orderService.pickupOrder(input, driverTestData);
      expect(ordersRepo.findOneBy).toBeCalledTimes(1);
      expect(ordersRepo.findOneBy).toBeCalledWith({
        id: input.orderId,
      });
      expect(result).toEqual({ ok: false, error: 'Order not found.' });
    });

    it('should pickup order', async () => {
      ordersRepo.findOneBy.mockResolvedValueOnce(orderTestData);
      const result = await orderService.pickupOrder(input, driverTestData);
      expect(ordersRepo.save).toBeCalledTimes(1);
      expect(ordersRepo.save).toBeCalledWith({
        ...orderTestData,
        driver: driverTestData,
        status: OrderStatus.PickedUp,
      });
      expect(result).toEqual({ ok: true });
    });

    it('should return an error if it fails', async () => {
      ordersRepo.findOneBy.mockRejectedValueOnce(new Error());
      const result = await orderService.pickupOrder(input, driverTestData);
      expect(result).toEqual({ ok: false, error: 'Cannot pickup an order.' });
    });
  });
});
