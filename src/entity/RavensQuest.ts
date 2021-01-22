import {Column, PrimaryGeneratedColumn, Entity, BeforeInsert, BeforeUpdate, OneToOne} from 'typeorm';
import { validateOrReject, IsDefined } from 'class-validator';

import {User} from './User';

@Entity()
export class RavensQuest {

    @PrimaryGeneratedColumn()
    id!: number;

    @OneToOne(() => User, user => user.ravensQuestProgress, {cascade: true})
    user!: User;

    @Column()
    @IsDefined()
    track0Progress!: number;

    @Column()
    @IsDefined()
    track1Progress!: number;

    @Column()
    @IsDefined()
    track2Progress!: number;

    @Column()
    @IsDefined()
    track3Progress!: number;

    @Column()
    @IsDefined()
    currentTrack!: number;

    [index: string]: any;

    @BeforeInsert()
    @BeforeUpdate()
    async validate(): Promise<void> {
        await validateOrReject(this);
    }
}