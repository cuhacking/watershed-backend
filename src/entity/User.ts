import {Column, PrimaryGeneratedColumn, Entity, BeforeInsert, BeforeUpdate, OneToOne, JoinColumn} from 'typeorm';
import { validateOrReject, IsDefined, registerDecorator, ValidationArguments } from 'class-validator';

import {Application} from './Application';

export enum Role {
    Hacker,
    Sponsor,
    Organizer
}

function ValidRole() {
    return function (object: User, propertyName: string) {
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

    @Column({nullable: true, type: 'varchar'})
    firstName?: string | null;

    @Column({nullable: true, type: 'varchar'})
    lastName?: string | null;

    @Column({unique: true})
    @IsDefined()
    email!: string;

    @Column({nullable: true, type: 'varchar'})
    password?: string | null;

    @Column({nullable: true, type: 'int4'})
    @ValidRole()
    role?: Role | null;

    @Column({nullable: true, type: 'varchar'})
    discordId?: string | null;

    @Column({nullable: true, type: 'varchar'})
    githubId?: string | null;

    @OneToOne(() => Application, app => app.user)
    @JoinColumn()
    application?: Application | null;

    @Column({type: 'boolean', default: false})
    @IsDefined()
    confirmed!: boolean;

    @BeforeInsert()
    @BeforeUpdate()
    async validate(): Promise<void> {
        await validateOrReject(this);
    }
}