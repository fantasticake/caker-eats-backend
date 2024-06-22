import { ApolloDriver, ApolloDriverConfig } from "@nestjs/apollo";
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { GraphQLModule } from "@nestjs/graphql";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UserModule } from "./user/user.module";
import * as Joi from "joi";
import { User } from "./user/entities/user.entity";
import { JwtModule } from "./jwt/jwt.module";
import { AuthModule } from "./auth/auth.module";
import { Verification } from "./user/entities/verification.entity";
import { MailModule } from "./mail/mail.module";
import { RestaurantModule } from "./restaurant/restaurant.module";
import { Restaurant } from "./restaurant/entities/restaurant.entity";
import { Category } from "./restaurant/entities/catergory.entitiy";
import { Dish } from "./restaurant/entities/dish.entity";
import { OrderModule } from "./order/order.module";
import { Order } from "./order/entities/order.entity";
import { SharedModule } from "./shared/shared.module";
import { HEADER_TOKEN } from "./jwt/jwt.constants";
import { UploadModule } from "./upload/upload.module";
import { Promotion } from "./user/entities/promotion.entity";
import { ScheduleModule } from "@nestjs/schedule";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath:
        process.env.NODE_ENV == "production"
          ? ".env"
          : process.env.NODE_ENV == "development"
          ? ".dev.env"
          : ".test.env",
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().valid("development", "production", "test"),
        DATABASE_URL: Joi.string(),
        JWT_KEY: Joi.string(),
        MAILGUN_API_KEY: Joi.string(),
        MAILGUN_DOMAIN: Joi.string(),
        AWS_KEY_ID: Joi.string(),
        AWS_SECRET_KEY: Joi.string(),
      }),
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      subscriptions: {
        "graphql-ws": true,
      },
      autoSchemaFile: true,
      context: ({ req, connectionParams }) => {
        try {
          let token: string;
          if (req?.headers[HEADER_TOKEN]) token = req.headers[HEADER_TOKEN];
          else if (connectionParams && connectionParams[HEADER_TOKEN])
            token = connectionParams[HEADER_TOKEN];
          return { token };
        } catch (error) {
          console.log(error);
          return;
        }
      },
    }),
    TypeOrmModule.forRoot({
      type: "postgres",
      url: process.env.DATABASE_URL,
      entities: [
        User,
        Verification,
        Restaurant,
        Category,
        Dish,
        Order,
        Promotion,
      ],
      synchronize: process.env.NODE_ENV == "development",
    }),
    ScheduleModule.forRoot(),
    UserModule,
    JwtModule,
    AuthModule,
    MailModule,
    RestaurantModule,
    OrderModule,
    SharedModule,
    UploadModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}

