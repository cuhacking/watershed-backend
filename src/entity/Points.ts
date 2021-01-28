import {Column, PrimaryGeneratedColumn, Entity, BeforeInsert, BeforeUpdate, OneToOne, JoinColumn, ManyToMany} from 'typeorm';
import { validateOrReject, IsDefined, registerDecorator, ValidationArguments } from 'class-validator';
import { User } from './User';
@Entity()
export class Points {

    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    code!: string;

    @Column()
    value!: number;

    @ManyToMany(() => User)
    redeemed?: User[];

    @BeforeInsert()
    @BeforeUpdate()
    async validate(): Promise<void> {
        await validateOrReject(this);
    }
}