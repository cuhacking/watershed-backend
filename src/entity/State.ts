import {Column, PrimaryGeneratedColumn, Entity, BeforeInsert, BeforeUpdate} from 'typeorm';
import { validateOrReject, IsDefined } from 'class-validator';

type stateType = 'github' | 'discord'; 

@Entity()
export class State {

    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    @IsDefined()
    state!: string;

    // Github or Discord
    @Column()
    @IsDefined()
    type!: stateType;

    @BeforeInsert()
    @BeforeUpdate()
    async validate(): Promise<void> {
        await validateOrReject(this);
    }
}