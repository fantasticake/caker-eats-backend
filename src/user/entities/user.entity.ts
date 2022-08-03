import { Field, ObjectType, registerEnumType } from '@nestjs/graphql';
import { SharedEntity } from 'src/shared/shared.entity';
import { Column, Entity } from 'typeorm';

enum UserRole {
  Customer = 'Customer',
  Owner = 'Owner',
  Driver = 'Driver',
}

registerEnumType(UserRole, { name: 'UserRole' });

@Entity()
@ObjectType()
export class User extends SharedEntity {
  @Column({ unique: true })
  @Field(type => String)
  email: string;

  @Column()
  @Field(type => String)
  password: string;

  @Column({ type: 'enum', enum: UserRole })
  @Field(type => UserRole)
  role: UserRole;

  @Column({ default: false })
  @Field(type => Boolean)
  verified: boolean;
}
