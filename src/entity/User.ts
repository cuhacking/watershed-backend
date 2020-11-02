import {Column, PrimaryGeneratedColumn, Entity, BeforeInsert, BeforeUpdate} from 'typeorm';
import { validateOrReject, IsDefined, registerDecorator, ValidationArguments } from 'class-validator';

export enum Role {
    Hacker,
    Sponsor,
    Organizer
};

function ValidRole() {
    return function (object: Object, propertyName: string) {
      registerDecorator({
        name: 'validRole',
        target: object.constructor,
        propertyName: propertyName,
        validator: {
          validate(value: any, args: ValidationArguments) {
              return Object.values(Role).includes(value);
          },
        },
      });
    };
  }
@Entity()
export class User {

    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    @IsDefined()
    uuid!: string;

    @Column()
    @IsDefined()
    firstName!: string;

    @Column()
    @IsDefined()
    lastName!: string;

    @Column({unique: true})
    @IsDefined()
    email!: string;

    @Column()
    @IsDefined()
    password!: string;

    @Column({nullable: true})
    @ValidRole()
    role?: Role;

    @Column({nullable: true})
    discordId?: string;

    @Column({nullable: true})
    githubId?: string;

    @BeforeInsert()
    @BeforeUpdate()
    async validate(): Promise<void> {
        await validateOrReject(this);
    }
}