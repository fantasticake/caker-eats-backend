import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Restaurant } from 'src/restaurant/entities/restaurant.entity';
import { customer } from 'src/test/test.data';
import { Repository } from 'typeorm';
import { CreatePromotionInput } from './dtos/create-promotion.dto';
import { Promotion } from './entities/promotion.entity';
import { PromotionService } from './promotion.service';

const getMockedRepo = () => {
  return {
    save: jest.fn(),
    create: jest.fn(),
    findBy: jest.fn(),
    findOneBy: jest.fn(),
    find: jest.fn(),
  };
};

describe('PromotionService', () => {
  let promotionService: PromotionService;
  let promotionsRepo: Record<keyof Repository<Promotion>, jest.Mock>;
  let restaurantRepo: Record<keyof Repository<Restaurant>, jest.Mock>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        PromotionService,
        { provide: getRepositoryToken(Promotion), useValue: getMockedRepo() },
        { provide: getRepositoryToken(Restaurant), useValue: getMockedRepo() },
      ],
    }).compile();
    promotionService = module.get(PromotionService);
    promotionsRepo = module.get(getRepositoryToken(Promotion));
    restaurantRepo = module.get(getRepositoryToken(Restaurant));
  });

  it('should be defined', () => {
    expect(promotionService).toBeDefined();
  });

  describe('createPromotion', () => {
    const input: CreatePromotionInput = {
      transactionId: 123,
    };
    it('should return an error if restaurant does not exist', async () => {
      restaurantRepo.findOneBy.mockResolvedValueOnce(null);
      const result = await promotionService.createPromotion(input, customer);
      expect(restaurantRepo.findOneBy).toBeCalledTimes(1);
      expect(restaurantRepo.findOneBy).toBeCalledWith({
        id: customer.restaurantId,
      });
      expect(result).toEqual({ ok: false, error: 'Restaurant not found.' });
    });

    it.todo('should create a promotion & promote a restaurant');
    it.todo('should return an error if it fails');
  });

  describe('seePromotions', () => {
    it.todo('should return a promotions');
    it.todo('should return an error if it fails');
  });

  describe('checkPromotions', () => {
    it.todo('should check promotions');
  });
});
