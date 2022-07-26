import { Field, Int, ObjectType, registerEnumType } from '@nestjs/graphql';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

enum UserRole {
  Customer = 'Customer',
  Owner = 'Owner',
  Driver = 'Driver',
}

registerEnumType(UserRole, { name: 'UserRole' });

@Entity()
@ObjectType()
export class User {
  @PrimaryGeneratedColumn()
  @Field(type => Int)
  id: number;

  @Column({ unique: true })
  @Field(type => String)
  email: string;

  @Column()
  @Field(type => String)
  password: string;

  @Column({ type: 'enum', enum: UserRole })
  @Field(type => UserRole)
  role: UserRole;
}
