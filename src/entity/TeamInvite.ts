import {Column, PrimaryGeneratedColumn, Entity, BeforeInsert, BeforeUpdate, ManyToOne} from 'typeorm';
import { validateOrReject, IsDefined, registerDecorator, ValidationArguments } from 'class-validator';
import {User} from './User';
import {Team} from './Team';

@Entity()
export class TeamInvite {

    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    @IsDefined()
    uuid!: string;

    @ManyToOne(() => Team, team => team.invites, {cascade: true})
    @IsDefined()
    team!: Team;

    @ManyToOne(() => User, user => user.teamInvites, {cascade: true})
    @IsDefined()
    user!: Team;

    @BeforeInsert()
    @BeforeUpdate()
    async validate(): Promise<void> {
        await validateOrReject(this);
    }
}