import {Column, PrimaryGeneratedColumn, Entity, BeforeInsert, BeforeUpdate, OneToOne, JoinColumn, ManyToMany, JoinTable} from 'typeorm';
import { validateOrReject, IsDefined, registerDecorator, ValidationArguments } from 'class-validator';
import {Team} from './Team';
import { Submission } from './Submission';
import { Prize } from './Prize';

@Entity()
export class Challenge {

    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    name!: string;

    @Column()
    description!: string;

    @Column()
    type!: string;

    @ManyToMany(() => Submission)
    @JoinTable()
    submissions?: Submission[];

    @ManyToMany(() => Prize, {cascade: true})
    @JoinTable()
    prizes?: Prize[];

    @BeforeInsert()
    @BeforeUpdate()
    async validate(): Promise<void> {
        await validateOrReject(this);
    }
}