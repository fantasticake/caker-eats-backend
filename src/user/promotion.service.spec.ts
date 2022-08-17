import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Restaurant } from 'src/restaurant/entities/restaurant.entity';
import {
  ownerTestData,
  promotionTestData,
  restaurantTestData,
} from 'src/test/test.data';
import { LessThan, Repository } from 'typeorm';
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
  let restaurantsRepo: Record<keyof Repository<Restaurant>, jest.Mock>;

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
    restaurantsRepo = module.get(getRepositoryToken(Restaurant));
  });

  it('should be defined', () => {
    expect(promotionService).toBeDefined();
  });

  describe('createPromotion', () => {
    const input: CreatePromotionInput = {
      transactionId: promotionTestData.transactionId,
    };
    it('should return an error if restaurant does not exist', async () => {
      const result = await promotionService.createPromotion(input, {
        ...ownerTestData,
        restaurantId: null,
      });
      expect(result).toEqual({ ok: false, error: 'Restaurant not exists.' });
    });

    it('should create a promotion & promote a restaurant', async () => {
      restaurantsRepo.findOneBy.mockResolvedValueOnce(restaurantTestData);
      promotionsRepo.create.mockReturnValueOnce(promotionTestData);
      const result = await promotionService.createPromotion(
        input,
        ownerTestData,
      );
      expect(promotionsRepo.create).toBeCalledTimes(1);
      expect(promotionsRepo.create).toBeCalledWith({
        ...input,
        owner: { id: ownerTestData.id },
      });
      expect(promotionsRepo.save).toBeCalledTimes(1);
      expect(promotionsRepo.save).toBeCalledWith(promotionTestData);
      expect(restaurantsRepo.findOneBy).toBeCalledTimes(1);
      expect(restaurantsRepo.findOneBy).toBeCalledWith({
        id: ownerTestData.restaurantId,
      });
      expect(restaurantsRepo.save).toBeCalledTimes(1);
      expect(restaurantsRepo.save).toBeCalledWith({
        id: ownerTestData.restaurantId,
        isPromoted: true,
        promotionExpireDate: expect.any(Date),
      });
      expect(result).toEqual({ ok: true });
    });

    it('should return an error if it fails', async () => {
      restaurantsRepo.findOneBy.mockRejectedValueOnce(new Error());
      const result = await promotionService.createPromotion(
        input,
        ownerTestData,
      );
      expect(result).toEqual({
        ok: false,
        error: 'Cannot create a promotion.',
      });
    });
  });

  describe('seePromotions', () => {
    it('should return a promotions', async () => {
      promotionsRepo.findBy.mockResolvedValueOnce([promotionTestData]);
      const result = await promotionService.seePromotions(ownerTestData);
      expect(promotionsRepo.findBy).toBeCalledTimes(1);
      expect(promotionsRepo.findBy).toBeCalledWith({
        owner: { id: ownerTestData.id },
      });
      expect(result).toEqual({ ok: true, result: [promotionTestData] });
    });

    it('should return an error if it fails', async () => {
      promotionsRepo.findBy.mockRejectedValueOnce(new Error());
      const result = await promotionService.seePromotions(ownerTestData);
      expect(result).toEqual({ ok: false, error: 'Cannot see promotions.' });
    });
  });

  describe('checkPromotions', () => {
    const expiredRestaurant = {
      ...restaurantTestData,
      isPromoted: true,
    };
    it('should check promotions', async () => {
      restaurantsRepo.find.mockResolvedValueOnce([expiredRestaurant]);
      await promotionService.checkPromotions();
      expect(restaurantsRepo.find).toBeCalledTimes(1);
      expect(restaurantsRepo.find).toBeCalledWith({
        where: {
          isPromoted: true,
          promotionExpireDate: LessThan(expect.any(Date)),
        },
      });
      expect(restaurantsRepo.save).toBeCalledTimes(1);
      expect(restaurantsRepo.save).toBeCalledWith({
        ...expiredRestaurant,
        isPromoted: false,
      });
    });
  });
});
