import {Column, PrimaryGeneratedColumn, Entity, BeforeInsert, BeforeUpdate, OneToMany} from 'typeorm';
import { validateOrReject, IsDefined, registerDecorator, ValidationArguments } from 'class-validator';
import {User} from './User';
import {TeamInvite} from './TeamInvite';

@Entity()
export class Announcement {

    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    @IsDefined()
    title!: string;

    @Column({nullable: true, type: 'varchar'})
    description?: string;

    @Column({nullable: true, type: 'varchar'})
    url?: string;

    @Column({type: 'timestamp'})
    @IsDefined()
    time!: Date;

    @BeforeInsert()
    @BeforeUpdate()
    async validate(): Promise<void> {
        await validateOrReject(this);
    }
}