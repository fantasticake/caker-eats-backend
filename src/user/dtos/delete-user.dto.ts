import { ObjectType } from '@nestjs/graphql';
import { SharedOutput } from 'src/shared/shared.dto';

@ObjectType()
export class DeleteUserOutput extends SharedOutput {}
