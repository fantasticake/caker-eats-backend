import { Global, Module } from '@nestjs/common';
import { PubSub } from 'graphql-subscriptions';
import { PUBSUB_TOKEN } from './shared.constants';

const pubsub = new PubSub();

@Global()
@Module({
  providers: [{ provide: PUBSUB_TOKEN, useValue: pubsub }],
  exports: [PUBSUB_TOKEN],
})
export class SharedModule {}
